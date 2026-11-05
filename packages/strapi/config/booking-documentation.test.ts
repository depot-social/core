import { expect, test } from 'vitest';
import { mutateBookingDocumentation } from './booking-documentation';

test('regenerated booking documentation exposes only status updates and requested creation', () => {
  const documentation = { paths: { '/bookings': { post: {} }, '/bookings/{id}': { put: {}, delete: {} } }, components: { schemas: {} } };
  mutateBookingDocumentation(documentation);
  expect(documentation.paths['/bookings/{id}'].put).toMatchObject({
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingStatusRequest' } } } },
    responses: { '409': expect.anything() },
  });
  expect(documentation.components.schemas).toMatchObject({
    BookingStatusRequest: { properties: { data: { additionalProperties: false, properties: { bookingStatus: { enum: ['confirmed', 'cancelled'] } } } } },
    BookingRequest: { properties: { data: { properties: { bookingStatus: { enum: ['requested'] } } } } },
  });
  expect(documentation.paths['/bookings/{id}'].delete).toMatchObject({ responses: { '403': expect.anything() } });
});
