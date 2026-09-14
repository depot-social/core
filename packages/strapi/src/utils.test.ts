/// <reference types="vitest" />
import { describe, expect, test } from 'vitest';
import { getRelationDatabaseId, getRelationDocumentId } from './utils';

describe('getRelationDocumentId', () => {
  test.each([
    ['resource-document-id', 'resource-document-id'],
    [{ documentId: 'resource-document-id' }, 'resource-document-id'],
    [
      { connect: [{ documentId: 'resource-document-id' }] },
      'resource-document-id',
    ],
    [{ set: ['resource-document-id'] }, 'resource-document-id'],
  ])('reads Strapi v5 relation input %#', (input, expected) => {
    expect(getRelationDocumentId(input)).toBe(expected);
  });

  test('accepts a string document ID in the transitional id property', () => {
    expect(getRelationDocumentId({ id: 'resource-document-id' })).toBe(
      'resource-document-id'
    );
  });

  test.each([undefined, null, '', 123, { id: 123 }, { documentId: 123 }])(
    'rejects input without a string document ID: %j',
    (input) => {
      expect(getRelationDocumentId(input)).toBeUndefined();
    }
  );
});

describe('getRelationDatabaseId', () => {
  test.each([
    [123, 123],
    [{ id: 123 }, 123],
    [{ connect: [{ id: 123 }] }, 123],
    [{ set: [{ id: 123 }] }, 123],
  ])('reads Strapi database relation input %#', (input, expected) => {
    expect(getRelationDatabaseId(input)).toBe(expected);
  });

  test.each([undefined, null, '', 0, -1, 1.5, { id: 'document-id' }])(
    'rejects input without a positive integer database ID: %j',
    (input) => {
      expect(getRelationDatabaseId(input)).toBeUndefined();
    }
  );
});
