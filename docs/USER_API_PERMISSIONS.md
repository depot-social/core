# User API permissions and public resource providers

Nuxt exposes public provider display values through these fixed endpoints:

- `GET /api/resources`: `q`, comma-separated positive `categoryIds`, `districtIds`,
  `purposeIds`, `excludeDocumentId`, `page`, `pageSize` (1–1000), and `sort`
  (`default` or `pinned-title`).
- `GET /api/resources/by-slug/:slug`: published resource detail.
- `GET /api/resources/:documentId`: public resource and provider preview before booking.

These endpoints do not accept Strapi `populate`, `fields`, `filters`, or `status`
parameters. Resource data is read using the requesting user's JWT, or anonymously.
Only provider display values and the Ausleihe text-address fallback described
below are added using a separate private service token.
The token response never supplies resource addresses or other resource content.
Responses and dynamic SSR pages using these endpoints use
`Cache-Control: private, no-store`. Prerendered pages use anonymous data only.

Public providers contain only the values needed by their view: an organization
flag/name for cards, display name and organization name for booking previews, and
the applicable display name, initials, membership month, and website for detail
pages. No user IDs, email, phone, full profile address objects, account fields, or
organization proof documents are included.

Only the Ausleihe detail response includes a separate `displayAddress` containing
street and ZIP code. It normally uses the resource address. When Strapi explicitly
returns `resource.address: null`, Nuxt may obtain these two text fields from the
provider profile. A present address component (including a redacted or empty one)
or an omitted address field never triggers this fallback. Lists, Raum/Base details,
and booking previews do not read profile addresses. Maps continue to use only
`resource.address`; profile coordinates and address IDs are never included.

The primary Strapi resource-list response includes
`meta.locationAccess.preciseLocationAllowedDocumentIds`, computed by the existing
location policy using the requesting user's credentials. Nuxt allows fallback
streets only for these resource IDs. With redaction enabled, other users receive
only the ZIP code; owners and confirmed booking parties retain precise access.
With redaction disabled, anonymous users also receive the fallback street. Missing
metadata disables the fallback entirely. The private token never decides location
access, and this internal metadata is omitted from Nuxt responses.

## Configure each environment

1. In Strapi **Settings → API Tokens**, create a dedicated **Custom** token with
   only these actions:
   - `api::resource.resource.find`
   - `plugin::users-permissions.user.find`
2. Store its value in Nuxt's private environment as `NUXT_STRAPI_READ_TOKEN`.
   Local development loads the root `.env`. Do not commit the token. Do not use
   `STRAPI_TOKEN`, `strapi.token`, any `PUBLIC_*` variable, or `runtimeConfig.public`:
   the installed `@nuxtjs/strapi` module publishes its token option to the browser.
3. Deploy the updated Strapi and Nuxt applications. The token must be available
   to the Nuxt server and to prerendering when resource pages are generated.
4. In **Settings → Users & Permissions plugin → Roles**, disable user **find**
   and **findOne** for **Public**, **Authenticated**, and any additional end-user
   roles. Preserve the existing authenticated **me** and **updateMe** permissions.
   This is an administrative rollout step, not an application bootstrap action.
5. Complete the checks below before exposing the updated environment.

Do not expand the existing public resource-creation token with user read rights.
Rotate the private read token through the same secret and restart/redeploy Nuxt
as required by the environment. Missing tokens produce a sanitized 503 response;
upstream service-token failures produce a sanitized 502 response.

## Authorized bookings and own profiles

The browser continues to access Strapi bookings using its user JWT. Single GET,
POST, and PUT responses use the same `BookingView` contract after checking that
the current user is the customer or resource owner. `customer` and `resourceOwner`
contain exactly `id`, `firstName`, `lastName`, `email`, and `organizationName`.
No general user permissions are needed. Generic booking lists are not enriched.
`customerAddress` remains the independent booking address, and `resource.user`
is not returned.

Login, own profile, settings, `/users/me`, and the authenticated dashboard stay
direct. The redundant `resources.user` auth populates have been removed. Resource
editors refresh their own profile and compare resource document IDs for the UI;
the existing Strapi ownership policies remain authoritative for writes.

## Acceptance checks

- With no JWT and with an ordinary end-user JWT, verify that `GET /api/users` and
  `GET /api/users/:id` are denied. Attempts to populate users through resource
  queries must be rejected or omit the relation. Verify the private token can
  resolve the provider fields through the fixed resource enrichment query.
- Check Nuxt resource JSON, SSR hydration payloads, prerendered HTML/payloads,
  error responses, and public JavaScript for unexpected user data or token values.
- Check initial loading, client navigation, search, filters, pagination, related
  resources, and booking previews in Base, Raum, and Ausleihe with the Raum layer.
- Verify anonymous/unauthorized resource locations remain redacted when enabled;
  owners and confirmed booking parties retain their previous location access.
  The provider enrichment must never override these results. For Ausleihe details
  with an explicitly missing resource address, also verify the separate text
  fallback with redaction enabled/disabled and with/without precise access. Verify
  that a redacted resource address never triggers a profile fallback and that maps
  still receive no profile coordinates.
- For a real booking, test owner, customer, unauthenticated and unrelated users.
  Verify GET/POST/PUT party fields, confirmation/cancellation permissions, prices,
  notification behavior, and the independent booking address.
- Verify own profile/settings/dashboard and permitted/forbidden resource edits.

Run `pnpm exec vitest run --threads false`, the Strapi build, and Nuxt builds with
an empty `NUXT_LAYERS` for Base (including its prerender hook),
`NUXT_LAYERS=./berlin-raum`, and
`NUXT_LAYERS=./berlin-ausleihe,./berlin-raum`. Run builds sequentially: each rebuilds
the shared package. HTTP acceptance requires a running Strapi instance, the
private token, representative resource/booking data, and the three user contexts.
