# rental-agreement

Generate PDF rental agreements for bookings.

## Endpoint

`GET /api/bookings/{id}/rental-agreement`

Generates and streams a PDF rental agreement for the specified booking. Requires authentication and the user must be either the booking customer or resource owner.

## Features

- Generates German rental agreement PDFs with all booking details
- Includes customer and resource owner information
- Displays pricing, duration, and resource details
- Contains handover and return protocols
- Streams PDF directly to client without saving to disk
