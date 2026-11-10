# Installation and Strapi setup

This guide prepares a depot installation from an empty database. It applies independently of how the application processes are started. For container lifecycle and commands inside containers, see [Docker development](DOCKER.md).

The application distinguishes three things: configuration files and environment variables, Strapi settings/permissions stored in the database, and website content. Starting the servers creates database tables; it does not complete the latter two setup steps.

## 1. Prepare the environment

Use Node.js **22 LTS** and pnpm **11.20.0**, matching the development image and the repository's package-manager declaration. MySQL **8.0 or newer** is the documented database. A Mapbox token is optional and only needed for address geocoding and related location features.

From the repository root:

```bash
pnpm setup:env
```

This creates `.env` from `.env.example` when absent and fills empty or missing `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET` and `JWT_SECRET`. `APP_KEYS` contains four independent keys; all generated secrets use Node's cryptographic random generator. Existing non-empty secrets, other variables and comments are kept. Repeating the command does not rotate existing keys. It does not print their values.

If your runtime already supplies these values, use its environment configuration instead. The setup command is not part of normal application startup.

The Strapi/Nuxt scripts default to the root `.env`. Runtimes may select another file with `DEPOT_ENV_FILE`, interpreted relative to the corresponding package directory (for example `../../.env.docker`). `setup:env` always prepares the root `.env` and is only needed when that is the configuration you intend to use.

Edit your configuration before starting Strapi:

