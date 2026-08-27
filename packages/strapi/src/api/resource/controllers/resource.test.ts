/// <reference types="vitest" />
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { coreCreate, coreUpdate, strapiService } = vi.hoisted(() => ({
  coreCreate: vi.fn(),
  coreUpdate: vi.fn(),
  strapiService: vi.fn(),
}));

vi.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController: (
      _contentType: string,
      createController: (dependencies: {
        strapi: { service: typeof strapiService };
      }) => object
    ) => {
      const controller = createController({
        strapi: { service: strapiService },
      });

      Object.setPrototypeOf(controller, {
        create: coreCreate,
        update: coreUpdate,
      });

      return controller;
    },
  },
}));

import resourceController from './resource';

type ResourceController = {
  create: (ctx: Record<string, unknown>) => Promise<unknown>;
  update: (ctx: Record<string, unknown>) => Promise<unknown>;
};

const createHttpError = (status: number, message: string): never => {
  throw Object.assign(new Error(message), { status });
};

describe('resource controller ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('assigns the authenticated user as resource owner during creation', async () => {
    const response = { data: { documentId: 'resource-document-id' } };
    const ctx = {
      state: {
        user: { id: 23, documentId: 'auth-user-document-id' },
      },
      request: {
        body: {
          data: {
            title: 'Resource title',
            user: 'other-user-document-id',
          },
        },
      },
      throw: createHttpError,
    };
    coreCreate.mockResolvedValue(response);

    await expect(
      (resourceController as unknown as ResourceController).create(ctx)
    ).resolves.toEqual(response);

    expect(ctx.request.body.data.user).toEqual({
      documentId: 'auth-user-document-id',
    });
    expect(coreCreate).toHaveBeenCalledWith(ctx);
  });

  test('rejects unauthenticated resource creation', async () => {
    const ctx = {
      state: { user: null },
      request: {
        body: {
          data: { title: 'Resource title' },
        },
      },
      throw: createHttpError,
    };

    await expect(
      (resourceController as unknown as ResourceController).create(ctx)
    ).rejects.toMatchObject({
      message: 'Authentication required.',
      status: 401,
    });
    expect(coreCreate).not.toHaveBeenCalled();
  });

  test('ignores submitted ownership during update', async () => {
    const response = { data: { documentId: 'resource-document-id' } };
    const ctx = {
      state: {
        user: { id: 23, documentId: 'auth-user-document-id' },
      },
      request: {
        body: {
          data: {
            title: 'Updated resource title',
            user: 'other-user-document-id',
          },
        },
      },
      throw: createHttpError,
    };
    coreUpdate.mockResolvedValue(response);

    await expect(
      (resourceController as unknown as ResourceController).update(ctx)
    ).resolves.toEqual(response);

    expect(ctx.request.body.data).toEqual({
      title: 'Updated resource title',
    });
    expect(coreUpdate).toHaveBeenCalledWith(ctx);
  });
});
