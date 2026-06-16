import { factories } from '@strapi/strapi';
import { isAdminOrBackofficeRequest } from '../../../utils';
import type { ResourceLocationRedactionService } from '../services/resourceLocationRedaction';

const RESOURCE_LOCATION_REDACTION_SERVICE_UID =
  'api::resource.resource-location-redaction';

type AuthenticatedUser = {
  id?: number | string | null;
};

type ResourceControllerContext = {
  state?: {
    user?: AuthenticatedUser | null;
  };
};

type FindResponse = {
  data: unknown[];
  meta?: unknown;
};

const getAuthenticatedUserId = (
  ctx: ResourceControllerContext
): number | undefined => {
  const userId = Number(ctx.state?.user?.id);

  return Number.isFinite(userId) && userId > 0 ? userId : undefined;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export default factories.createCoreController(
  'api::resource.resource',
  ({ strapi }) => {
    const resourceLocationRedaction = strapi.service(
      RESOURCE_LOCATION_REDACTION_SERVICE_UID
    ) as ResourceLocationRedactionService;

    return {
      async find(ctx: ResourceControllerContext) {
        const response = (await super.find(ctx)) as FindResponse;

        if (
          !resourceLocationRedaction.isRedactionEnabled() ||
          isAdminOrBackofficeRequest(ctx)
        ) {
          return response;
        }

        const userId = getAuthenticatedUserId(ctx);

        if (typeof userId === 'undefined') {
          return {
            ...response,
            data: resourceLocationRedaction.redactResourceLocations(
              response.data
            ),
          };
        }

        const resourceDocumentIdsInPage = response.data
          .map((resource) =>
            resourceLocationRedaction.getResourceDocumentIdFromEntity(resource)
          )
          .filter(isNonEmptyString);

        const allowedResourceDocumentIds =
          await resourceLocationRedaction.getAllowedResourceDocumentIds(
            userId,
            resourceDocumentIdsInPage
          );

        return {
          ...response,
          data: response.data.map((resource) => {
            const resourceDocumentId =
              resourceLocationRedaction.getResourceDocumentIdFromEntity(
                resource
              );

            if (
              resourceDocumentId &&
              allowedResourceDocumentIds.has(resourceDocumentId)
            ) {
              return resource;
            }

            return resourceLocationRedaction.redactResourceLocation(resource);
          }),
        };
      },

      async findOne(ctx: ResourceControllerContext) {
        const response = await super.findOne(ctx);

        if (
          !resourceLocationRedaction.isRedactionEnabled() ||
          isAdminOrBackofficeRequest(ctx)
        ) {
          return response;
        }

        const userId = getAuthenticatedUserId(ctx);

        if (typeof userId === 'undefined') {
          return resourceLocationRedaction.redactResourceLocation(response);
        }

        const resourceDocumentId =
          resourceLocationRedaction.getResourceDocumentIdFromEntity(response);

        if (!resourceDocumentId) {
          return resourceLocationRedaction.redactResourceLocation(response);
        }

        const canViewPreciseLocation =
          await resourceLocationRedaction.canViewPreciseLocation(
            userId,
            resourceDocumentId
          );

        return canViewPreciseLocation
          ? response
          : resourceLocationRedaction.redactResourceLocation(response);
      },
    };
  }
);
