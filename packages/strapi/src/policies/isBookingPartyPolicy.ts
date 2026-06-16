const { ForbiddenError } = require('@strapi/utils').errors;
import type { Core } from '@strapi/strapi';
import { Booking } from '@depot/shared';

/**
 * Policy to check if the authenticated user is either the customer or resource owner of the booking
 */
export default async (
  policyContext: any,
  config: any,
  { strapi }: { strapi: Core.Strapi }
) => {
  const { state, params } = policyContext as { state: any; params: any };
  const { user, isAuthenticated } = state;
  const { id } = params;

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    throw new ForbiddenError('User must be authenticated');
  }

  if (!id) {
    throw new ForbiddenError('Booking ID is required');
  }

  // Fetch booking to check ownership
  const booking: Booking = (await strapi
    .documents('api::booking.booking')
    .findOne({
      documentId: id.toString(),
      fields: ['id'],
      populate: {
        customer: {
          fields: ['id'],
        },
        resourceOwner: {
          fields: ['id'],
        },
      },
    })) as unknown as Booking;

  if (!booking) {
    throw new ForbiddenError('Booking not found');
  }

  const userId = Number(user.id);
  const customerId = booking.customer ? Number(booking.customer.id) : null;
  const resourceOwnerId = booking.resourceOwner
    ? Number(booking.resourceOwner.id)
    : null;

  // Check if user is either the customer or resource owner
  if (customerId === userId || resourceOwnerId === userId) {
    return true;
  }

  throw new ForbiddenError('User is not authorized to access this booking');
};
