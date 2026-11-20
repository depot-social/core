/**
 * booking controller
 */

import { factories } from '@strapi/strapi';
import {
  BookingStatusError,
  type BookingStatusService,
} from '../utils/booking-status';
import { loadBookingView } from '../utils/booking-view';

export default factories.createCoreController(
  'api::booking.booking',
  ({ strapi }) => ({
    async findOne(ctx) {
      await this.validateQuery(ctx);
      const view = await loadBookingView(
        strapi,
        ctx.params.id,
        Number(ctx.state.user?.id),
        (data) => this.sanitizeOutput(data, ctx)
      );
      return this.transformResponse(view);
    },
    async create(ctx) {
      const response = await super.create(ctx);
      const view = await loadBookingView(
        strapi,
        response.data.documentId,
        Number(ctx.state.user?.id),
        (data) => this.sanitizeOutput(data, ctx)
      );
      return this.transformResponse(view);
    },
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
        const view = await loadBookingView(
          strapi,
          booking.documentId,
          Number(ctx.state.user?.id),
          (data) => this.sanitizeOutput(data, ctx)
        );
        return this.transformResponse(view);
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
