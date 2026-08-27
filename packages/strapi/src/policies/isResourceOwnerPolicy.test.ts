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
      } as any
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

  test.each(['PUT', 'DELETE'])(
    'allows the resource owner to %s a resource',
    async (method) => {
      const findResource = vi.fn().mockResolvedValue({
        user: { id: 23 },
      });
      const documents = vi.fn().mockReturnValue({ findOne: findResource });

      const result = await isResourceOwnerPolicy(
        {
          state: {
            user: { id: 23 },
            route: {
              method,
              info: { apiName: 'resource' },
            },
            isAuthenticated: true,
          },
          request: { body: { data: {} } },
          params: { id: 'resource-document-id' },
        },
        {},
        { strapi: { documents } } as any
      );

      expect(result).toBe(true);
      expect(documents).toHaveBeenCalledWith('api::resource.resource');
      expect(findResource).toHaveBeenCalledWith({
        documentId: 'resource-document-id',
        fields: ['id'],
        populate: {
          user: {
            fields: ['id'],
          },
        },
      });
    }
  );

  test.each(['PUT', 'DELETE'])(
    'rejects a non-owner attempting to %s a resource',
    async (method) => {
      const findResource = vi.fn().mockResolvedValue({
        user: { id: 99 },
      });

      await expect(
        isResourceOwnerPolicy(
          {
            state: {
              user: { id: 23 },
              route: {
                method,
                info: { apiName: 'resource' },
              },
              isAuthenticated: true,
            },
            request: { body: { data: {} } },
            params: { id: 'resource-document-id' },
          },
          {},
          {
            strapi: {
              documents: vi.fn().mockReturnValue({ findOne: findResource }),
            },
          } as any
        )
      ).rejects.toMatchObject({ message: 'Wrong resource owner.' });
    }
  );

  test.each(['PUT', 'DELETE'])(
    'rejects an unauthenticated request to %s a resource',
    async (method) => {
      const documents = vi.fn();

      await expect(
        isResourceOwnerPolicy(
          {
            state: {
              user: null,
              route: {
                method,
                info: { apiName: 'resource' },
              },
              isAuthenticated: false,
            },
            request: { body: { data: {} } },
            params: { id: 'resource-document-id' },
          },
          {},
          { strapi: { documents } } as any
        )
      ).rejects.toMatchObject({ message: 'Wrong resource owner.' });

      expect(documents).not.toHaveBeenCalled();
    }
  );
});
