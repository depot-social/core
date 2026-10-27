const { ApplicationError } = require('@strapi/utils').errors; // ^^ Error classes: https://docs.strapi.io/dev-docs/error-handling#default-error-classes
import type { Core } from '@strapi/strapi';
import { isAfter, isValid } from 'date-fns';
import { Booking } from '@depot/shared';
import { AvailabilitiesService } from '../plugins/availabilities/server/services/availabilities-service'; // @todo not ideal
import { getRelationDocumentId } from '../utils';

type BookingRequestData = Omit<Partial<Booking>, 'resource'> & {
  resource?: unknown;
};

/** Validate availability for new booking requests only. */
export default async (
  policyContext,
  config,
  { strapi }: { strapi: Core.Strapi }
) => {
  const { state, request } = policyContext;
  const { user, isAuthenticated } = state;
  const { body } = request;

  if (!isAuthenticated || !user) {
    return false;
  }

  const booking = body.data as BookingRequestData;

  if (!booking) {
    throw new ApplicationError('No data provided.');
  }

  if (
    booking.bookingStatus !== undefined &&
    booking.bookingStatus !== 'requested'
  ) {
    throw new ApplicationError('New bookings must have status requested.');
  }
  body.data.bookingStatus = 'requested';

  if (typeof booking.resource === 'undefined' || !booking.resource) {
    throw new ApplicationError('Missing resource id.');
  }

  const resourceDocumentId = getRelationDocumentId(booking.resource);

  if (!resourceDocumentId) {
    throw new ApplicationError('Invalid resource id.');
  }

  // The Document Service only resolves relation objects by `documentId`. Keep
  // accepting the transitional `{ id: '<document-id>' }` request shape, but
  // normalize it before the core controller receives the payload.
  body.data.resource = { documentId: resourceDocumentId };

  const requestedUnits = Number(booking.bookedUnits);
  if (!Number.isInteger(requestedUnits) || requestedUnits < 1) {
    throw new ApplicationError('bookedUnits must be a positive integer.');
  }
  const start = new Date(booking.start);
  let end = new Date(booking.end);

  // @todo This was copied from availabilities-controller, should be refactored into a shared function
  if (!isValid(start) || !isValid(end)) {
    throw new ApplicationError(
      'Parameter start or end is not provided or is not a valid date'
    );
  }

  if (!isAfter(end, start)) {
    throw new ApplicationError('Parameter end must be after start');
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
    resourceDocumentId,
    undefined
  );

  if (maxAvailable && maxAvailable >= requestedUnits) {
    return true;
  } else {
    throw new ApplicationError(
      `Not enough available units (max. available: ${maxAvailable}).`
    );
  }
};
