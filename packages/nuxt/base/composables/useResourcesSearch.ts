import { ref, readonly, watch } from 'vue';
import type { Resource, Category } from '@depot/shared';

export interface ResourcesSearchState {
  resources: Resource[];
  categories: Category[];
  selectedCategory: Category | null;
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
  maxPageSize: number = 16
) => {
  const state = ref<ResourcesSearchState>({
    resources: initialResources,
    categories: [],
    selectedCategory: null,
    searchQuery: '',
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pageSize: maxPageSize,
      pageCount: 1,
      total: 0,
    },
  });

  const activePage = ref(1);

  const { find } = useStrapi();

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
        ],
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
          categories: state.value.selectedCategory?.id
            ? {
                $contains: state.value.selectedCategory.id,
              }
            : undefined,
        },
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

  // Watch for changes in search query or selected category
  watch(
    [() => state.value.searchQuery, () => state.value.selectedCategory],
    () => {
      activePage.value = 1; // Reset to first page when filters change
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

  const setSelectedCategory = (category: Category | null) => {
    state.value.selectedCategory = category;
  };

  const setPage = (page: number) => {
    activePage.value = page;
  };

  const clearFilters = () => {
    state.value.searchQuery = '';
    state.value.selectedCategory = null;
    activePage.value = 1;
  };

  return {
    state: readonly(state),
    activePage: readonly(activePage),
    setSearchQuery,
    setSelectedCategory,
    setPage,
    clearFilters,
    // Expose the debounced function for manual triggering if needed
    refetch: fetchResources,
  };
};
