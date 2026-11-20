import qs from 'qs';
import type { H3Event } from 'h3';
import {
  projectPublicProvider,
  projectResourceContent,
  type PublicResource,
  type Resource,
  type StrapiResponse,
} from '@depot/shared';
import { buildResourceFilters, parseResourcesQuery } from './resourceQueries';

type ResourceLookup = { slug?: string; documentId?: string };
type ResourceResponse = StrapiResponse<Resource[]> & {
  meta: {
    locationAccess?: { preciseLocationAllowedDocumentIds: string[] };
  };
};

const getPopulate = (layer: string, view: 'card' | 'detail' | 'booking') => {
  if (view === 'booking')
    return ['images', 'resourceTypes', 'address', 'prices', 'categories'];
  if (layer === 'base')
    return [
      'categories',
      'images',
      'address',
      'prices',
      'resourceTypes',
      ...(view === 'detail' ? ['availabilities'] : []),
    ];
  if (view === 'card')
    return [
      'address',
      'resourceTypes',
      'images',
      'prices',
      'district',
      'purposes',
      'categories',
      'attributes.attribute',
    ];
  return layer === 'berlin-ausleihe'
    ? [
        'images',
        'availabilities',
        'district',
        'address',
        'prices',
        'categories',
        'links',
      ]
    : [
        'images',
        'district',
        'purposes',
        'links',
        'resourceTypes',
        'address',
        'prices',
        'categories',
      ];
};

const upstreamError = (error: unknown, serviceRequest: boolean): never => {
  const status =
    error && typeof error === 'object' && 'statusCode' in error
      ? Number(error.statusCode)
      : 502;
  throw createError({
    statusCode:
      !serviceRequest && [400, 401, 403, 404].includes(status) ? status : 502,
    statusMessage: 'Unable to load resources',
  });
};

export const loadPublicResources = async (
  event: H3Event,
  lookup: ResourceLookup = {}
): Promise<StrapiResponse<PublicResource[]>> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store');
  const query = parseResourcesQuery(getQuery(event));
  if (
    (lookup.slug && (lookup.slug.length > 200 || lookup.slug.includes('/'))) ||
    (lookup.documentId && !/^[a-zA-Z0-9_-]{1,128}$/.test(lookup.documentId))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid resource identifier',
    });
  }
  const config = useRuntimeConfig(event);
  if (!config.strapiReadToken)
    throw createError({
      statusCode: 503,
      statusMessage: 'Resource service is not configured',
    });
  const layer = config.public.activeLayer || 'base';
  const view = lookup.documentId ? 'booking' : lookup.slug ? 'detail' : 'card';
  const filters = buildResourceFilters(query, layer);
  if (lookup.slug) filters.slug = { $eq: lookup.slug };
  if (lookup.documentId) filters.documentId = { $eq: lookup.documentId };
  const url = `${config.strapi.url}/api/resources`;
  const jwt = getCookie(event, 'strapi_jwt');
  let response: ResourceResponse;
  try {
    // The end user's credentials determine resource visibility and exact locations.
    response = await $fetch<ResourceResponse>(
      `${url}?${qs.stringify({
        status: 'published',
        populate: getPopulate(layer, view),
        filters,
        pagination: {
          page: lookup.slug || lookup.documentId ? 1 : query.page || 1,
          pageSize: lookup.slug || lookup.documentId ? 1 : query.pageSize || 16,
        },
        sort:
          (query.sort || (layer === 'base' ? 'default' : 'pinned-title')) ===
          'pinned-title'
            ? ['isPinned:desc', 'title:asc']
            : undefined,
      })}`,
      { headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined }
    );
  } catch (error) {
    return upstreamError(error, false);
  }
  const resources = response.data;
  if ((lookup.slug || lookup.documentId) && !resources.length)
    throw createError({ statusCode: 404, statusMessage: 'Page not found' });
  const providers = new Map<string, PublicResource['provider']>();
  const displayAddresses = new Map<string, PublicResource['displayAddress']>();
  const withDisplayAddress = layer === 'berlin-ausleihe' && view === 'detail';
  const preciseLocationAllowedDocumentIds =
    response.meta?.locationAccess?.preciseLocationAllowedDocumentIds;
  // A redacted address still exists. Only an explicitly absent component may
  // fall back; missing permission metadata (e.g. an older backend) fails closed.
  const fallbackDocumentIds = new Set(
    withDisplayAddress && Array.isArray(preciseLocationAllowedDocumentIds)
      ? resources
          .filter((resource) => resource.address === null)
          .map((resource) => resource.documentId)
      : []
  );
  // Small batches respect Strapi's query arrayLimit and avoid oversized URLs.
  for (let offset = 0; offset < resources.length; offset += 100) {
    const documentIds = resources
      .slice(offset, offset + 100)
      .map((resource) => resource.documentId);
    try {
      const enriched = await $fetch<StrapiResponse<Resource[]>>(
        `${url}?${qs.stringify({
          status: 'published',
          fields: ['documentId'],
          filters: { documentId: { $in: documentIds } },
          pagination: { page: 1, pageSize: documentIds.length },
          populate: {
            user: {
              fields: [
                'firstName',
                'lastName',
                'organizationName',
                'createdAt',
              ],
              populate: {
                organization: { fields: ['title'] },
                link: { fields: ['url', 'title'] },
                ...(documentIds.some((id) => fallbackDocumentIds.has(id))
                  ? { address: { fields: ['street', 'zip'] } }
                  : {}),
              },
            },
          },
        })}`,
        { headers: { Authorization: `Bearer ${config.strapiReadToken}` } }
      );
      for (const resource of enriched.data) {
        if (documentIds.includes(resource.documentId)) {
          providers.set(
            resource.documentId,
            projectPublicProvider(resource.user, view, layer)
          );
          const address = resource.user?.address;
          if (fallbackDocumentIds.has(resource.documentId) && address) {
            const displayAddress: PublicResource['displayAddress'] = {};
            if (
              preciseLocationAllowedDocumentIds?.includes(
                resource.documentId
              ) &&
              typeof address.street === 'string'
            )
              displayAddress.street = address.street;
            if (typeof address.zip === 'string')
              displayAddress.zip = address.zip;
            displayAddresses.set(resource.documentId, displayAddress);
          }
        }
      }
    } catch (error) {
      upstreamError(error, true);
    }
  }
  const pagination = response.meta?.pagination;
  return {
    data: resources.map((resource) => ({
      ...projectResourceContent(resource),
      provider: providers.get(resource.documentId) || null,
      ...(withDisplayAddress
        ? {
            displayAddress: resource.address
              ? {
                  street: resource.address.street,
                  zip: resource.address.zip,
                }
              : displayAddresses.get(resource.documentId) || null,
          }
        : {}),
    })),
    meta: pagination
      ? {
          pagination: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            pageCount: pagination.pageCount,
            total: pagination.total,
          },
        }
      : {},
  };
};
