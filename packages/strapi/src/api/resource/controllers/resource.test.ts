/// <reference types="vitest" />
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { coreUpdate, strapiService } = vi.hoisted(() => ({
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
        update: coreUpdate,
      });

      return controller;
    },
  },
}));

import resourceController from './resource';

type ResourceController = {
  update: (ctx: Record<string, unknown>) => Promise<unknown>;
};

describe('resource controller ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
