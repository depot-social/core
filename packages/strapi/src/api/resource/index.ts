import type { Core } from '@strapi/strapi';
import {
  Address,
  ObfuscatedGeoData,
  Resource,
  geocodeAddress,
  obfuscateGeodata,
} from '@depot/shared';
import { EmailsService } from '../../plugins/emails/server/services/emails-service';
import { isAdminOrBackofficeRequest, readBooleanEnv } from '../../utils';
import {
  handleSearchIndexOnCreate,
  handleSearchIndexOnUpdate,
} from './search-index-helper';

type LifecycleEvent = {
  params: {
    data: any;
    where?: { id?: number | string };
  };
  result?: any;
};

const updateAddressGeocode = async (
  strapi: Core.Strapi,
  address: Address,
): Promise<void> => {
  const geocodedAddress = await geocodeAddress(address);

  if (!geocodedAddress) {
    return;
  }

  let obfuscatedAddress: ObfuscatedGeoData | undefined;

  if (geocodedAddress.latitude && geocodedAddress.longitude) {
    obfuscatedAddress = obfuscateGeodata(
      geocodedAddress.latitude,
      geocodedAddress.longitude,
    );
  }

  await strapi.db.query('custom.address').update({
    where: { id: address.id },
    data: {
      ...address,
      ...obfuscatedAddress,
      ...geocodedAddress,
    },
  });
};

export default {
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    /**
     * After updating a resource:
     * - Resolve & save geocoded address (if any)
     */
    const afterUpdateResource = async (event: LifecycleEvent) => {
      const ctx = strapi.requestContext.get();
      if (!ctx) {
        // e.g. when called from import-csv
        return;
      }

      const { params } = event;
      const { data, where } = params;

      if (data.address) {
        if (!where) {
          return;
        }

        const { id } = where;

        if (!id) {
          return;
        }

        const resource = (await strapi.db
          .query('api::resource.resource')
          .findOne({
            populate: ['address'],
            where: { id },
          })) as Resource;

        const address = resource.address;

        if (!address) {
          return;
        }

        await updateAddressGeocode(strapi, address);
      }
    };

    /**
     * Before creating a resource:
     * - Resolve & save geocoded address (if any)
     * - Update search index in description
     */
    const beforeCreateResource = async (event: LifecycleEvent) => {
      const ctx = strapi.requestContext.get();
      if (!ctx) {
        // e.g. when called from import-csv
        return;
      }

      if (!isAdminOrBackofficeRequest(ctx)) {
        // Ensure resource has slug
        event.params.data.slug = await strapi
          .service('plugin::content-manager.uid')
          .generateUIDField({
            contentTypeUID: 'api::resource.resource',
            field: 'slug',
            data: event.params.data,
          });
      }

      const { params } = event;
      const { data } = params;

      /**
       * Handle search index (fetches existing resource, merges data)
       * based on STRAPI_CONCAT_SEARCH flag
       */
      if (
        typeof process.env.STRAPI_CONCAT_SEARCH !== 'undefined' &&
        readBooleanEnv(process.env.STRAPI_CONCAT_SEARCH, true)
      ) {
        await handleSearchIndexOnCreate(data, strapi);
      }

      if (!data.address) {
        return;
      }

      // Resolve full address geodata
      const address = (await strapi.db
        .query('custom.address')
        .findOne({ where: { id: data.address.id } })) as Address;

      if (address) {
        await updateAddressGeocode(strapi, address);
      }
    };

    /**
     * Before updating a resource:
     * - Update search index in description based on STRAPI_CONCAT_SEARCH flag
     */
    const beforeUpdateResource = async (event: LifecycleEvent) => {
      const { params } = event;
      const { data, where } = params;

      if (
        typeof process.env.STRAPI_CONCAT_SEARCH !== 'undefined' &&
        readBooleanEnv(process.env.STRAPI_CONCAT_SEARCH, true)
      ) {
        const typedWhere =
          where && typeof where.id !== 'undefined'
            ? { id: Number(where.id) }
            : {};

        await handleSearchIndexOnUpdate(data, typedWhere, strapi);
      }
    };

    /**
     * After creating a resource:
     * - Set resource status to "draft" (if coming from API request)
     * - Send notification email to admin about created resource
     */
    const afterCreateResource = async (event: any) => {
      const { result } = event;
      const resource: Resource = result;

      const ctx = strapi.requestContext.get();

      if (!ctx) {
        // e.g. when called from import-csv
        return;
      }

      if (isAdminOrBackofficeRequest(ctx)) {
        return;
      }

      // Ensure resource has status "draft"
      await strapi.documents('api::resource.resource').unpublish({
        documentId: resource.documentId,
        locale: '*',
      });

      const emailsPlugin = strapi.plugin('emails');

      if (!emailsPlugin) {
        return;
      }

      const emailsService: EmailsService =
        await emailsPlugin.service('emailsService');

      await emailsService.sendResourceAwaitsActivationMail(resource.documentId);
    };

    strapi.db.lifecycles.subscribe({
      models: ['api::resource.resource'],
      beforeCreate: beforeCreateResource,
      beforeUpdate: beforeUpdateResource,
      afterCreate: afterCreateResource,
      afterUpdate: afterUpdateResource,
    } as any);
  },
};
