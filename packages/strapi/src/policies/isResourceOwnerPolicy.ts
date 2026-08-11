const { ForbiddenError } = require('@strapi/utils').errors; // ^^ Error classes: https://docs.strapi.io/dev-docs/error-handling#default-error-classes
import type { Core } from '@strapi/strapi';
import { getRelationDocumentId } from '../utils';

/**
 * Generic policy to check if the user is authenticated
 * and owner of the resource_id passed in the body.
 *
 * Called from availability.availability findOne, create, update, delete
 *
 * Currently works for Availability.
 */
export default async (
  policyContext,
  config,
  { strapi }: { strapi: Core.Strapi }
) => {
  const { state, params, request } = policyContext;
  const { user, route, isAuthenticated } = state;
  const { body } = request;
  const { info } = route;
  const { apiName } = info;
  const { id } = params;

  if (!isAuthenticated || !user || !apiName) {
    throw new ForbiddenError('Wrong resource owner.');
  }

  if (route.method === 'POST') {
    const { data } = body;
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

  const targetEntity = await strapi
    .documents(`api::${apiName}.${apiName}` as any)
    .findOne({
      documentId: id.toString(),
      fields: ['id'],
      populate: {
        resource: {
          populate: ['user'],
        },
      },
    } as any);

  const entityResource = (targetEntity as any)?.resource;

  if (entityResource?.user?.id === user.id) {
    return true;
  } else {
    throw new ForbiddenError('Wrong resource owner.');
  }
};