| Variables | Purpose |
| --- | --- |
| `HOST`, `PORT` | Strapi listening interface and port; normally `0.0.0.0`, `1337` |
| `PUBLIC_STRAPI_URL` | Browser-accessible Strapi base URL, normally `http://127.0.0.1:1337` |
| `PUBLIC_DEPOT_BASE_URL` | Frontend base URL used in emails, normally `http://127.0.0.1:3000` locally |
| `DATABASE_TYPE` | `mysql` for the following setup; SQLite is also supported by the configuration |
| `DATABASE_HOST`, `DATABASE_PORT` | Database connection address |
| `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Existing database and login |
| `NUXT_LAYERS` | Comma-separated layers; use `./base` for the standard application |
| `PUBLIC_MAPBOX_TOKEN`, `PUBLIC_RANDOM_LOCATION_RADIUS` | Optional geocoding token and location-obfuscation radius, default radius `200` |
| `REDACT_PRECISE_RESOURCE_LOCATION` | Hide precise resource addresses from users without access; default `true` |
| `RESOURCE_AUTO_PUBLISH` | Skip resource moderation for authenticated frontend submissions; default `false` |

With MySQL, create the database and account before starting Strapi. For example, in a local MySQL administrative session:

```sql
CREATE DATABASE strapi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'strapi_user'@'%' IDENTIFIED BY 'strapi_password';
GRANT ALL PRIVILEGES ON strapi.* TO 'strapi_user'@'%';
```

Use matching values in your environment. `DATABASE_PORT` is the port reachable by the application, which can differ from a port exposed to your workstation.

Install and build the workspace dependencies:

```bash
pnpm install --frozen-lockfile
pnpm build:backend-packages
```

The second command builds `@depot/shared` and all six local plugins. Their server entry points load compiled output. Repeat this build after editing these packages when running without a build watcher.

## 2. Choose plugins and layers

All six local plugins default to enabled. Set the corresponding variable to `false` to disable one, then restart Strapi. `true`/`false` and `1`/`0` are supported. Their definitions and plugin-specific options are in `packages/strapi/config/plugins.ts`.

| Plugin ID | Environment variable | Purpose and configuration | Additional role permissions |
| --- | --- | --- | --- |
| `plugin-availabilities` | `STRAPI_PLUGIN_AVAILABILITIES` | Availability calendars, capacity checks and personal dashboard | Authenticated `availabilitiesController.getDashboard`; core Availability actions for management |
| `conversations` | `STRAPI_PLUGIN_CONVERSATIONS` | Booking conversations over Socket.IO | Socket connections authenticate by user JWT; no generic Message/Conversation CRUD grants are required |
| `prices` | `STRAPI_PLUGIN_PRICES` | Calculate booking prices; also controls frontend price visibility | Price endpoint is explicitly public; no additional role grant |
| `emails` | `STRAPI_PLUGIN_EMAILS` | Transactional templates and notifications; SMTP configuration below | Public Berlin booking/raffle routes bypass role permissions; templates are maintained through the admin |
| `rental-agreement` | `STRAPI_PLUGIN_RENTAL_AGREEMENT` | Generate a booking's PDF agreement | Authenticated `rentalAgreementController.getRentalAgreement`; booking-party policy still applies |
| `search` | `STRAPI_PLUGIN_SEARCH` | Maintain the hidden resource search index | No separate HTTP action; search fields/population are configured in `plugins.ts` |

The `plugin-` prefix on `plugin-availabilities` is intentional. Strapi's own `users-permissions`, `email`, `upload`, documentation, SEO and image plugins are separate from these six toggles.

Plugin flags do not remove every dependent frontend feature. For example, booking capacity checks require availabilities, and booking-conversation creation requires conversations. Disable dependent workflows as well when customizing those combinations. Pricing is explicitly optional; disabling the emails plugin stops depot notifications but does not disable Strapi's core registration/password-reset email service.

The default `./base` layer provides the standard site. `./berlin-raum` and `./berlin-ausleihe` use room/lending-specific fields and routes; their login/editing features can be enabled with `NUXT_PUBLIC_FEATURES_LOGIN=true` and `NUXT_PUBLIC_FEATURES_RESOURCE_EDITING=true`. Choose layers before supplying layer-specific content.

## 3. Create the administrator

Start the development services:

```bash
pnpm dev
```

Open http://127.0.0.1:1337/admin and create the first administrator. This account belongs to Strapi's admin panel; it is different from a frontend user in the Users & Permissions plugin.

The frontend starts at http://127.0.0.1:3000. Until the following configuration and content steps are complete, content or permission errors on the website are expected.

## 4. Import project defaults

Stop the regular application process, keep the database available, and run:

```bash
pnpm setup:strapi
```

This builds the backend workspace packages, compiles/loads Strapi without starting its HTTP server, and imports the project defaults. Restart the application afterwards.

The command reads two versioned files:

- `packages/strapi/configuration.json`: Content Manager field metadata and editing layouts. Missing settings are added; existing views are retained.
- `packages/strapi/permissions.json`: required actions for the `public` and `authenticated` Users & Permissions roles. Authenticated users also receive the public catalog permissions. Roles are located by type, not by database-specific numeric IDs.

The import adds missing grants and keeps additional/custom grants, role identities and existing settings. The exception is the obsolete Media Library read grants `plugin::upload.content-api.find` and `plugin::upload.content-api.findOne`: setup removes them from both Public and Authenticated, including grants from earlier setup runs. Custom roles are unchanged. Repeated execution does not duplicate permissions. Actions and views for disabled plugins are skipped with a message. Unknown action names fail the import, making an outdated preset visible. It does not create users, tokens, email-template content or website records.

### Permission overview

| Role | Project defaults |
| --- | --- |
| Public | Read homepage, search-page configuration, pages, resources, categories, attributes, districts, purposes, FAQs, availability data and provider profiles; embedded media is included in content responses |
| Authenticated | The public reads plus own-profile retrieval/update, resource creation/update/deletion, booking creation/detail/status update, availability management, personal dashboard, media upload and rental agreement download |

Resource and availability ownership and booking-party/status checks continue to run after role authorization. The defaults do not grant generic user administration or Message, Conversation or Email Template CRUD. Strapi's built-in authentication permissions remain in place.

The frontend does not need Media Library list/detail permissions: it receives media metadata through content `populate` and loads the returned file URLs directly. Authenticated `plugin::upload.content-api.upload` remains enabled for file uploads. To secure an installation initialized with the old preset, stop the application and re-run `pnpm setup:strapi`; changing the JSON alone does not revoke stored grants. Admin Media Library access is managed separately and is unaffected.

The provider-profile permission is `users-permissions.user.find`: Strapi needs it to populate resource owners and booking parties. It also allows the user-list endpoint to return the non-private fields of the project's user schema. Review this grant and that schema when adapting public profile visibility for an installation.

The calendar and maximum-availability endpoints, price lookup, and Berlin booking/raffle mail endpoints explicitly declare `auth: false` in code. They do not need role checkboxes. Their availability still depends on the corresponding plugin being enabled.

To inspect or customize grants, open **Settings → Users & Permissions plugin → Roles**, select **Public** or **Authenticated**, and compare with the preset. Re-running setup will re-add any preset grant you removed, so customize the preset as well if that restriction should persist.

### Deliberately replace the Content Manager views

On an existing installation, Strapi may already have generated its views. To replace just the settings present in the project's configuration file with the maintained layouts, stop the application and run:

```bash
pnpm --filter @depot/strapi configuration:restore --strategy replace
```

This operation replaces those views, including local changes to their layouts. It does not import role permissions or content. Use `--strategy keep` instead to add missing settings only. Strapi's native configuration dump/restore handles database Core Store settings; Users & Permissions grants are stored separately and handled by `setup:strapi`.

## 5. Configure email and user authentication

The installed core email provider is Nodemailer. Set:

```dotenv
ADMIN_EMAIL=admin@example.org
REPLY_EMAIL=reply@example.org
PUBLIC_DEPOT_BASE_URL=http://127.0.0.1:3000
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_USERNAME=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

For an unauthenticated local SMTP capture server, use its hostname/port and leave both credentials empty. Nodemailer omits SMTP authentication in that case. Port `465` uses implicit TLS; port `587` normally negotiates STARTTLS. Restart Strapi after changing environment configuration.

