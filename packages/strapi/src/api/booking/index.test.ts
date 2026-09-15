/// <reference types="vitest" />
import type { Core } from '@strapi/strapi';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import bookingApi from './index';

interface BookingLifecycleSubscriber {
  beforeCreate: (event: unknown) => Promise<void>;
  beforeUpdate: (event: unknown) => Promise<void>;
  afterCreate: (event: unknown) => Promise<void>;
  afterUpdate: (event: unknown) => Promise<void>;
}

const existingBooking = {
  id: 42,
  start: '2026-08-21T06:00:00.000Z',
  end: '2026-08-22T20:00:00.000Z',
  bookedUnits: 1,
  resource: {
    id: 73,
    documentId: 'resource-document-id',
  },
  customer: {
    id: 23,
  },
};

const createStrapiMock = (
  sendBookingRequestMail = vi.fn().mockResolvedValue(true)
) => {
  const findOne = vi.fn().mockResolvedValue(existingBooking);
  const findResourceByDatabaseId = vi.fn().mockResolvedValue({
    id: 73,
    documentId: existingBooking.resource.documentId,
    user: { id: 17 },
  });
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
  const findResource = vi.fn().mockResolvedValue({
    documentId: existingBooking.resource.documentId,
    user: { id: 17 },
  });
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
      query: vi.fn((uid: string) => ({
        findOne:
          uid === 'api::resource.resource' ? findResourceByDatabaseId : findOne,
      })),
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
    documents: vi.fn((uid: string) =>
      uid === 'api::resource.resource'
        ? { findOne: findResource }
        : {
            findOne: findOneDocument,
            update: updateDocument,
          }
    ),
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

  return {
    findOne,
    findResource,
    findResourceByDatabaseId,
    sendBookingRequestMail,
    strapi,
    subscribe,
  };
};

