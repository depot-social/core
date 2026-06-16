# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

## Troubleshooting

- `500 - Server Error - at createError...`: Likely thrown by strapi-nuxt adapter, mostly in situations where read-access to a API endpoint is missing. __Solution:__ Check the logs/stdout of strapi for any http code 403 responses and enable read-access for those endpoints in the specific role.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

- `[404] Page not found: /resources/...` (while running `pnpm build` in `packages/nuxt`): Your layer's custom i18n routes clash with nitro's `prerender:routes` called in the root `nuxt.config.ts`. This is a known limitation of nuxt-i18n and only appears at build-time. If you want to use custom routes in your nuxt layer, override the `prerender:routes` method in your nuxt configuration. 
