/// <reference types="vitest" />
import { errors } from '@strapi/utils';
import { expect, test, vi } from 'vitest';
import createPricesController from '../controllers/prices-controller';

test('getPrice returns a not-found error when the price service finds no price', async () => {
  const getPrice = vi
    .fn()
    .mockRejectedValue(new errors.ApplicationError('No price found'));
  const throwHttpError = vi.fn((status: number, message: string) => {
    throw Object.assign(new Error(message), { status });
  });
  const strapi = {
    plugin: vi.fn((name: string) => {
      if (name === 'users-permissions') {
        return { service: vi.fn(() => ({ getToken: vi.fn() })) };
      }

      if (name === 'prices') {
        return { service: vi.fn(() => ({ getPrice })) };
      }

      return undefined;
    }),
  };
  const ctx = {
    params: { id: 'resource-document-id' },
    query: {
      start: '2026-08-27T06:00:00.000Z',
      end: '2026-08-28T20:00:00.000Z',
      units: '1',
    },
    throw: throwHttpError,
    state: {},
  };
  const controller = createPricesController({ strapi: strapi as never });

  await expect(controller.getPrice(ctx as never)).rejects.toMatchObject({
    message: 'No price found',
    status: 404,
  });

  expect(throwHttpError).toHaveBeenCalledWith(404, 'No price found');
});
