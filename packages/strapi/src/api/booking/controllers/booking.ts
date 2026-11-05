/**
 * booking controller
 */

import { factories } from '@strapi/strapi';
import {
  BookingStatusError,
  type BookingStatusService,
} from '../utils/booking-status';

export default factories.createCoreController(
  'api::booking.booking',
  ({ strapi }) => ({
    async update(ctx) {
      try {
        const body = (
          ctx.request as typeof ctx.request & { body?: { data?: unknown } }
        ).body;
        const service = strapi.service(
          'api::booking.booking'
        ) as unknown as BookingStatusService;
        const booking = await service.updateStatus(
          ctx.params.id,
          Number(ctx.state.user?.id),
          body?.data
        );
        return this.transformResponse(await this.sanitizeOutput(booking, ctx));
      } catch (error) {
        if (error instanceof BookingStatusError)
          ctx.throw(error.status, error.message);
        throw error;
      }
    },
    async delete(ctx) {
      ctx.throw(403, 'Bookings must be cancelled instead of deleted.');
    },
  })
);
