/**
 * availability router
 *
 * @see https://docs.strapi.io/dev-docs/backend-customization/routes#policies
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::availability.availability', {
  config: {
    findOne: {
      policies: ['global::isResourceOwnerPolicy'],
    },
    create: {
      policies: ['global::isResourceOwnerPolicy'],
    },
    update: {
      policies: ['global::isResourceOwnerPolicy'],
    },
    delete: {
      policies: ['global::isResourceOwnerPolicy'],
    },
  },
});
