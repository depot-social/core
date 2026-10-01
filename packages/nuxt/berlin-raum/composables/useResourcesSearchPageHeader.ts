import type { PageHeader, SingleTypeResourcesSearchPage } from '@depot/shared';

/**
 * Editable header of the resources search page (single type "resources-search-page").
 * Resolves to null if the header can't be loaded (e.g. backend not migrated yet),
 * so pages can fall back to their default header instead of failing.
 */
export const useResourcesSearchPageHeader =
  async (): Promise<PageHeader | null> => {
    const { find } = useStrapi();

    try {
      const response = await find<SingleTypeResourcesSearchPage>(
        'resources-search-page',
        {
          populate: {
            header: { populate: ['image'] },
          },
        }
      );

      const page = response.data as unknown as SingleTypeResourcesSearchPage;

      return page?.header ?? null;
    } catch (error) {
      console.warn('Could not load resources search page header', error);

      return null;
    }
  };
