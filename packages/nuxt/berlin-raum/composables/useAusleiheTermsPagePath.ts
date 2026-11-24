import type { SingleTypePage } from '@depot/shared';

// Strapi `pages` entry holding the terms of use for berlin-ausleihe
const AUSLEIHE_TERMS_PAGE_DOCUMENT_ID = 'u9g5bbj9ad6c1zvt9tfnw1hd';

/**
 * Resolves the path of the berlin-ausleihe terms of use page ("Nutzungsbedingungen").
 * Only fetches when `enabled` is true; returns `undefined` until the page is loaded.
 */
export const useAusleiheTermsPagePath = async (enabled = true) => {
  const { findOne } = useStrapi();

  const { data: termsPage } = await useAsyncData(
    'berlin-ausleihe-terms-page',
    () => findOne<SingleTypePage>('pages', AUSLEIHE_TERMS_PAGE_DOCUMENT_ID),
    { immediate: enabled }
  );

  return computed(() => {
    const slug = termsPage.value?.data?.slug;
    return slug ? `/${slug}` : undefined;
  });
};
