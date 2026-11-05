/**
 * booking router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::booking.booking', {
  config: {
    create: {
      policies: ['global::bookingHasAvailableUnitsPolicy'],
    },
    findOne: {
      policies: ['global::isBookingPartyPolicy'],
    },
    // "update": Check for "isBookingPartyPolicy" located inside service
  },
});
