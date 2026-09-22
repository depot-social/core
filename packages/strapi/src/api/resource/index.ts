import type { Core } from '@strapi/strapi';
import {
  type Address,
  type ObfuscatedGeoData,
  type Resource,
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

const DEFAULT_AVAILABLE_UNITS = 1;

type ResourceRequestContext = {
  state?: {
    resourceDefaultAvailableUnits?: number;
  };
};

const getSubmittedAvailableUnits = (
  ctx: ResourceRequestContext | undefined,
): number | undefined => {
  return ctx?.state?.resourceDefaultAvailableUnits;
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
    const findDefaultAvailability = async (resourceDocumentId: string) =>
      strapi.db.query('api::availability.availability').findOne({
        where: {
          resource: { documentId: resourceDocumentId },
          end: { $null: true },
        },
      });

    const ensureDefaultAvailability = async (
      resource: Resource,
      availableUnits = DEFAULT_AVAILABLE_UNITS,
    ) => {
      const existingDefaultAvailability = await findDefaultAvailability(
        resource.documentId,
      );

      if (existingDefaultAvailability) {
        return;
      }

      await strapi.documents('api::availability.availability').create({
        data: {
          title: 'default',
          start: new Date().toISOString(),
          end: null,
          availableUnits,
          resource: {
            documentId: resource.documentId,
          },
        },
      });
    };

    /**
     * After updating a resource:
     * - Resolve & save geocoded address (if any)
     */
    const afterUpdateResource = async (event: LifecycleEvent) => {
      const ctx = strapi.requestContext.get();
      if (!ctx) {
        // e.g. when called from Strapi UI
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
        // e.g. when called from Strapi UI
        return;
      }

      if (!isAdminOrBackofficeRequest(ctx)) {
        const authUser = ctx.state?.user;

        if (!authUser?.documentId) {
          ctx.throw(401, 'Authentication required.');
        }

        // Auto-assign logged-in user to created resource
        // important: we need user.id here, NOT documentId
        const user = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({
            where: { documentId: authUser.documentId },
            select: ['id'],
          });

        if (!user) {
          ctx.throw(401, 'Authentication required.');
        }

        event.params.data.user = { id: user.id };

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
      const resourceId = where?.id;

      if (resourceId) {
        const resource = (await strapi.db
          .query('api::resource.resource')
          .findOne({ where: { id: resourceId } })) as Resource | null;

        if (resource) {
          const defaultAvailability = await findDefaultAvailability(
            resource.documentId,
          );
          const submittedAvailableUnits = getSubmittedAvailableUnits(
            strapi.requestContext.get() as ResourceRequestContext | undefined,
          );

          if (defaultAvailability) {
            if (submittedAvailableUnits !== undefined) {
              await strapi.db.query('api::availability.availability').update({
                where: { id: defaultAvailability.id },
                data: { availableUnits: submittedAvailableUnits },
              });
            }
          } else {
            await ensureDefaultAvailability(
              resource,
              submittedAvailableUnits ?? DEFAULT_AVAILABLE_UNITS,
            );
          }
        }
      }

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

      await ensureDefaultAvailability(
        resource,
        getSubmittedAvailableUnits(ctx as ResourceRequestContext | undefined) ??
          DEFAULT_AVAILABLE_UNITS,
      );

      if (!ctx || isAdminOrBackofficeRequest(ctx)) {
        // e.g. when called from Strapi UI
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
