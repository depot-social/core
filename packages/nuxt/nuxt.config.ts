import type { Resource, SingleTypePage } from '@depot/shared';
import tailwindcss from '@tailwindcss/vite';

const NUXT_LAYERS = process.env.NUXT_LAYERS ?? '';
const extendNuxtLayers = NUXT_LAYERS.split(',');

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss()],
  },
  extends: [...extendNuxtLayers, './base'],
  modules: [
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxtjs/strapi',
    '@nuxtjs/leaflet',
    '@nuxt/ui',
    '@nuxtjs/plausible',
  ],
  ui: {
    colorMode: false,
    fonts: false,
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  runtimeConfig: {
    public: {
      strapiUrl: process.env.PUBLIC_STRAPI_URL,
      createResourceStrapiApiToken:
        process.env.PUBLIC_CREATE_RESOURCE_STRAPI_API_TOKEN,
      depotBaseUrl: process.env.PUBLIC_DEPOT_BASE_URL || 'https://depot.social',
      mapboxToken: process.env.PUBLIC_MAPBOX_TOKEN || '',
      randomLocationRadius: process.env.PUBLIC_RANDOM_LOCATION_RADIUS || '200',
    },
  },
  i18n: {
    defaultLocale: 'de',
    locales: [{ code: 'de', name: 'de-DE', file: 'de.json' }],
  },
  strapi: {
    url: process.env.PUBLIC_STRAPI_URL,
    auth: {
      populate: [
        'address',
        'resources',
        'resources.user',
        'resources.user.organization',
        'resources.images',
        'resources.prices',
      ],
    },
  },
  image: {
    providers: {
      localImageSharp: {
        provider: '~/base/providers/localImageSharp',
        options: {
          baseURL: `${process.env.PUBLIC_STRAPI_URL}/uploads/`,
        },
      },
    },
    provider: 'localImageSharp',
  },
  // leaflet: {
  //   markerCluster: true,
  // },
  /**
   * Routes: Explicitly add indexable and non-indexable pages
   */
  nitro: {
    prerender: {
      ignore: ['/blog', '/ueber-depot', '/faqs', '/impressum', '/datenschutz'],
    },
  },
  hooks: {
    async 'prerender:routes'(ctx) {
      if (NUXT_LAYERS && NUXT_LAYERS !== '') {
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
        ctx.routes.add(`/resources/${resource.slug}`);
      }
    },
  },
});
