/// <reference types="vitest" />
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { coreCreate, coreUpdate, coreFind, strapiService, locationRedaction } =
  vi.hoisted(() => {
    const locationRedaction = {
      isRedactionEnabled: vi.fn(),
      getResourceDocumentIdFromEntity: vi.fn(),
      redactResourceLocation: vi.fn(),
      getAllowedResourceDocumentIds: vi.fn(),
    };
    return {
      coreCreate: vi.fn(),
      coreUpdate: vi.fn(),
      coreFind: vi.fn(),
      strapiService: vi.fn(() => locationRedaction),
      locationRedaction,
    };
  });

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
        find: coreFind,
      });

      return controller;
    },
  },
}));

import resourceController from './resource';
import {
  getResourceDocumentIdFromEntity,
  redactResourceLocation,
} from '../services/resourceLocationRedaction';

type ResourceController = {
  create: (ctx: Record<string, unknown>) => Promise<unknown>;
  update: (ctx: Record<string, unknown>) => Promise<unknown>;
  find: (ctx: Record<string, unknown>) => Promise<{
    data: Record<string, unknown>[];
    meta: {
      pagination?: unknown;
      locationAccess: { preciseLocationAllowedDocumentIds: string[] };
    };
  }>;
};

const controller = resourceController as unknown as ResourceController;

describe('resource location access for Nuxt address fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationRedaction.isRedactionEnabled.mockReturnValue(true);
    locationRedaction.getResourceDocumentIdFromEntity.mockImplementation(
      getResourceDocumentIdFromEntity
    );
    locationRedaction.redactResourceLocation.mockImplementation(
      redactResourceLocation
    );
    locationRedaction.getAllowedResourceDocumentIds.mockResolvedValue(
      new Set()
    );
    coreFind.mockResolvedValue({
      data: [
        {
          documentId: 'resource-1',
          address: null,
          searchIndex: 'private street',
        },
        {
          documentId: 'resource-2',
          address: { street: 'Private street', zip: '12345', latitude: 52 },
        },
      ],
      meta: { pagination: { page: 1, total: 2 } },
    });
  });

  test('allows precise fallback addresses when redaction is disabled', async () => {
    locationRedaction.isRedactionEnabled.mockReturnValue(false);
    const response = await controller.find({
      state: { route: { info: { type: 'content-api' } } },
    });
    expect(response.meta.locationAccess).toEqual({
      preciseLocationAllowedDocumentIds: ['resource-1', 'resource-2'],
    });
    expect(response.meta.pagination).toEqual({ page: 1, total: 2 });
    expect(response.data[0]).toEqual({
      documentId: 'resource-1',
      address: null,
    });
    expect(response.data[1]?.address).toEqual({
      street: 'Private street',
      zip: '12345',
      latitude: 52,
    });
    expect(
      locationRedaction.getAllowedResourceDocumentIds
    ).not.toHaveBeenCalled();
  });

  test('denies anonymous precise fallbacks even when no resource address exists', async () => {
    const response = await controller.find({
      state: { route: { info: { type: 'content-api' } } },
    });
    expect(
      response.meta.locationAccess.preciseLocationAllowedDocumentIds
    ).toEqual([]);
    expect(response.data[0]?.address).toBeNull();
    expect(response.data[1]?.address).toEqual({
      zip: '12345',
      street: undefined,
      latitude: undefined,
      longitude: undefined,
    });
    expect(
      locationRedaction.getAllowedResourceDocumentIds
    ).not.toHaveBeenCalled();
  });

  test.each([
    [
      'owner or confirmed booking party',
      ['resource-1', 'unrequested'],
      ['resource-1'],
    ],
    ['unrelated user', [], []],
  ])(
    'uses the existing location policy for an authenticated %s',
    async (_role, allowed, expected) => {
      locationRedaction.getAllowedResourceDocumentIds.mockResolvedValue(
        new Set(allowed)
      );
      const response = await controller.find({
        state: { user: { id: 42 }, route: { info: { type: 'content-api' } } },
      });
      expect(
        locationRedaction.getAllowedResourceDocumentIds
      ).toHaveBeenCalledWith(42, ['resource-1', 'resource-2']);
      expect(
        response.meta.locationAccess.preciseLocationAllowedDocumentIds
      ).toEqual(expected);
      expect(response.data[1]?.address).not.toHaveProperty(
        'street',
        'Private street'
      );
    }
  );
});

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
