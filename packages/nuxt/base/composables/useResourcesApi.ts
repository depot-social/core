import type {
  PublicResource,
  ResourcesQuery,
  StrapiResponse,
} from '@depot/shared';

export const useResourcesApi = () => {
  // The parent SSR page may contain an authorized precise resource location.
  // An internal API response's cache header does not protect the HTML response.
  if (import.meta.server && !import.meta.prerender) {
    useResponseHeader('Cache-Control').value = 'private, no-store';
  }
  // useRequestFetch forwards the user's cookies during SSR; prerender has no user.
  const request = useRequestFetch();
  return {
    list: (query: ResourcesQuery = {}) =>
      request<StrapiResponse<PublicResource[]>>('/api/resources', { query }),
    bySlug: (slug: string) =>
      request<StrapiResponse<PublicResource>>(
        `/api/resources/by-slug/${encodeURIComponent(slug)}`
      ),
    byId: (documentId: string) =>
      request<StrapiResponse<PublicResource>>(
        `/api/resources/${encodeURIComponent(documentId)}`
      ),
  };
};
