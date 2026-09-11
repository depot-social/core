import type { Category, District, Resource } from '@depot/shared';
import { readonly, ref, watch } from 'vue';

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
    } as Record<string, unknown>);

  // Fetches all resources matching the current filters for the map,
  // ignoring the pagination of the result list
  const fetchMapResources = async () => {
    try {
      const response = await find<Resource>('resources', {
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
        pagination: {
          pageSize: maxPageSize,
          page: page,
        },
      });

      if (response?.data) {
        state.value.resources = response.data;

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
