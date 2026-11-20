import type { User } from '@depot/shared';

export const useOwnResourceOwnership = () => {
  const { fetchUser } = useStrapiAuth();
  return {
    async assertOwnResource(documentId: string) {
      const user = (await fetchUser()) as Ref<User | null>;
      if (
        !user.value?.resources?.some(
          (resource) => resource.documentId === documentId
        )
      ) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Authorization required',
        });
      }
    },
  };
};
