import type { Core } from '@strapi/strapi';
import type { Address } from '@depot/shared';
import { updateAddressGeocode } from './utils';

type UserLifecycleEvent = {
  params: { data?: { address?: unknown } };
  result?: { id?: number };
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   *
   * Note that many types on "Strapi" are not complete, so we gotta use "any" to avoid
   * type errors. This is hopefully resolved in one of the upcoming releases.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    /**
     * After creating / updating a user (registration, PATCH /users/me, admin):
     * - Resolve & save geocoded account address (if complete)
     */
    const geocodeUserAddress = async (event: UserLifecycleEvent) => {
      const userId = event.result?.id;

      if (!event.params.data?.address || !userId) {
        return;
      }

      const user = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({ where: { id: userId }, populate: ['address'] });
      const address = user?.address as Address | undefined;

      if (!address?.street || !address.zip || !address.place) {
        return;
      }

      try {
        await updateAddressGeocode(strapi, address);
      } catch (error) {
        // Registration / profile updates must not fail because of geocoding
        strapi.log.error('Failed to geocode user address', error);
      }
    };

    strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],
      afterCreate: geocodeUserAddress,
      afterUpdate: geocodeUserAddress,
    });
  },
};
