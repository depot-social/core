type Operation = {
  description?: string;
  requestBody?: object;
  responses?: Record<string, object>;
};
type BookingDocumentation = {
  paths: Record<string, { post?: Operation; put?: Operation; delete?: Operation }>;
  components: { schemas: Record<string, object> };
};

/** Keep regenerated OpenAPI aligned with the restricted booking controller. */
export const mutateBookingDocumentation = (documentation: BookingDocumentation) => {
  const requestBody = (schema: string) => ({
    required: true,
    content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } },
  });
  documentation.components.schemas.BookingStatusRequest = {
    type: 'object', required: ['data'], properties: {
      data: {
        type: 'object', additionalProperties: false, required: ['bookingStatus'],
        properties: { bookingStatus: { type: 'string', enum: ['confirmed', 'cancelled'] } },
      },
    },
  };
  documentation.components.schemas.BookingRequest = {
    type: 'object', required: ['data'], properties: {
      data: {
        type: 'object', required: ['start', 'end', 'resource', 'bookedUnits'],
        properties: {
          start: { type: 'string', format: 'date-time' }, end: { type: 'string', format: 'date-time' },
          resource: { type: 'object', required: ['documentId'], properties: { documentId: { type: 'string' } } },
          bookedUnits: { type: 'integer', minimum: 1 }, bookingStatus: { type: 'string', enum: ['requested'], default: 'requested' },
          title: { type: 'string' }, commentCustomer: { type: 'string', nullable: true },
          customerAddress: { $ref: '#/components/schemas/CustomAddressComponent' },
        },
      },
    },
  };
  const create = documentation.paths['/bookings']?.post;
  if (create) create.requestBody = requestBody('BookingRequest');
  const update = documentation.paths['/bookings/{id}']?.put;
  if (update) {
    update.description = 'Only the resource owner may confirm a requested booking. Both parties may cancel requested or confirmed bookings. Repeated authorized actions are idempotent. All other booking fields are immutable.';
    update.requestBody = requestBody('BookingStatusRequest');
    update.responses = { ...update.responses, '409': { description: 'Invalid or concurrent booking status transition' } };
  }
  const remove = documentation.paths['/bookings/{id}']?.delete;
  if (remove) {
    remove.description = 'Deletion is forbidden. Cancel the booking instead.';
    remove.responses = { '403': { description: 'Bookings must be cancelled instead of deleted' } };
  }
};
