import type { Strapi5Error } from '@nuxtjs/strapi';

export default defineNuxtPlugin((nuxt) => {
  const toast = useToast();

  if (import.meta.env.dev) {
    nuxt.hook('strapi:error', (e: Strapi5Error) => {
      toast.add({ title: e.error.name, description: e.error.message });
    });
  }
});
