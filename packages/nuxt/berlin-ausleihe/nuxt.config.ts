import type { Resource, SingleTypePage } from '@depot/shared';

const resourceBasePath = '/ressourcen';
const resourceLocaleFile = 'de-ausleihe.json';

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
        de:  '/ressource-hinzufuegen',
      },

      'bookings-add': {
        de: '/ressource-buchen',
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
      const strapiUrl = process.env.PUBLIC_STRAPI_URL;

      if (!strapiUrl) {
        throw new Error('Missing PUBLIC_STRAPI_URL');
      }

      // Add content pages
      const { data: pageData } = await fetch(`${strapiUrl}/api/pages`).then(
        (res) => res.json()
      );

      for (const page of pageData as SingleTypePage[]) {
        ctx.routes.add(`/${page.slug}`);
      }

      // Add resource pages
      const { data: resourceData } = await fetch(
        `${strapiUrl}/api/resources`
      ).then((res) => res.json());

      for (const resource of resourceData as Resource[]) {
        ctx.routes.add(`${resourceBasePath}/${resource.slug}`);
      }
    },
  },
});
