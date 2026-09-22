/// <reference types="vitest" />
import type { Core } from '@strapi/strapi';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import resourceApi from './index';

type ResourceLifecycleSubscriber = {
  beforeCreate: (event: {
    params: { data: Record<string, unknown> };
  }) => Promise<void>;
  beforeUpdate: (event: {
    params: {
      data: Record<string, unknown>;
      where: { id: number | string };
    };
  }) => Promise<void>;
  afterCreate: (event: { result: { documentId: string } }) => Promise<void>;
};

const createHttpError = (status: number, message: string): never => {
  throw Object.assign(new Error(message), { status });
};

const createStrapiMock = (user: { documentId: string } | null) => {
  const generateUIDField = vi.fn().mockResolvedValue('resource-title');
  const subscribe = vi.fn();
  const availabilityCreate = vi.fn();
  const availabilityFindOne = vi.fn();
  const availabilityUpdate = vi.fn();
  const resourceFindOne = vi.fn();
  const userFindOne = vi.fn().mockResolvedValue(user ? { id: 23 } : null);
  const resourceUnpublish = vi.fn();
  const query = vi.fn((uid: string) => {
    if (uid === 'api::availability.availability') {
      return {
        findOne: availabilityFindOne,
        update: availabilityUpdate,
      };
    }

    if (uid === 'api::resource.resource') {
      return { findOne: resourceFindOne };
    }

    if (uid === 'plugin::users-permissions.user') {
      return { findOne: userFindOne };
    }

    return { findOne: vi.fn(), update: vi.fn() };
  });
  const ctx = {
    throw: createHttpError,
    state: {
      user,
      route: { info: { type: 'content-api' } },
      resourceDefaultAvailableUnits: undefined as number | undefined,
    },
    request: { path: '/api/resources' },
  };
  const strapi = {
    db: {
      lifecycles: { subscribe },
      query,
    },
    requestContext: {
      get: vi.fn(() => ctx),
    },
    documents: vi.fn((uid: string) =>
      uid === 'api::availability.availability'
        ? { create: availabilityCreate }
        : { unpublish: resourceUnpublish }
    ),
    plugin: vi.fn(() => null),
    service: vi.fn(() => ({ generateUIDField })),
  };

  return {
    availabilityCreate,
    availabilityFindOne,
    availabilityUpdate,
    ctx,
    generateUIDField,
    resourceFindOne,
    strapi,
    subscribe,
    userFindOne,
  };
};

describe('resource lifecycle ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test('assigns the authenticated user database id after Content API validation', async () => {
    const { generateUIDField, strapi, subscribe, userFindOne } =
      createStrapiMock({
        documentId: 'authenticated-user-document-id',
      });
    const data = {
      title: 'Resource title',
      user: { documentId: 'submitted-user-document-id' },
    };

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await lifecycle.beforeCreate({ params: { data } });

    expect(userFindOne).toHaveBeenCalledWith({
      where: { documentId: 'authenticated-user-document-id' },
      select: ['id'],
    });
    expect(data.user).toEqual({ id: 23 });
    expect(generateUIDField).toHaveBeenCalledOnce();
  });

  test('rejects unauthenticated Content API resource creation', async () => {
    const { strapi, subscribe } = createStrapiMock(null);

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await expect(
      lifecycle.beforeCreate({ params: { data: { title: 'Resource title' } } })
    ).rejects.toMatchObject({
      message: 'Authentication required.',
      status: 401,
    });
  });

  test('rejects resource creation when the authenticated user no longer exists', async () => {
    const { strapi, subscribe, userFindOne } = createStrapiMock({
      documentId: 'authenticated-user-document-id',
    });
    userFindOne.mockResolvedValue(null);

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await expect(
      lifecycle.beforeCreate({ params: { data: { title: 'Resource title' } } })
    ).rejects.toMatchObject({
      message: 'Authentication required.',
      status: 401,
    });
  });

  test('creates a default availability after creating a resource', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'));
    const { availabilityCreate, ctx, strapi, subscribe } = createStrapiMock({
      documentId: 'authenticated-user-document-id',
    });
    ctx.state.resourceDefaultAvailableUnits = 17;

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await lifecycle.afterCreate({
      result: { documentId: 'resource-document-id' },
    });

    expect(availabilityCreate).toHaveBeenCalledWith({
      data: {
        title: 'default',
        start: '2026-09-21T12:00:00.000Z',
        end: null,
        availableUnits: 17,
        resource: { documentId: 'resource-document-id' },
      },
    });
  });

  test('uses one unit for a resource created without availableUnits', async () => {
    const { availabilityCreate, strapi, subscribe } = createStrapiMock(null);
    strapi.requestContext.get.mockReturnValue(undefined);

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await lifecycle.afterCreate({
      result: { documentId: 'resource-document-id' },
    });

    expect(availabilityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          availableUnits: 1,
          end: null,
        }),
      })
    );
  });

  test('creates one default when Strapi creates draft and published resource entries', async () => {
    const { availabilityCreate, availabilityFindOne, strapi, subscribe } =
      createStrapiMock({ documentId: 'authenticated-user-document-id' });
    availabilityFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 13 });

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await lifecycle.afterCreate({
      result: { documentId: 'resource-document-id' },
    });
    await lifecycle.afterCreate({
      result: { documentId: 'resource-document-id' },
    });

    expect(availabilityCreate).toHaveBeenCalledOnce();
    expect(availabilityFindOne).toHaveBeenCalledTimes(2);
    expect(availabilityFindOne).toHaveBeenCalledWith({
      where: {
        resource: { documentId: 'resource-document-id' },
        end: { $null: true },
      },
    });
  });

  test('updates the existing default availability when availableUnits is submitted', async () => {
    const {
      availabilityFindOne,
      availabilityUpdate,
      ctx,
      resourceFindOne,
      strapi,
      subscribe,
    } = createStrapiMock({ documentId: 'authenticated-user-document-id' });
    availabilityFindOne.mockResolvedValue({ id: 13 });
    resourceFindOne.mockResolvedValue({ documentId: 'resource-document-id' });
    ctx.state.resourceDefaultAvailableUnits = 42;

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await lifecycle.beforeUpdate({
      params: { data: { title: 'Updated title' }, where: { id: 7 } },
    });

    expect(availabilityUpdate).toHaveBeenCalledWith({
      where: { id: 13 },
      data: { availableUnits: 42 },
    });
  });

  test('lazily creates a default availability during an update when none exists', async () => {
    const {
      availabilityCreate,
      availabilityFindOne,
      ctx,
      resourceFindOne,
      strapi,
      subscribe,
    } = createStrapiMock({ documentId: 'authenticated-user-document-id' });
    availabilityFindOne.mockResolvedValue(null);
    resourceFindOne.mockResolvedValue({ documentId: 'resource-document-id' });
    ctx.state.resourceDefaultAvailableUnits = 42;

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await lifecycle.beforeUpdate({
      params: { data: { title: 'Updated title' }, where: { id: 7 } },
    });

    expect(availabilityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          availableUnits: 1,
          end: null,
          resource: { documentId: 'resource-document-id' },
        }),
      })
    );
  });
});
