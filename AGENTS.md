## Coding Agents Guide

See https://agents.md/.

### Project overview
- Monorepo managed by `pnpm workspaces`. Use typescript where possible.
- Services:
  - `@depot/strapi` (backend, Strapi v5) → http://127.0.0.1:1337 (admin `/admin`)
  - `@depot/nuxt` (frontend, Nuxt 4, daisy UI and tailwind 4 for styling, Nuxt UI for forms handling and validation)
- Shared package: `@depot/shared` (utilities, types, requests).
- Strapi plugins: `availabilities`, `conversations` (socket.io), `prices`, `emails`, `import-csv`.
- OpenAPI JSON (generated): `packages/strapi/src/extensions/documentation/documentation/<version>/full_documentation.json`.

### Environment
- Node >= 20, `pnpm` required.
- Root `.env` exists (with `.env.example`) and is loaded by both Strapi and Nuxt.
- Common vars used:
  - Frontend: `PUBLIC_STRAPI_URL`, `PUBLIC_MAPBOX_TOKEN`, `PUBLIC_RANDOM_LOCATION_RADIUS`.
  - Strapi: `HOST`, `PORT`, `APP_KEYS`, `ADMIN_JWT_SECRET`, `REDACT_PRECISE_RESOURCE_LOCATION`.
  - DB: `DATABASE_TYPE` (sqlite/mysql), and related connection vars.
  - Email: `SMTP_*`, `ADMIN_EMAIL`, `REPLY_EMAIL`.
  - Plugin toggles: `STRAPI_PLUGIN_*` (set to `false` to disable).

### Build and run
- Install: `pnpm install`
- Dev (both services): `pnpm dev`
  - Or run separately:
    - Backend: `pnpm --filter @depot/strapi dev`
    - Frontend: `pnpm --filter @depot/nuxt dev`
- Build all: `pnpm build`
- Production (manual):
  - Backend: `pnpm -C packages/strapi start`
  - Frontend: `pnpm -C packages/nuxt preview`

### Tests
- Unit tests: `pnpm test` (Vitest)
- Typical locations: `packages/shared/tests`, component-level tests where present.
- Add new tests close to the code under test; prefer Vitest.

### Code style and conventions
- TypeScript-first; avoid `any` and unsafe casts.
- Linting is configured per package (Nuxt/Qwik). Run `pnpm --filter <pkg> lint` where available.
- Formatting: `pnpm prettier` at repo root (Prettier writes in place).
- Naming: descriptive identifiers; prefer early returns; avoid deep nesting.
- Nuxt specifics:
  - Public runtime config from env (`nuxt.config.ts` → `runtimeConfig.public`).
  - Images use custom provider `localImageSharp` via `packages/nuxt/providers/localImageSharp` (referenced in `nuxt.config.ts`).
  - i18n default locale: `de`; translations at `packages/nuxt/i18n/locales/de.json`. English keys.
  - Layers support enabled. Default layer `base`. Components are prefixed with layer name. For example, component "<BookingForm>" becomes "<BaseBookingForm>". 
- Forms/validation: use Nuxt UI components with `valibot` schemas.
- Workspace usage: scope commands with `pnpm --filter <package>`.

### Security considerations
- Never commit `.env` contents or secrets; rotate `APP_KEYS` and `ADMIN_JWT_SECRET`.
- Validate inputs at both frontend (valibot) and backend (Strapi policies/services).
- Email and external providers must use environment-driven configuration.
- Socket.io CORS in `conversations` should match frontend origin; do not hardcode for production.

### Quick reference
- Start everything: `pnpm dev`
- Rebuild all: `pnpm build`
- Strapi only: `pnpm --filter @depot/strapi dev`
- Nuxt only: `pnpm --filter @depot/nuxt dev`
- Prettier: `pnpm prettier`
- Tests: `pnpm test`


