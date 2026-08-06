import type {
  AccessibilityState,
  BerlinResourceType,
  Category,
  District,
  Resource,
} from '@depot/shared';
import { ResourceTypeComponent } from '@depot/shared';
import { readonly, ref, watch } from 'vue';

export interface ResourcesSearchState {
  resources: Resource[];
  categories: Category[];
  districts: District[];
  selectedCategories: Category[] | null;
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
    accessibilityStates?: AccessibilityState[] | null;
  }
) => {
  const state = ref<ResourcesSearchState>({
    resources: initialResources,
    categories: [],
    districts: [],
    selectedDistricts: initialFilters?.districts || null,
    selectedCategories: initialFilters?.categories || null,
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

  const { find } = useStrapi();

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
        filters: {
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
          categories: state.value.selectedCategories?.length
            ? {
                id: {
                  $in: state.value.selectedCategories.map((p) => p.id),
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
        } as Record<string, unknown>,
        pagination: needsClientSideFiltering
          ? {
              // Fetch all resources when we need to filter by accessibility client-side
              pageSize: 1000,
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
          filteredResources = filteredResources.filter((resource) => {
            const berlinResourceType = resource.resourceTypes?.find(
              (resourceType) =>
                resourceType.__component ===
                ResourceTypeComponent.BERLIN_RESOURCE_TYPE
            ) as BerlinResourceType | undefined;

            return (
              berlinResourceType &&
              state.value.selectedAccessibilityStates?.includes(
                berlinResourceType.accessibilityState
              )
            );
          });

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
      () => state.value.selectedCategories,
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
    state.value.selectedCategories = null;
    state.value.selectedDistricts = null;
    state.value.selectedAccessibilityStates = null;
    activePage.value = 1;
  };

  return {
    state: readonly(state),
    activePage: readonly(activePage),
    setSearchQuery,
    setSelectedCategories,
    setSelectedDistricts,
    setSelectedAccessibilityStates,
    setPage,
    clearFilters,
    // Expose the debounced function for manual triggering if needed
    refetch: fetchResources,
  };
};
