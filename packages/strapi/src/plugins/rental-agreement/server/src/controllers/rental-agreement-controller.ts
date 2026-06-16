import type { Core } from '@strapi/strapi';
import { Booking, Resource, User } from '@depot/shared';
import { RentalAgreementService } from '../services/rental-agreement-service';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getRentalAgreement(ctx) {
    const { id } = ctx.params;

    if (!id) {
      ctx.throw(400, 'Booking ID is required');
      return;
    }

    // Fetch booking with all required relations
    const booking: Booking = (await strapi
      .documents('api::booking.booking')
      .findOne({
        documentId: id.toString(),
        populate: {
          resource: {
            populate: ['address'],
          },
          customer: {
            populate: ['address', 'organization'],
          },
          resourceOwner: {
            populate: ['address', 'organization'],
          },
          price: true,
        },
      })) as unknown as Booking;

    if (!booking) {
      ctx.throw(404, 'Booking not found');
      return;
    }

    if (!booking.resource) {
      ctx.throw(400, 'Booking resource not found');
      return;
    }

    if (!booking.customer) {
      ctx.throw(400, 'Booking customer not found');
      return;
    }

    if (!booking.resourceOwner) {
      ctx.throw(400, 'Booking resource owner not found');
      return;
    }

    const resource: Resource = booking.resource as Resource;
    const customer: User = booking.customer as User;
    const resourceOwner: User = booking.resourceOwner as User;

    // Generate PDF
    const rentalAgreementService: RentalAgreementService = await strapi
      .plugin('rental-agreement')
      .service('rentalAgreementService');

    const pdfBuffer = await rentalAgreementService.generateRentalAgreementPdf(
      booking,
      resource,
      customer,
      resourceOwner
    );

    // Set response headers and body
    ctx.type = 'application/pdf';
    ctx.set(
      'Content-Disposition',
      `attachment; filename="Verleihvertrag-${booking.id}.pdf"`
    );
    ctx.body = pdfBuffer;
  },
});

