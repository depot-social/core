/**
 * resource router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::resource.resource', {
  config: {
    update: {
      policies: ['global::isResourceOwnerPolicy'],
    },
    delete: {
      policies: ['global::isResourceOwnerPolicy'],
    },
  },
});
