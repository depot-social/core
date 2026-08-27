import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { getRelationDocumentId } from '../utils';

const { ForbiddenError } = errors;

type ResourceOwner = {
  id?: number | string | null;
};

type ResourceWithOwner = {
  user?: ResourceOwner | null;
};

type ResourceOwnerPolicyContext = {
  state: {
    user?: {
      id?: number | string | null;
      documentId?: string | null;
    } | null;
    route?: {
      method?: string;
      info?: {
        apiName?: string;
      };
    };
    isAuthenticated?: boolean;
  };
  params: {
    id?: string | number;
  };
  request: {
    body?: {
      data?: {
        resource?: unknown;
      };
    };
  };
};

/**
 * Checks whether the authenticated user owns a Resource directly or through
 * an Availability.
 *
 * Called from Resource update/delete and Availability findOne/create/update/delete.
 */
export default async (
  policyContext: ResourceOwnerPolicyContext,
  _config: unknown,
  { strapi }: { strapi: Core.Strapi }
) => {
  const { state, params, request } = policyContext;
  const { user, route, isAuthenticated } = state;
  const { body } = request;
  const apiName = route?.info?.apiName;
  const { id } = params;

  if (!isAuthenticated || !user || !apiName) {
    throw new ForbiddenError('Wrong resource owner.');
  }

  if (route?.method === 'POST') {
    const { data } = body ?? {};

    if (!data || apiName !== 'availability') {
      throw new ForbiddenError('Invalid resource id.');
    }

    const resourceDocumentId = getRelationDocumentId(data.resource);
    const userDocumentId = getRelationDocumentId(user.documentId);

    if (!resourceDocumentId) {
      throw new ForbiddenError('Invalid resource id.');
    }

    if (!userDocumentId) {
      throw new ForbiddenError('Invalid user document id.');
    }

    body.data.resource = { documentId: resourceDocumentId };

    const userWithResources = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({
        documentId: userDocumentId,
        populate: {
          resources: {
            fields: ['documentId'],
          },
        },
      });

    const resources = (userWithResources as any)?.resources as
      | Array<{ documentId: string }>
      | undefined;

    if (!resources || resources.length === 0) {
      throw new ForbiddenError('No resources found.');
    }

    if (
      !resources.some((resource) => resource.documentId === resourceDocumentId)
    ) {
      throw new ForbiddenError('Wrong resource owner.');
    }

    return true;
  }

  if (!id) {
    throw new ForbiddenError('Invalid resource id.');
  }

  if (apiName === 'resource') {
    const resource = (await strapi.documents('api::resource.resource').findOne({
      documentId: id.toString(),
      fields: ['id'],
      populate: {
        user: {
          fields: ['id'],
        },
      },
    })) as ResourceWithOwner | null;

    if (resource?.user?.id === user.id) {
      return true;
    }

    throw new ForbiddenError('Wrong resource owner.');
  }

  if (apiName !== 'availability') {
    throw new ForbiddenError('Wrong resource owner.');
  }

  const availability = await strapi
    .documents('api::availability.availability')
    .findOne({
      documentId: id.toString(),
      fields: ['id'],
      populate: {
        resource: {
          populate: ['user'],
        },
      },
    });

  const entityResource = (availability as { resource?: ResourceWithOwner })
    ?.resource;

  if (entityResource?.user?.id === user.id) {
    return true;
  }

  throw new ForbiddenError('Wrong resource owner.');
};
