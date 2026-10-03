import type {
  AccessibilityState,
  BerlinResourceType,
  District,
  Purpose,
  Resource,
} from '@depot/shared';
import { ResourceTypeComponent } from '@depot/shared';
import { readonly, ref, watch } from 'vue';

interface SearchFacetBucket {
  key: string;
  label: string;
  count: number;
}

interface SearchApiResponse {
  results: Resource[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  facets: Record<string, SearchFacetBucket[]>;
}

export interface ResourcesSearchState {
  resources: Resource[];
  purposes: Purpose[];
  districts: District[];
  selectedPurposes: Purpose[] | null;
  selectedDistricts: District[] | null;
  selectedAccessibilityStates: AccessibilityState[] | null;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

// Strapi's `maxLimit`, see packages/strapi/config/api.ts
const MAP_PAGE_SIZE = 1000;

// Only send a free-text query once it is long enough to be meaningful.
const MIN_SEARCH_LENGTH = 3;

export const useResourcesSearch = async (
  initialResources: Resource[] = [],
  maxPageSize: number = 16,
  initialPaginationMeta?: {
    page?: number;
    pageCount?: number;
    total?: number;
  },
  sortParams?: string | string[],
  initialPage?: number,
  syncWithUrl: boolean = false,
  initialFilters?: {
    purposes?: Purpose[] | null;
    districts?: District[] | null;
    accessibilityStates?: AccessibilityState[] | null;
  }
) => {
  const state = ref<ResourcesSearchState>({
    resources: initialResources,
    purposes: [],
    districts: [],
    selectedDistricts: initialFilters?.districts || null,
    selectedPurposes: initialFilters?.purposes || null,
    selectedAccessibilityStates: initialFilters?.accessibilityStates || null,
    searchQuery: '',
    loading: false,
    error: null,
    pagination: {
      page: initialPaginationMeta?.page || 1,
      pageSize: maxPageSize,
      pageCount: initialPaginationMeta?.pageCount || 1,
      total: initialPaginationMeta?.total || 0,
    },
  });

  const activePage = ref(initialPage || 1);

  // The map is not paginated: it shows every resource matching the current
  // filters. Seeded with the resources rendered on the server so the map is
  // populated before the full set has been loaded on the client.
  const mapResources = ref<Resource[]>(initialResources);

  const strapiClient = useStrapiClient();

  // Facet selections are applied as DB-level Strapi filters; the free-text term
  // is handled by the endpoint's `q` param (also reaching dynamic-zone fields).
  const buildFilters = () => {
    const filters: Record<string, unknown> = {};

    if (state.value.selectedPurposes?.length) {
      filters.purposes = {
        id: { $in: state.value.selectedPurposes.map((p) => p.id) },
      };
    }

    if (state.value.selectedDistricts?.length) {
      filters.district = {
        id: { $in: state.value.selectedDistricts.map((d) => d.id) },
      };
    }

    return filters;
  };

  const searchResources = (pagination: { page: number; pageSize: number }) => {
    const trimmedQuery = state.value.searchQuery.trim();
    const q =
      trimmedQuery.length >= MIN_SEARCH_LENGTH ? trimmedQuery : undefined;

    return strapiClient<SearchApiResponse>('/search/resources', {
      params: {
        q,
        filters: buildFilters(),
        sort: sortParams,
        pagination,
      },
    });
  };

  const matchesAccessibilityFilter = (resource: Resource) => {
    const berlinResourceType = resource.resourceTypes?.find(
      (resourceType) =>
        resourceType.__component === ResourceTypeComponent.BERLIN_RESOURCE_TYPE
    ) as BerlinResourceType | undefined;

    return (
      !!berlinResourceType &&
      !!state.value.selectedAccessibilityStates?.includes(
        berlinResourceType.accessibilityState
      )
    );
  };

  // Fetches all resources matching the current filters for the map, ignoring
  // the pagination of the result list.
  const fetchMapResources = async () => {
    try {
      const response = await searchResources({
        page: 1,
        pageSize: MAP_PAGE_SIZE,
      });

      if (!response?.results) return;

      mapResources.value = state.value.selectedAccessibilityStates?.length
        ? response.results.filter(matchesAccessibilityFilter)
        : response.results;
    } catch (error) {
      console.error('Error fetching map resources:', error);
    }
  };

  const fetchResources = async (page: number = activePage.value) => {
    try {
      state.value.loading = true;
      state.value.error = null;

      // Accessibility lives in a dynamic zone, which the search endpoint cannot
      // filter server-side; fetch the full matched set and page it client-side.
      const needsClientSideFiltering =
        state.value.selectedAccessibilityStates?.length;

      const response = await searchResources(
        needsClientSideFiltering
          ? { page: 1, pageSize: MAP_PAGE_SIZE }
          : { page, pageSize: maxPageSize }
      );

      if (!response?.results) return;

      if (state.value.selectedAccessibilityStates?.length) {
        const filteredResources = response.results.filter(
          matchesAccessibilityFilter
        );

        const total = filteredResources.length;
        const pageCount = Math.ceil(total / maxPageSize) || 1;
        const startIndex = (page - 1) * maxPageSize;

        state.value.resources = filteredResources.slice(
          startIndex,
          startIndex + maxPageSize
        );
        state.value.pagination = {
          page,
          pageSize: maxPageSize,
          pageCount,
          total,
        };
      } else {
        state.value.resources = response.results;
        state.value.pagination = { ...response.pagination };
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      state.value.error = 'Error loading resources';
    } finally {
      state.value.loading = false;
    }
  };

  const applyFilterChange = async () => {
    activePage.value = 1; // Reset to first page when filters change

    // Update URL with all current filter state
    if (syncWithUrl && import.meta.client) {
      await updateFiltersInUrl();
    }

    fetchResources(1);
    fetchMapResources();
  };

  // Filter changes always trigger a fetch.
  watch(
    [
      () => state.value.selectedPurposes,
      () => state.value.selectedDistricts,
      () => state.value.selectedAccessibilityStates,
    ],
    applyFilterChange,
    { deep: true }
  );

  // The free-text search only fires once the term reaches the minimum length,
  // or when it is cleared (to reset back to the filter-only result set).
  watch(
    () => state.value.searchQuery,
    (query) => {
      const trimmed = query.trim();
      if (trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH) return;
      applyFilterChange();
    }
  );

  // Watch for changes in activePage
  watch(activePage, (newPage) => {
    fetchResources(newPage);
  });

  const setSearchQuery = (query: string) => {
    state.value.searchQuery = query;
  };

  // Helper function to update URL with all current filter state
  const updateFiltersInUrl = async () => {
    if (syncWithUrl && import.meta.client) {
      const router = useRouter();
      const query = { ...useRoute().query };

      // Remove page param when filters change (reset to page 1)
      delete query.page;

      // Update purposes (using titles)
      if (
        state.value.selectedPurposes &&
        state.value.selectedPurposes.length > 0
      ) {
        query.purposes = state.value.selectedPurposes
          .map((p) => p.title)
          .join(',');
      } else {
        delete query.purposes;
      }

      // Update districts (using names)
      if (
        state.value.selectedDistricts &&
        state.value.selectedDistricts.length > 0
      ) {
        query.districts = state.value.selectedDistricts
          .map((d) => d.name)
          .join(',');
      } else {
        delete query.districts;
      }

      // Update accessibility states
      if (
        state.value.selectedAccessibilityStates &&
        state.value.selectedAccessibilityStates.length > 0
      ) {
        query.accessibility = state.value.selectedAccessibilityStates.join(',');
      } else {
        delete query.accessibility;
      }

      await router.push({ query });
    }
  };

  const setSelectedPurposes = async (
    purposes: Purpose[] | null,
    updateUrl: boolean = syncWithUrl
  ) => {
    state.value.selectedPurposes = purposes;
    if (updateUrl) {
      await updateFiltersInUrl();
    }
  };

  const setSelectedDistricts = async (
    districts: District[] | null,
    updateUrl: boolean = syncWithUrl
  ) => {
    state.value.selectedDistricts = districts;
    if (updateUrl) {
      await updateFiltersInUrl();
    }
  };

  const setSelectedAccessibilityStates = async (
    accessibilityStates: AccessibilityState[] | null,
    updateUrl: boolean = syncWithUrl
  ) => {
    state.value.selectedAccessibilityStates = accessibilityStates;
    if (updateUrl) {
      await updateFiltersInUrl();
    }
  };

  const setPage = async (page: number, updateUrl: boolean = syncWithUrl) => {
    activePage.value = page;

    if (updateUrl && import.meta.client) {
      const router = useRouter();
      await router.push({
        query: {
          ...useRoute().query,
          page: page > 1 ? page.toString() : undefined,
        },
      });
    }
  };

  const clearFilters = () => {
    state.value.searchQuery = '';
    state.value.selectedPurposes = null;
    state.value.selectedDistricts = null;
    state.value.selectedAccessibilityStates = null;
    activePage.value = 1;
  };

  // Load the unpaginated map data on the client, so the initial page render
  // is not blocked by it.
  if (import.meta.client) {
    fetchMapResources();
  }

  return {
    state: readonly(state),
    activePage: readonly(activePage),
    mapResources: readonly(mapResources),
    setSearchQuery,
    setSelectedPurposes,
    setSelectedDistricts,
    setSelectedAccessibilityStates,
    setPage,
    clearFilters,
    // Expose the debounced function for manual triggering if needed
    refetch: fetchResources,
    refetchMapResources: fetchMapResources,
  };
};
