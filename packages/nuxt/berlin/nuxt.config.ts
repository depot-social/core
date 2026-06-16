import type { Resource, SingleTypePage } from '@depot/shared';

export default defineNuxtConfig({
  css: ['~/berlin/assets/css/main.css'],
  components: [{ path: './components', prefix: 'Berlin' }],
  i18n: {
    defaultLocale: 'de',
    locales: [{ code: 'de', name: 'de-DE', file: 'de.json' }],
    // i18n routes
    // @see https://i18n.nuxtjs.org/docs/guide/custom-paths
    customRoutes: 'config',
    pages: {
      resources: {
        de: '/raeume',
      },
      'resources-slug': {
        de: '/raeume/[slug]',
      },
      'resources-add': {
        de: '/raum-hinzufuegen',
      },
      'bookings-add': {
        de: '/raum-buchen',
      },
      raffle: {
        de: '/schluessel-tresor-vergabe',
      },
      'raffle-success': {
        de: '/schluessel-tresor-vergabe/danke',
      },
    },
  },
  nitro: {
    routeRules: {
      '/': { redirect: '/raeume' },
    },
  },
  hooks: {
    async 'prerender:routes'(ctx) {
      // Add content pages
      const { data: pageData } = await fetch(
        `${process.env.PUBLIC_STRAPI_URL}/api/pages`
      ).then((res) => res.json());

      for (const page of pageData as SingleTypePage[]) {
        ctx.routes.add(`/${page.slug}`);
      }

      // Add resource pages
      const { data: resourceData } = await fetch(
        `${process.env.PUBLIC_STRAPI_URL}/api/resources`
      ).then((res) => res.json());

      for (const resource of resourceData as Resource[]) {
        ctx.routes.add(`/raeume/${resource.slug}`);
      }
    },
  },
});
