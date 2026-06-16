const { ApplicationError, ForbiddenError } = require('@strapi/utils').errors; // ^^ Error classes: https://docs.strapi.io/dev-docs/error-handling#default-error-classes
import type { Core } from '@strapi/strapi';
import { isAfter, isBefore, isValid } from 'date-fns';
import { Booking, Resource } from '@depot/shared';
import { AvailabilitiesService } from '../plugins/availabilities/server/services/availabilities-service'; // @todo not ideal

/**
 * Called from either POST or PUT /bookings route
 *
 * @todo Rename to bookingPolicy, NO BETTER:
 * @todo All mutations have to be done in onBeforeSave/onBeforeUpdate in bookings/index.ts!
 * @todo Should be splitted into further policies (e.g. isBookingOwner, isBookingConfirmed, etc.)
 * @todo Refactor validation in accordance to the availabilities-controller
 * @todo Refactor entity service getters (move into @depot/core service)
 * @todo Use PolicyError to provide more details (throw new PolicyError('Something went wrong', { policy: 'my-policy' });)
 * @todo In future, provide max-avail UI component to strapi booking form
 */
export default async (
  policyContext,
  config,
  { strapi }: { strapi: Core.Strapi }
) => {
  const { state, request, params } = policyContext;
  const { user, route, isAuthenticated } = state;
  const { body } = request;

  if (!isAuthenticated || !user) {
    return false;
  }

  const isAddAction = route.method === 'POST';
  const booking: Booking = body.data;

  if (!booking) {
    throw new ApplicationError('No data provided.');
  }

  const id = !isAddAction ? Number(params.id) : undefined;

  if (typeof booking.resource === 'undefined' || !booking.resource) {
    throw new ApplicationError('Missing resource id.');
  }

  // @todo This is not ideal, as an already setted resource
  // (in case of PUT) is not required again in request body
  const resourceId = Number(
    typeof booking.resource === 'object'
      ? booking.resource.id
      : booking.resource
  );

  if (isNaN(resourceId)) {
    throw new ApplicationError('Invalid resource id.');
  }

  let originalBooking: any; // Booking

  if (!isAddAction) {
    originalBooking = (await strapi.documents('api::booking.booking').findOne({
      documentId: id.toString(),
      fields: ['id', 'bookingStatus'],

      populate: {
        resource: {
          fields: ['id'],
        },
        customer: {
          fields: ['id'],
        },
        resourceOwner: {
          fields: ['id'],
        },
      },
    })) as unknown as Booking;

    if (originalBooking.bookingStatus === 'confirmed') {
      throw new ForbiddenError('Confirmed bookings can not be changed.');
    }

    if (
      originalBooking.customer.id !== user.id &&
      originalBooking.resourceOwner.id !== user.id
    ) {
      throw new ForbiddenError('Only owner of a given booking can change it.');
    }

    if (originalBooking.resource.id !== resourceId) {
      throw new ForbiddenError(
        'Resource of a given booking can not be changed.'
      );
    }
  }

  const requestedUnits = Number(booking.bookedUnits) || 1;
  let start = new Date(booking.start);
  let end = new Date(booking.end);

  // @todo This was copied from availabilities-controller, should be refactored into a shared function
  if (!isValid(start) || !isValid(end)) {
    throw new ApplicationError(
      'Parameter start or end is not provided or is not a valid date'
    );
  }

  if (isBefore(end, start)) {
    throw new ApplicationError('Parameter end should not be before start');
  }

  // end should not be more than 6 months from start
  const maxEnd = new Date(start.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

  if (isAfter(end, maxEnd)) {
    // ctx.throw(400, 'Parameter end should not be more than 6 months from start');
    end = maxEnd;
  }

  const availabilitiesService: AvailabilitiesService = await strapi
    .plugin('plugin-availabilities')
    .service('availabilitiesService');

  const fakeCtx = {
    throw: (errCode, errMsg) => {
      throw new ApplicationError(errMsg);
    },
  };

  const maxAvailable = await availabilitiesService.getMaxAvailable(
    fakeCtx as any,
    start,
    end,
    resourceId,
    isAddAction ? undefined : id
  );

  if (maxAvailable && maxAvailable >= requestedUnits) {
    // Prevent wrong inputs by explicitly linking
    // the actual customer & resourceOwner
    delete body.data.customer;
    delete body.data.resourceOwner;

    //if (isAddAction) {
    const resource: Resource = (await strapi
      .documents('api::resource.resource')
      .findOne({
        documentId: resourceId.toString(),
        fields: ['id'],

        populate: {
          user: {
            fields: ['id'],
          },
        },
      })) as unknown as Resource;

    console.log('RESOURCE XXX', resource);

    body.data.customer = user.id;
    body.data.resourceOwner = resource.user.id;
    // }

    return true;
  } else {
    throw new ApplicationError(
      `Not enough available units (max. available: ${maxAvailable}).`
    );
  }

  return false;
};