describe('booking lifecycle validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('validates a complete create payload without loading an existing booking', async () => {
    const {
      findOne,
      findResource,
      findResourceByDatabaseId,
      strapi,
      subscribe,
    } = createStrapiMock();

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;

    const data = {
      start: existingBooking.start,
      end: existingBooking.end,
      bookedUnits: existingBooking.bookedUnits,
      resource: { set: [{ id: 73 }] },
      customer: 999,
      resourceOwner: 888,
    };

    await expect(
      lifecycle.beforeCreate({
        params: {
          data,
        },
      })
    ).resolves.toBeUndefined();

    expect(findResourceByDatabaseId).toHaveBeenCalledWith({
      where: { id: 73 },
      populate: ['user'],
    });
    expect(findResource).not.toHaveBeenCalled();
    expect(findOne).not.toHaveBeenCalled();
    expect(data).toMatchObject({
      customer: 946,
      resourceOwner: 17,
    });
    expect(strapi.plugin).not.toHaveBeenCalledWith('plugin-availabilities');
  });

  test('validates an internal partial update against the persisted booking', async () => {
    const { findOne, findResourceByDatabaseId, strapi, subscribe } =
      createStrapiMock();

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;
    const where = { id: existingBooking.id };

    const data = {
      price: {
        value: 100,
      },
      resource: { set: [{ id: 73 }] },
      customer: 999,
      resourceOwner: 888,
    };

    await expect(
      lifecycle.beforeUpdate({
        params: {
          where,
          data,
        },
      })
    ).resolves.toBeUndefined();

    expect(findOne).toHaveBeenCalledWith({
      where,
      populate: ['resource', 'customer'],
    });
    expect(findResourceByDatabaseId).toHaveBeenCalledWith({
      where: { id: 73 },
      populate: ['user'],
    });
    expect(data).toMatchObject({
      customer: existingBooking.customer.id,
      resourceOwner: 17,
    });
    expect(strapi.plugin).not.toHaveBeenCalledWith('plugin-availabilities');
  });

  test('does not assign booking parties for admin or backoffice writes', async () => {
    const { findResource, findResourceByDatabaseId, strapi, subscribe } =
      createStrapiMock();
    strapi.requestContext.get.mockReturnValue({
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
      state: {
        user: { id: 946 },
        route: { info: { type: 'admin' } },
      },
      request: {
        path: '/content-manager/collection-types/api::booking.booking',
      },
    });

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;
    const data = {
      start: existingBooking.start,
      end: existingBooking.end,
      bookedUnits: existingBooking.bookedUnits,
      resource: existingBooking.resource,
      customer: 99,
      resourceOwner: 88,
    };

    await lifecycle.beforeCreate({ params: { data } });

    expect(data).toMatchObject({ customer: 99, resourceOwner: 88 });
    expect(findResource).not.toHaveBeenCalled();
    expect(findResourceByDatabaseId).not.toHaveBeenCalled();
  });

  test('does not assign booking parties for context-free internal writes', async () => {
    const { findResource, findResourceByDatabaseId, strapi, subscribe } =
      createStrapiMock();
    strapi.requestContext.get.mockReturnValue(undefined);

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;
    const data = {
      start: existingBooking.start,
      end: existingBooking.end,
      bookedUnits: existingBooking.bookedUnits,
      resource: existingBooking.resource,
      customer: 99,
      resourceOwner: 88,
    };

    await lifecycle.beforeCreate({ params: { data } });

    expect(data).toMatchObject({ customer: 99, resourceOwner: 88 });
    expect(findResource).not.toHaveBeenCalled();
    expect(findResourceByDatabaseId).not.toHaveBeenCalled();
  });

  test('requires an authenticated user for content API writes', async () => {
    const { strapi, subscribe } = createStrapiMock();
    strapi.requestContext.get.mockReturnValue({
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
      state: { route: { info: { type: 'content-api' } } },
      request: { path: '/api/bookings' },
    });

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
    ).rejects.toMatchObject({
      message: 'Authentication required.',
      status: 401,
    });
  });

  test('rejects a content API booking with an invalid resource relation', async () => {
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
            resource: { set: [] },
          },
        },
      })
    ).rejects.toMatchObject({
      message: 'Invalid resource document ID.',
      status: 400,
    });
  });

  test('rejects a content API booking when the resource has no owner', async () => {
    const { findResourceByDatabaseId, strapi, subscribe } = createStrapiMock();
    findResourceByDatabaseId.mockResolvedValue({
      id: existingBooking.resource.id,
      documentId: existingBooking.resource.documentId,
      user: null,
    });

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
    ).rejects.toMatchObject({
      message: 'Resource has no owner.',
      status: 400,
    });
  });

  test('rejects an update when the persisted booking has no customer', async () => {
    const { findOne, strapi, subscribe } = createStrapiMock();
    findOne.mockResolvedValue({ ...existingBooking, customer: null });

    await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
    const lifecycle = subscribe.mock.calls[0][0] as BookingLifecycleSubscriber;

    await expect(
      lifecycle.beforeUpdate({
        params: {
          where: { id: existingBooking.id },
          data: { commentCustomer: 'Updated comment' },
        },
      })
    ).rejects.toMatchObject({
      message: 'Booking has no customer.',
      status: 400,
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

  test('does not access the Prices plugin or write a booking price when disabled', async () => {
    const originalPricesSetting = process.env.STRAPI_PLUGIN_PRICES;
    process.env.STRAPI_PLUGIN_PRICES = 'false';

    try {
      const { strapi, subscribe } = createStrapiMock();

      await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
      const lifecycle = subscribe.mock
        .calls[0][0] as BookingLifecycleSubscriber;
      const event = {
        result: {
          ...existingBooking,
          documentId: 'booking-document-id',
        },
      };

      await expect(lifecycle.afterCreate(event)).resolves.toBeUndefined();
      await expect(lifecycle.afterUpdate(event)).resolves.toBeUndefined();

      expect(strapi.plugin).not.toHaveBeenCalledWith('prices');
      expect(
        strapi.documents('api::booking.booking').update
      ).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: expect.anything() }),
        })
      );
    } finally {
      if (originalPricesSetting === undefined) {
        delete process.env.STRAPI_PLUGIN_PRICES;
      } else {
        process.env.STRAPI_PLUGIN_PRICES = originalPricesSetting;
      }
    }
  });

  test('calculates and persists a booking price when enabled', async () => {
    const originalPricesSetting = process.env.STRAPI_PLUGIN_PRICES;
    process.env.STRAPI_PLUGIN_PRICES = 'true';

    try {
      const { strapi, subscribe } = createStrapiMock();

      await bookingApi.bootstrap({ strapi: strapi as unknown as Core.Strapi });
      const lifecycle = subscribe.mock
        .calls[0][0] as BookingLifecycleSubscriber;

      await lifecycle.afterUpdate({
        result: {
          ...existingBooking,
          documentId: 'booking-document-id',
        },
      });

      expect(strapi.plugin).toHaveBeenCalledWith('prices');
      expect(
        strapi.documents('api::booking.booking').update
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'booking-document-id',
          data: expect.objectContaining({
            price: expect.objectContaining({ value: 100 }),
          }),
        })
      );
    } finally {
      if (originalPricesSetting === undefined) {
        delete process.env.STRAPI_PLUGIN_PRICES;
      } else {
        process.env.STRAPI_PLUGIN_PRICES = originalPricesSetting;
      }
    }
  });
});
