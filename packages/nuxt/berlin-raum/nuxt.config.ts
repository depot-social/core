import type { Resource, SingleTypePage } from '@depot/shared';

const NUXT_LAYERS = process.env.NUXT_LAYERS ?? '';
const extendNuxtLayers = NUXT_LAYERS.split(',').map((layer) => layer.trim());

const resourceBasePath = '/raeume';
const resourceLocaleFile = 'de-raum.json';

export default defineNuxtConfig({
  css: ['~/berlin-raum/assets/css/main.css'],
  components: [{ path: './components', prefix: 'Berlin' }],
  i18n: {
    defaultLocale: 'de',
    locales: [
      {
        code: 'de',
        name: 'de-DE',
        files: ['de-shared.json', resourceLocaleFile],
      },
    ],
    // i18n routes
    // @see https://i18n.nuxtjs.org/docs/guide/custom-paths
    customRoutes: 'config',
    pages: {
      resources: {
        de: resourceBasePath,
      },

      'resources-slug': {
        de: `${resourceBasePath}/[slug]`,
      },

      'resources-slug-edit': {
        de: `${resourceBasePath}/` + '[slug]/bearbeiten',
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
      '/': {
        redirect: resourceBasePath,
      },
    },
  },

  hooks: {
    async 'prerender:routes'(ctx) {
      if (extendNuxtLayers.includes('./berlin-ausleihe')) {
        return;
      }

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
        ctx.routes.add(`${resourceBasePath}/${resource.slug}`);
      }
    },
  },
});
