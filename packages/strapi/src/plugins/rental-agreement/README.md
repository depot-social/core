# rental-agreement

Generate PDF rental agreements for bookings.

## Endpoint

`GET /api/bookings/{id}/rental-agreement`

Generates and streams a PDF rental agreement for the specified booking. Requires authentication and the user must be either the booking customer or resource owner.

The authenticated user's role must have the
`rentalAgreementController.getRentalAgreement` permission enabled in Strapi's
Users & Permissions settings.

## Build and development

Strapi loads this plugin from `dist/server/index.js`. If it has not been built,
Strapi silently skips it and the endpoint returns 404.

`pnpm --filter @depot/strapi dev` (or `develop`) builds the plugin before starting
Strapi. To rebuild it separately after changing its source, run:

```sh
pnpm --filter @depot/rental-agreement build
```

Restart Strapi after rebuilding so it loads the plugin's updated routes and code.

## Features

- Generates German rental agreement PDFs with all booking details
- Includes customer and resource owner information
- Displays pricing, duration, and resource details
- Contains handover and return protocols
- Streams PDF directly to client without saving to disk
