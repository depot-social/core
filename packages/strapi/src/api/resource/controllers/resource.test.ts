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

describe('resource controller ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('captures availableUnits and ignores relation and ownership updates', async () => {
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
            availabilities: { set: ['availability-document-id'] },
            availableUnits: 25,
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
    expect(ctx.state).toMatchObject({ resourceDefaultAvailableUnits: 25 });
    expect(coreUpdate).toHaveBeenCalledWith(ctx);
  });

  test('captures availableUnits before Content API validation on create', async () => {
    const response = { data: { documentId: 'resource-document-id' } };
    const ctx = {
      state: {},
      request: {
        body: {
          data: {
            title: 'New resource title',
            availabilities: { connect: ['availability-document-id'] },
            availableUnits: 100,
          },
        },
      },
    };
    coreCreate.mockResolvedValue(response);

    await expect(
      (resourceController as unknown as ResourceController).create(ctx)
    ).resolves.toEqual(response);

    expect(ctx.request.body.data).toEqual({ title: 'New resource title' });
    expect(ctx.state).toMatchObject({ resourceDefaultAvailableUnits: 100 });
    expect(coreCreate).toHaveBeenCalledWith(ctx);
  });

  test.each([0, 101, 1.5])(
    'rejects invalid availableUnits %s before Content API validation',
    async (availableUnits) => {
      const ctx = {
        state: {},
        request: {
          body: {
            data: {
              title: 'New resource title',
              availableUnits,
            },
          },
        },
      };

      await expect(
        (resourceController as unknown as ResourceController).create(ctx)
      ).rejects.toThrow('availableUnits must be an integer between 1 and 100.');

      expect(coreCreate).not.toHaveBeenCalled();
    }
  );
});
