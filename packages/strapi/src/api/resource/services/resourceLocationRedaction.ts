import type { BookingStatus } from '@depot/shared';
import type { Core } from '@strapi/strapi';
import { readBooleanEnv } from '../../../utils';

const CONFIRMED_BOOKING_STATUS: BookingStatus = 'confirmed';

type UnknownRecord = Record<string, unknown>;

type ResourceDocumentReference = {
  documentId?: string | null;
};

type ConfirmedBookingWithResource = {
  resource?: ResourceDocumentReference | null;
};

export interface ResourceLocationRedactionService {
  isRedactionEnabled(): boolean;
  getResourceDocumentIdFromEntity(entity: unknown): string | undefined;
  redactResourceLocation<T>(resource: T): T;
  redactResourceLocations<T>(resources: readonly T[]): T[];
  getAllowedResourceDocumentIds(
    userId: number,
    resourceDocumentIds: readonly string[]
  ): Promise<Set<string>>;
  canViewPreciseLocation(
    userId: number,
    resourceDocumentId: string
  ): Promise<boolean>;
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const normalizeResourceDocumentIds = (
  resourceDocumentIds: readonly string[]
): string[] =>
  Array.from(new Set(resourceDocumentIds.filter(isNonEmptyString)));

export const isRedactionEnabled = (): boolean =>
  readBooleanEnv(process.env.REDACT_PRECISE_RESOURCE_LOCATION, true);

export const getResourceDocumentIdFromEntity = (
  entity: unknown
): string | undefined => {
  if (!isRecord(entity)) {
    return undefined;
  }

  if (isNonEmptyString(entity.documentId)) {
    return entity.documentId;
  }

  if (isRecord(entity.data)) {
    return getResourceDocumentIdFromEntity(entity.data);
  }

  return undefined;
};

const redactAddressFields = (resource: UnknownRecord): UnknownRecord => {
  if (!isRecord(resource.address)) {
    return resource;
  }

  return {
    ...resource,
    address: {
      ...resource.address,
      street: undefined,
      latitude: undefined,
      longitude: undefined,
    },
  };
};

export const redactResourceLocation = <T>(resource: T): T => {
  if (Array.isArray(resource)) {
    return resource.map((item) => redactResourceLocation(item)) as T;
  }

  if (!isRecord(resource)) {
    return resource;
  }

  if (typeof resource.address !== 'undefined') {
    return redactAddressFields(resource) as T;
  }

  if (
    isRecord(resource.attributes) &&
    typeof resource.attributes.address !== 'undefined'
  ) {
    return {
      ...resource,
      attributes: redactAddressFields(resource.attributes),
    } as T;
  }

  if (typeof resource.data !== 'undefined') {
    return {
      ...resource,
      data: redactResourceLocation(resource.data),
    } as T;
  }

  return resource;
};

export const redactResourceLocations = <T>(resources: readonly T[]): T[] =>
  resources.map((resource) => redactResourceLocation(resource));

export default ({
  strapi,
}: {
  strapi: Core.Strapi;
}): ResourceLocationRedactionService => ({
  isRedactionEnabled,
  getResourceDocumentIdFromEntity,
  redactResourceLocation,
  redactResourceLocations,

  async getAllowedResourceDocumentIds(userId, resourceDocumentIds) {
    const documentIds = normalizeResourceDocumentIds(resourceDocumentIds);
    const allowedResourceDocumentIds = new Set<string>();

    if (documentIds.length === 0) {
      return allowedResourceDocumentIds;
    }

    const [ownedResources, confirmedBookings] = await Promise.all([
      strapi.documents('api::resource.resource').findMany({
        filters: {
          documentId: { $in: documentIds },
          user: { id: userId },
        },
        fields: ['documentId'],
        pageSize: documentIds.length,
      } as any) as Promise<ResourceDocumentReference[]>,

      strapi.documents('api::booking.booking').findMany({
        filters: {
          bookingStatus: CONFIRMED_BOOKING_STATUS,
          resource: {
            documentId: { $in: documentIds },
          },
          $or: [
            { customer: { id: userId } },
            { resourceOwner: { id: userId } },
          ],
        },
        fields: ['documentId'],
        populate: {
          resource: {
            fields: ['documentId'],
          },
        },
        pageSize: 1000,
      } as any) as Promise<ConfirmedBookingWithResource[]>,
    ]);

    for (const ownedResource of ownedResources) {
      if (isNonEmptyString(ownedResource.documentId)) {
        allowedResourceDocumentIds.add(ownedResource.documentId);
      }
    }

    for (const booking of confirmedBookings) {
      const resourceDocumentId = booking.resource?.documentId;

      if (isNonEmptyString(resourceDocumentId)) {
        allowedResourceDocumentIds.add(resourceDocumentId);
      }
    }

    return allowedResourceDocumentIds;
  },

  async canViewPreciseLocation(userId, resourceDocumentId) {
    const ownedResource = await strapi
      .documents('api::resource.resource')
      .findFirst({
        filters: {
          documentId: resourceDocumentId,
          user: { id: userId },
        },
        fields: ['documentId'],
      } as any);

    if (ownedResource) {
      return true;
    }

    const hasConfirmedBooking = await strapi
      .documents('api::booking.booking')
      .findFirst({
        filters: {
          bookingStatus: CONFIRMED_BOOKING_STATUS,
          resource: { documentId: resourceDocumentId },
          $or: [
            { customer: { id: userId } },
            { resourceOwner: { id: userId } },
          ],
        },
        fields: ['documentId'],
      } as any);

    return Boolean(hasConfirmedBooking);
  },
});
