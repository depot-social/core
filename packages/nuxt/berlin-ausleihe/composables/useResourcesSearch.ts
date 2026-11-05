import type { Category, District, Resource } from '@depot/shared';
import { computed, readonly, ref, watch } from 'vue';

export interface ResourcesSearchState {
  resources: Resource[];
  categories: Category[];
  districts: District[];
  selectedCategories: Category[] | null;
  selectedDistricts: District[] | null;
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

const RESOURCE_POPULATE = [
  'address',
  'resourceTypes',
  'images',
  'prices',
  'district',
  'user',
  'user.organization',
  'purposes',
  'categories',
  'attributes',
  'attributes.attribute',
];

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
    categories?: Category[] | null;
    districts?: District[] | null;
  }
) => {
  const state = ref<ResourcesSearchState>({
    resources: initialResources,
    categories: [],
    districts: [],
    selectedDistricts: initialFilters?.districts || null,
    selectedCategories: initialFilters?.categories || null,
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

  const mapResources = ref<Resource[]>(initialResources);

  const { find } = useStrapi();

  // The free-text term only counts once it reaches the minimum length;
  // anything shorter behaves like an empty search.
  const getEffectiveQuery = () => {
    const query = state.value.searchQuery.trim();
    return query.length >= MIN_SEARCH_LENGTH ? query : '';
  };

  // Facet selections are applied as DB-level Strapi filters; the free-text term
  // filters the hidden `searchIndex` field (filled by the search plugin on save).
  const buildFilters = () => {
    const filters: Record<string, unknown> = {};

    if (state.value.selectedCategories?.length) {
      filters.categories = {
        id: { $in: state.value.selectedCategories.map((c) => c.id) },
      };
    }

    if (state.value.selectedDistricts?.length) {
      filters.district = {
        id: { $in: state.value.selectedDistricts.map((d) => d.id) },
      };
    }

    const query = getEffectiveQuery();
    if (query) {
      filters.searchIndex = { $containsi: query };
    }

    return filters;
  };

  const searchResources = async (pagination: {
    page: number;
    pageSize: number;
  }) => {
    const response = await find<Resource>('resources', {
      // @ts-expect-error - Strapi supports component and nested populate but types don't reflect it
      populate: RESOURCE_POPULATE,
      // @ts-expect-error - Strapi supports nested sorting but types don't reflect it
      sort: sortParams,
      filters: buildFilters(),
      pagination,
    });

    const meta = response.meta?.pagination;

    return {
      results: response.data,
      pagination: {
        page: meta && 'page' in meta ? meta.page : pagination.page,
        pageSize:
          meta && 'pageSize' in meta ? meta.pageSize : pagination.pageSize,
        pageCount: meta && 'pageCount' in meta ? meta.pageCount : 1,
        total: meta?.total ?? 0,
      },
    };
  };

  // Fetches all resources matching the current filters for the map,
  // ignoring the pagination of the result list
  const fetchMapResources = async () => {
    try {
      const response = await find<Resource>('resources', {
        // Only what the map markers need
        fields: ['title', 'slug'],
        populate: ['address'],
        // @ts-expect-error - Strapi supports nested sorting but types don't reflect it
        sort: sortParams,
        filters: buildFilters(),
        pagination: {
          pageSize: MAP_PAGE_SIZE,
          page: 1,
        },
      });

      if (response?.data) {
        mapResources.value = response.data;
      }
    } catch (error) {
      console.error('Error fetching map resources:', error);
    }
  };

  const fetchResources = async (page: number = activePage.value) => {
    try {
      state.value.loading = true;
      state.value.error = null;

      const response = await searchResources({ page, pageSize: maxPageSize });

      if (response?.results) {
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
    [() => state.value.selectedCategories, () => state.value.selectedDistricts],
    applyFilterChange,
    { deep: true }
  );

  // Fires only when the effective query changes, so dropping below the
  // minimum length resets back to the filter-only result set.
  watch(getEffectiveQuery, applyFilterChange);

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
        state.value.selectedCategories &&
        state.value.selectedCategories.length > 0
      ) {
        query.categories = state.value.selectedCategories
          .map((p) => p.title)
          .join(',');
      } else {
        delete query.categories;
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

      await router.push({ query });
    }
  };

  const setSelectedCategories = async (
    categories: Category[] | null,
    updateUrl: boolean = syncWithUrl
  ) => {
    state.value.selectedCategories = categories;
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
    state.value.selectedCategories = null;
    state.value.selectedDistricts = null;
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
    activeSearchQuery: computed(getEffectiveQuery),
    setSearchQuery,
    setSelectedCategories,
    setSelectedDistricts,
    setPage,
    clearFilters,
    // Expose the debounced function for manual triggering if needed
    refetch: fetchResources,
    refetchMapResources: fetchMapResources,
  };
};
