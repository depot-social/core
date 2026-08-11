/// <reference types="vitest" />
import type { Core } from '@strapi/strapi';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import bookingApi from './index';

interface BookingLifecycleSubscriber {
  beforeCreate: (event: unknown) => Promise<void>;
  beforeUpdate: (event: unknown) => Promise<void>;
  afterCreate: (event: unknown) => Promise<void>;
}

const existingBooking = {
  id: 42,
  start: '2026-08-21T06:00:00.000Z',
  end: '2026-08-22T20:00:00.000Z',
  bookedUnits: 1,
  resource: {
    documentId: 'resource-document-id',
  },
};

const createStrapiMock = (
  sendBookingRequestMail = vi.fn().mockResolvedValue(true)
) => {
  const findOne = vi.fn().mockResolvedValue(existingBooking);
  const findOneDocument = vi
    .fn()
    .mockResolvedValueOnce({
      resource: existingBooking.resource,
    })
    .mockResolvedValueOnce({
      start: existingBooking.start,
      end: existingBooking.end,
      resource: { title: 'Test resource' },
    });
  const updateDocument = vi.fn().mockResolvedValue(undefined);
  const addBookingMessage = vi.fn().mockResolvedValue(true);
  const getPrice = vi.fn().mockResolvedValue({
    title: 'Test price',
    value: 100,
    currency: 'euro',
    duration: 1,
    durationType: 'daily',
    tariffType: 'regular',
    resourceValue: 100,
    depositValue: 0,
    vatValue: 0,
  });
  const subscribe = vi.fn();
  const throwHttpError = (status: number, message: string) => {
    throw Object.assign(new Error(message), { status });
  };

  const strapi = {
    db: {
      query: vi.fn(() => ({ findOne })),
      lifecycles: { subscribe },
    },
    requestContext: {
      get: vi.fn(() => ({
        throw: throwHttpError,
        state: {
          user: { id: 946 },
          route: { info: { type: 'content-api' } },
        },
        request: { path: '/api/bookings' },
      })),
    },
    documents: vi.fn(() => ({
      findOne: findOneDocument,
      update: updateDocument,
    })),
    plugin: vi.fn((name: string) => ({
      service: vi.fn(() => {
        if (name === 'conversations') {
          return { addBookingMessage };
        }

        if (name === 'prices') {
          return { getPrice };
        }

        if (name === 'emails') {
          return { sendBookingRequestMail };
        }

        return undefined;
      }),
    })),
  };

  return { findOne, sendBookingRequestMail, strapi, subscribe };
};

describe('booking lifecycle validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('validates a complete create payload without loading an existing booking', async () => {
    const { strapi, subscribe } = createStrapiMock();

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;

    await expect(
      lifecycle.beforeCreate({
        params: {
          data: {
            start: existingBooking.start,
            end: existingBooking.end,
            bookedUnits: existingBooking.bookedUnits,
            resource: existingBooking.resource,
          },
        },
      })
    ).resolves.toBeUndefined();

    expect(strapi.db.query).not.toHaveBeenCalled();
  });

  test('validates an internal partial update against the persisted booking', async () => {
    const { findOne, strapi, subscribe } = createStrapiMock();

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;
    const where = { id: existingBooking.id };

    await expect(
      lifecycle.beforeUpdate({
        params: {
          where,
          data: {
            price: {
              value: 100,
            },
          },
        },
      })
    ).resolves.toBeUndefined();

    expect(findOne).toHaveBeenCalledWith({
      where,
      populate: ['resource'],
    });
  });

  test('validates submitted update fields as part of the merged booking', async () => {
    const { strapi, subscribe } = createStrapiMock();

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;

    await expect(
      lifecycle.beforeUpdate({
        params: {
          where: { id: existingBooking.id },
          data: {
            start: '2026-08-23T06:00:00.000Z',
          },
        },
      })
    ).rejects.toMatchObject({
      message: 'End date must be larger than start date.',
      status: 400,
    });
  });

  test('waits for the booking email before completing the create lifecycle', async () => {
    let resolveEmail: (sent: boolean) => void = () => undefined;
    const emailPromise = new Promise<boolean>((resolve) => {
      resolveEmail = resolve;
    });
    const sendBookingRequestMail = vi.fn(() => emailPromise);
    const { strapi, subscribe } = createStrapiMock(sendBookingRequestMail);

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;
    const lifecycleCompleted = vi.fn();
    const lifecyclePromise = lifecycle
      .afterCreate({
        result: {
          ...existingBooking,
          documentId: 'booking-document-id',
        },
      })
      .then(lifecycleCompleted);

    await vi.waitFor(() => {
      expect(sendBookingRequestMail).toHaveBeenCalledWith(
        'booking-document-id'
      );
    });
    expect(lifecycleCompleted).not.toHaveBeenCalled();

    resolveEmail(true);
    await lifecyclePromise;

    expect(lifecycleCompleted).toHaveBeenCalledOnce();
  });
});
