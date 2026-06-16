/// <reference types="vitest" />
import { describe, expect, test } from 'vitest';
import {
  getResourceDocumentIdFromEntity,
  redactResourceLocation,
  redactResourceLocations,
} from './resourceLocationRedaction';

type ResourceLike = {
  documentId?: string;
  id?: number;
  title?: string;
  address?: {
    street?: string;
    zip?: string;
    place?: string;
    latitude?: number;
    longitude?: number;
    obfuscatedLatitude?: number;
    obfuscatedLongitude?: number;
  };
};

describe('resourceLocationRedaction', () => {
  test('redacts precise address fields from a direct resource shape', () => {
    const resource: ResourceLike = {
      documentId: 'resource-document-id',
      title: 'Community room',
      address: {
        street: 'Example Street 1',
        zip: '10115',
        place: 'Berlin',
        latitude: 52.52,
        longitude: 13.405,
        obfuscatedLatitude: 52.5,
        obfuscatedLongitude: 13.4,
      },
    };

    const redacted = redactResourceLocation(resource);

    expect(redacted).not.toBe(resource);
    expect(redacted.address?.street).toBeUndefined();
    expect(redacted.address?.latitude).toBeUndefined();
    expect(redacted.address?.longitude).toBeUndefined();
    expect(redacted.address?.zip).toBe('10115');
    expect(redacted.address?.place).toBe('Berlin');
    expect(redacted.address?.obfuscatedLatitude).toBe(52.5);
    expect(redacted.address?.obfuscatedLongitude).toBe(13.4);
    expect(resource.address?.street).toBe('Example Street 1');
  });

  test('redacts a nested data response shape', () => {
    const response = {
      data: {
        documentId: 'nested-resource-document-id',
        address: {
          street: 'Nested Street 2',
          latitude: 52.51,
          longitude: 13.39,
          obfuscatedLatitude: 52.49,
          obfuscatedLongitude: 13.37,
        },
      },
    };

    const redacted = redactResourceLocation(response);

    expect(redacted.data.address.street).toBeUndefined();
    expect(redacted.data.address.latitude).toBeUndefined();
    expect(redacted.data.address.longitude).toBeUndefined();
    expect(redacted.data.address.obfuscatedLatitude).toBe(52.49);
    expect(redacted.data.address.obfuscatedLongitude).toBe(13.37);
  });

  test('redacts arrays consistently', () => {
    const resources: ResourceLike[] = [
      {
        documentId: 'first-resource-document-id',
        address: {
          street: 'First Street 1',
          latitude: 52.5,
          longitude: 13.4,
        },
      },
      {
        documentId: 'second-resource-document-id',
        address: {
          street: 'Second Street 2',
          latitude: 52.6,
          longitude: 13.5,
        },
      },
    ];

    const redacted = redactResourceLocations(resources);

    expect(redacted).toHaveLength(2);
    expect(redacted[0].address?.street).toBeUndefined();
    expect(redacted[0].address?.latitude).toBeUndefined();
    expect(redacted[0].address?.longitude).toBeUndefined();
    expect(redacted[1].address?.street).toBeUndefined();
    expect(redacted[1].address?.latitude).toBeUndefined();
    expect(redacted[1].address?.longitude).toBeUndefined();
  });

  test('extracts documentId and ignores deprecated numeric id values', () => {
    expect(
      getResourceDocumentIdFromEntity({
        documentId: 'resource-document-id',
        id: 123,
      })
    ).toBe('resource-document-id');

    expect(getResourceDocumentIdFromEntity({ id: 123 })).toBeUndefined();
    expect(
      getResourceDocumentIdFromEntity({
        data: {
          documentId: 'nested-resource-document-id',
          id: 456,
        },
      })
    ).toBe('nested-resource-document-id');
    expect(
      getResourceDocumentIdFromEntity({
        data: {
          id: 456,
        },
      })
    ).toBeUndefined();
  });
});
