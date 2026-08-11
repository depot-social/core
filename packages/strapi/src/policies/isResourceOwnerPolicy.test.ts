/// <reference types="vitest" />
import { describe, expect, test, vi } from 'vitest';
import isResourceOwnerPolicy from './isResourceOwnerPolicy';

describe('isResourceOwnerPolicy', () => {
  test('compares resource ownership by documentId', async () => {
    const resourceDocumentId = 'resource-document-id';
    const userDocumentId = 'user-document-id';
    const findUser = vi.fn().mockResolvedValue({
      resources: [{ documentId: resourceDocumentId }],
    });
    const body = {
      data: {
        resource: { id: resourceDocumentId },
      },
    };

    const result = await isResourceOwnerPolicy(
      {
        state: {
          user: { id: 23, documentId: userDocumentId },
          route: {
            method: 'POST',
            info: { apiName: 'availability' },
          },
          isAuthenticated: true,
        },
        request: { body },
        params: {},
      },
      {},
      {
        strapi: {
          documents: vi.fn().mockReturnValue({ findOne: findUser }),
        },
      } as any,
    );

    expect(result).toBe(true);
    expect(body.data.resource).toEqual({ documentId: resourceDocumentId });
    expect(findUser).toHaveBeenCalledWith({
      documentId: userDocumentId,
      populate: {
        resources: {
          fields: ['documentId'],
        },
      },
    });
  });
});
