/**
 * booking router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::booking.booking', {
  config: {
    create: {
      policies: ['global::bookingHasAvailableUnitsPolicy'],
    },
    update: {
      policies: ['global::bookingHasAvailableUnitsPolicy'],
    },
  },
});
