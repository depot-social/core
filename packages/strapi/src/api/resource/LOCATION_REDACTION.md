# Resource Location Redaction

## Overview

Resource location redaction hides precise address data from public content API responses. It keeps approximate map data available while removing fields that reveal the exact location.

The feature is controlled by `REDACT_PRECISE_RESOURCE_LOCATION` env variable and is enabled by default.

## Redacted Fields

When a resource address is redacted, these address fields are set to `undefined` in the API response:

- `street`
- `latitude`
- `longitude`

Other address fields remain available. In particular, obfuscated coordinates such as `obfuscatedLatitude` and `obfuscatedLongitude` stay visible so the frontend can still show approximate map markers.

## Visibility Rules

### Fully Visible Address

A resource address is fully visible when at least one of these conditions is true:

- The request is an admin or strapi request.
- The authenticated content API user owns the resource.
- The authenticated content API user is the customer of a confirmed booking for the resource.
- The authenticated content API user is the resource owner of a confirmed booking for the resource.

### Redacted Address

A resource address is redacted when redaction is enabled and none of the full-visibility rules apply:

- Anonymous users always receive redacted resource addresses.
- Authenticated users receive redacted addresses for resources they do not own and have no confirmed booking relationship with.
- Authenticated users with an invalid or missing user id receive redacted resource addresses.
- If a resource response cannot be matched to a `documentId`, the address is redacted.

## List Responses

For `GET /api/resources`, redaction is evaluated per resource in the current response page.

An authenticated user can receive a mixed list:

- resources they own or have a confirmed booking relationship with are fully visible
- all other resources are redacted

The confirmed booking lookup is limited to the resource `documentId`s present in the current response page.

## Single Resource Responses

For `GET /api/resources/:documentId`, the returned resource address is fully visible only if the authenticated user owns that resource or has a confirmed booking relationship with it. Otherwise, the address is redacted.