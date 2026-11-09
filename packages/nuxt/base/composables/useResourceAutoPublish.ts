import { computed } from 'vue';

/**
 * Whether resources created or edited by users are published directly
 * (no moderation in the Strapi admin). Mirrors RESOURCE_AUTO_PUBLISH.
 */
export const useResourceAutoPublish = () => {
  const config = useRuntimeConfig();

  return computed(() => config.public.resourceAutoPublish === true);
};