### Registration and password reset

In **Settings → Users & Permissions plugin → Advanced settings**:

1. Allow registration if the site should accept new frontend users.
2. Keep the default role **Authenticated**.
3. Choose whether email confirmation is required.
4. Set **Redirection url** for successful email confirmation, for example `http://127.0.0.1:3000/user/login`.
5. Set **Reset password page** to `http://127.0.0.1:3000/user/reset-password`.

In **Email templates**, set the sender and reply-to values for confirmation and password-reset emails as well. These core templates can supply their own sender, which takes precedence over the provider's defaults.

Test SMTP delivery under **Settings → Email plugin → Configuration** using a test recipient. Then register a frontend user and test the actual confirmation/reset links, not just transport delivery.

### Depot templates

Open **Content Manager → Single Types → Email templates**. Maintain the MJML `layout` and the relevant title/body fields. The layout uses `{{headline}}` and `{{content}}`; bodies are MJML fragments. See the [emails plugin guide](../packages/strapi/src/plugins/emails/README.md) for complete templates, placeholders and examples for booking requests, status notifications and moderation emails.

`emailConfirmationTitle`/`Body` and `resetPasswordTitle`/`Body` are rendered into the layout and synchronized into the core Users & Permissions store on startup and whenever this Single Type is saved. Non-empty custom templates overwrite manual edits in the corresponding core templates on the next sync. Empty fields retain Strapi's existing auth templates; invalid MJML is logged and the previous template is kept.

For confirmation links use `{{ URL }}?confirmation={{ CODE }}`; for reset links use `{{ URL }}?code={{ TOKEN }}`. Booking confirmation/cancellation have built-in German fallback content. Other workflows, such as Berlin booking and raffle emails, need their corresponding fields populated before use.

## 6. Create the minimum website content

Use the Content Manager to create the following records. These steps are manual so installations can supply their own content.

### Homepage (base layer)

Create the **Homepage** Single Type:

- Set a header headline and description, and resource-section headings.
- Add the **Accordion Accordion** component and at least one **Accordion Item** with a title and description. The base homepage reads this nested component directly; leaving it absent is insufficient.
- Header Resources can initially be empty. When adding them later, select published resources with images.
- **Save**, then **Publish** the Homepage. A draft is not returned by the public API.

### Resources Search Page

Create **Resources Search Page**, set a header headline and any FAQ-section heading. FAQs can initially be empty. **Save** the record: this Single Type has Draft & Publish disabled and does not need a separate Publish action.

### Catalog and detail pages

Add Categories and, for the Berlin layers, Districts and Purposes as needed for filters. Collection types with Draft & Publish enabled must be published to appear publicly.

Create a frontend test user through registration, including the required address component, and use the resource form while logged in. This assigns the user as owner and creates the resource's default availability. Add an image, category, description and address. With pricing enabled, supply a tariff before testing bookings (a zero-price tariff is valid); otherwise the booking capacity/price check rejects the request with "No price found". Address lookup requires a Mapbox token; the site itself can start without one. If moderation is enabled, publish the resource in Strapi after submission; `RESOURCE_AUTO_PUBLISH=true` publishes authenticated frontend submissions directly.

Add optional FAQ records and Page records for linked content such as `/ueber-depot`, `/impressum` and `/datenschutz`. Their slugs must match the frontend links. Supply room/lending-specific resource fields and search headers when using the Berlin layers; those layers redirect their homepage to their resource listing.

### Import an existing installation instead

A Strapi data export or database backup can supply existing content instead of entering it manually. A full database restore also carries its existing settings, users and permissions; keep the matching uploads separately. Follow [Strapi's import documentation](https://docs.strapi.io/cms/data-management/import) for export archives. Importing an archive replaces destination data, so use a fresh target database for trying an existing dataset. After importing, check the environment URLs, email configuration and enabled plugins for your local runtime.

`configuration.json` is only configuration metadata; it is not a content export. Do not expect a configuration restore to create the Homepage or resources.

## 7. Verify the installation

1. Open `http://127.0.0.1:1337/_health` (HTTP `204`) and the admin panel.
2. Confirm `/api/homepage` returns the published record and `/api/resources-search-page` returns the saved search-page configuration.
3. Visit `/` and `/resources` in the base frontend. Check categories, search results and a published resource's detail page.
4. Register/login as a frontend user, edit its own profile and create a resource. Confirm another user cannot edit that resource or its availability.
5. Book an available resource as a second user, open the booking as both parties and test confirmation/cancellation. An unrelated user must not be able to read it or download its rental agreement.
6. Check registration/reset and the configured booking emails, including their destinations and links. With a capture server, confirm the actual messages arrive in its inbox.

If API requests return `403`, inspect the role and enabled plugin first. If a Single Type returns `404` or the frontend reports missing content, check that the record exists and, where applicable, is published. Server startup alone does not satisfy those content requirements.
