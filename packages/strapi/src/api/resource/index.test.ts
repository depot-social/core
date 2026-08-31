/// <reference types="vitest" />
import type { Core } from '@strapi/strapi';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import resourceApi from './index';

type ResourceLifecycleSubscriber = {
  beforeCreate: (event: {
    params: { data: Record<string, unknown> };
  }) => Promise<void>;
};

const createHttpError = (status: number, message: string): never => {
  throw Object.assign(new Error(message), { status });
};

const createStrapiMock = (user: { documentId: string } | null) => {
  const generateUIDField = vi.fn().mockResolvedValue('resource-title');
  const subscribe = vi.fn();
  const strapi = {
    db: {
      lifecycles: { subscribe },
    },
    requestContext: {
      get: vi.fn(() => ({
        throw: createHttpError,
        state: {
          user,
          route: { info: { type: 'content-api' } },
        },
        request: { path: '/api/resources' },
      })),
    },
    service: vi.fn(() => ({ generateUIDField })),
  };

  return { generateUIDField, strapi, subscribe };
};

describe('resource lifecycle ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('assigns the authenticated user after Content API validation', async () => {
    const { generateUIDField, strapi, subscribe } = createStrapiMock({
      documentId: 'authenticated-user-document-id',
    });
    const data = {
      title: 'Resource title',
      user: { documentId: 'submitted-user-document-id' },
    };

    await resourceApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as ResourceLifecycleSubscriber;

    await lifecycle.beforeCreate({ params: { data } });

    expect(data.user).toEqual({
      documentId: 'authenticated-user-document-id',
    });
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
});
