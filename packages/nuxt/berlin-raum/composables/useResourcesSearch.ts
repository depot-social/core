import type {
  AccessibilityState,
  BerlinResourceType,
  District,
  Purpose,
  Resource,
} from '@depot/shared';
import { ResourceTypeComponent } from '@depot/shared';
import { readonly, ref, watch } from 'vue';

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

  const { find } = useStrapi();

  const buildFilters = () =>
    ({
      $or: state.value.searchQuery
        ? [
            {
              title: {
                $contains: state.value.searchQuery,
              },
            },
            {
              description: {
                $contains: state.value.searchQuery,
              },
            },
          ]
        : undefined,
      purposes: state.value.selectedPurposes?.length
        ? {
            id: {
              $in: state.value.selectedPurposes.map((p) => p.id),
            },
          }
        : undefined,
      district: state.value.selectedDistricts?.length
        ? {
            id: {
              $in: state.value.selectedDistricts.map((d) => d.id),
            },
          }
        : undefined,
    } as Record<string, unknown>);

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
      const response = await find<Resource>('resources', {
        // Only what the map markers need
        fields: ['title', 'slug'],
        populate: ['address', 'resourceTypes'],
        // @ts-expect-error - Strapi supports nested sorting but types don't reflect it
        sort: sortParams,
        filters: buildFilters(),
        pagination: {
          pageSize: MAP_PAGE_SIZE,
          page: 1,
        },
      });

      if (!response?.data) return;

      mapResources.value = state.value.selectedAccessibilityStates?.length
        ? response.data.filter(matchesAccessibilityFilter)
        : response.data;
    } catch (error) {
      console.error('Error fetching map resources:', error);
    }
  };

  const fetchResources = async (page: number = activePage.value) => {
    try {
      state.value.loading = true;
      state.value.error = null;

      // When accessibility filter is active, we need to fetch all resources
      // and filter/paginate client-side (Strapi v5 doesn't support dynamic zone filtering)
      const needsClientSideFiltering =
        state.value.selectedAccessibilityStates?.length;

      const response = await find<Resource>('resources', {
        populate: [
          'categories',
          'images',
          'address',
          'prices',
          'user',
          'user.organization',
          'resourceTypes',
        ],
        // @ts-expect-error - Strapi supports nested sorting but types don't reflect it
        sort: sortParams,
        filters: buildFilters(),
        pagination: needsClientSideFiltering
          ? {
              // Fetch all resources when we need to filter by accessibility client-side
              pageSize: MAP_PAGE_SIZE,
              page: 1,
            }
          : {
              pageSize: maxPageSize,
              page: page,
            },
      });

      if (response?.data) {
        let filteredResources = response.data;

        // Client-side filtering for accessibility states (since Strapi v5 dynamic zone filtering is complex)
        if (state.value.selectedAccessibilityStates?.length) {
          filteredResources = filteredResources.filter(
            matchesAccessibilityFilter
          );

          // Client-side pagination for accessibility-filtered results
          const total = filteredResources.length;
          const pageCount = Math.ceil(total / maxPageSize) || 1;
          const startIndex = (page - 1) * maxPageSize;
          const endIndex = startIndex + maxPageSize;
          const paginatedResources = filteredResources.slice(
            startIndex,
            endIndex
          );

          state.value.resources = paginatedResources;
          state.value.pagination = {
            page: page,
            pageSize: maxPageSize,
            pageCount: pageCount,
            total: total,
          };
        } else {
          state.value.resources = filteredResources;

          // Update pagination state from response
          if (response.meta?.pagination) {
            const pagination = response.meta.pagination;
            state.value.pagination = {
              page: 'page' in pagination ? pagination.page : 1,
              pageSize:
                'pageSize' in pagination ? pagination.pageSize : maxPageSize,
              pageCount: 'pageCount' in pagination ? pagination.pageCount : 1,
              total: pagination.total || 0,
            };
          }
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      state.value.error = 'Error loading resources';
    } finally {
      state.value.loading = false;
    }
  };

  // Watch for changes in search query or selected filters
  watch(
    [
      () => state.value.searchQuery,
      () => state.value.selectedPurposes,
      () => state.value.selectedDistricts,
      () => state.value.selectedAccessibilityStates,
    ],
    async () => {
      activePage.value = 1; // Reset to first page when filters change

      // Update URL with all current filter state
      if (syncWithUrl && import.meta.client) {
        await updateFiltersInUrl();
      }

      fetchResources(1);
      fetchMapResources();
    },
    { deep: true }
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
