import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { isAdminOrBackofficeRequest } from '../../../utils';
import type { ResourceLocationRedactionService } from '../services/resourceLocationRedaction';

const RESOURCE_LOCATION_REDACTION_SERVICE_UID =
  'api::resource.resource-location-redaction';

type AuthUser = {
  id?: number | string | null;
};

type ResourceControllerContext = {
  state?: {
    user?: AuthUser | null;
    resourceDefaultAvailableUnits?: number;
  };
};

type ResourceRequest = {
  request?: {
    body?: {
      data?: Record<string, unknown>;
    };
  };
};

type FindResponse = {
  data: unknown[];
  meta?: Record<string, unknown>;
};

const getAuthenticatedUserId = (
  ctx: ResourceControllerContext
): number | undefined => {
  const userId = Number(ctx.state?.user?.id);

  return Number.isFinite(userId) && userId > 0 ? userId : undefined;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

// searchIndex is only used for filtering and may contain the (redacted) street.
const omitSearchIndex = (entity: unknown): unknown => {
  if (typeof entity !== 'object' || entity === null) return entity;

  const { searchIndex: _searchIndex, ...rest } = entity as Record<
    string,
    unknown
  >;
  return rest;
};

const getResourceRequestData = (ctx: ResourceControllerContext) =>
  (ctx as ResourceRequest).request?.body?.data;

const prepareResourceAvailabilityInput = (
  ctx: ResourceControllerContext,
  options: { stripSubmittedUser: boolean }
) => {
  const resourceData = getResourceRequestData(ctx);

  if (
    !resourceData ||
    typeof resourceData !== 'object' ||
    Array.isArray(resourceData)
  ) {
    return;
  }

  const availableUnits = resourceData.availableUnits;

  if (availableUnits !== undefined) {
    if (
      typeof availableUnits !== 'number' ||
      !Number.isInteger(availableUnits) ||
      availableUnits < 1 ||
      availableUnits > 100
    ) {
      throw new errors.ValidationError(
        'availableUnits must be an integer between 1 and 100.'
      );
    }

    ctx.state ??= {};
    ctx.state.resourceDefaultAvailableUnits = availableUnits;
    delete resourceData.availableUnits;
  }

  // Resource requests may set the default capacity, but relations are owned by
  // the availability lifecycle and must never be changed through this endpoint.
  delete resourceData.availabilities;

  if (options.stripSubmittedUser) {
    delete resourceData.user;
  }
};

export default factories.createCoreController(
  'api::resource.resource',
  ({ strapi }) => {
    const resourceLocationRedaction = strapi.service(
      RESOURCE_LOCATION_REDACTION_SERVICE_UID
    ) as ResourceLocationRedactionService;

    return {
      async find(ctx: ResourceControllerContext) {
        const coreResponse = (await super.find(ctx)) as FindResponse;
        const response = {
          ...coreResponse,
          data: coreResponse.data.map(omitSearchIndex),
        };

        const userId = getAuthenticatedUserId(ctx);
        const resourceDocumentIdsInPage = response.data
          .map((resource) =>
            resourceLocationRedaction.getResourceDocumentIdFromEntity(resource)
          )
          .filter(isNonEmptyString);

        const redactionApplies =
          resourceLocationRedaction.isRedactionEnabled() &&
          !isAdminOrBackofficeRequest(ctx);
        const allowedResourceDocumentIds = !redactionApplies
          ? new Set(resourceDocumentIdsInPage)
          : typeof userId === 'undefined'
          ? new Set<string>()
          : await resourceLocationRedaction.getAllowedResourceDocumentIds(
              userId,
              resourceDocumentIdsInPage
            );

        return {
          ...response,
          // Nuxt needs the same decision when a resource has no address and a
          // text-only provider-address fallback is considered. Never infer this
          // permission from an absent street or from service-token credentials.
          meta: {
            ...response.meta,
            locationAccess: {
              preciseLocationAllowedDocumentIds:
                resourceDocumentIdsInPage.filter((documentId) =>
                  allowedResourceDocumentIds.has(documentId)
                ),
            },
          },
          data: response.data.map((resource) => {
            const resourceDocumentId =
              resourceLocationRedaction.getResourceDocumentIdFromEntity(
                resource
              );

            if (
              !redactionApplies ||
              (resourceDocumentId &&
                allowedResourceDocumentIds.has(resourceDocumentId))
            ) {
              return resource;
            }

            return resourceLocationRedaction.redactResourceLocation(resource);
          }),
        };
      },

      async findOne(ctx: ResourceControllerContext) {
        const coreResponse = await super.findOne(ctx);
        const response = coreResponse && {
          ...coreResponse,
          data: omitSearchIndex(coreResponse.data),
        };

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

      async create(ctx: ResourceControllerContext) {
        prepareResourceAvailabilityInput(ctx, { stripSubmittedUser: false });

        return await super.create(ctx);
      },

      async update(ctx: ResourceControllerContext) {
        prepareResourceAvailabilityInput(ctx, { stripSubmittedUser: true });

        return await super.update(ctx);
      },
    };
  }
);
