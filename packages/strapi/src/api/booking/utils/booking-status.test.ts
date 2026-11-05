import type { Core } from '@strapi/strapi';
import type { Booking, BookingStatus } from '@depot/shared';
import { describe, expect, test, vi } from 'vitest';
import { createBookingStatusService } from './booking-status';

const fixture = (bookingStatus: BookingStatus = 'requested') =>
  ({
    id: 42,
    documentId: 'booking-42',
    bookingStatus,
    start: '2026-11-01T10:00:00Z',
    end: '2026-11-01T12:00:00Z',
    bookedUnits: 2,
    customer: { id: 23, firstName: 'Anna', lastName: 'Kunde' },
    resourceOwner: { id: 17, firstName: 'Ben', lastName: 'Verleiher' },
    resource: { documentId: 'resource-1', title: 'Bohrer' },
    price: { value: 20 },
    customerAddress: { street: 'Teststraße' },
    commentCustomer: 'Unverändert',
  } as Booking);

const setup = (status: BookingStatus = 'requested') => {
  let persisted: Booking | null = fixture(status);
  const findOne = vi.fn(async () => persisted && structuredClone(persisted));
  const updateMany = vi.fn(async ({ where, data }) => {
    const allowedStatuses =
      typeof where.bookingStatus === 'string'
        ? [where.bookingStatus]
        : where.bookingStatus.$in;
    if (!persisted || !allowedStatuses.includes(persisted.bookingStatus))
      return { count: 0 };
    persisted = { ...persisted, ...data };
    return { count: 1 };
  });
  const mails = {
    sendBookingConfirmedMail: vi.fn().mockResolvedValue(true),
    sendBookingCancelledMail: vi.fn().mockResolvedValue(true),
  };
  const strapi = {
    documents: vi.fn(() => ({ findOne })),
    db: { query: vi.fn(() => ({ updateMany })) },
    plugin: vi.fn(() => ({ service: () => mails })),
    log: { error: vi.fn() },
  };
  return {
    service: createBookingStatusService(strapi as unknown as Core.Strapi),
    strapi,
    findOne,
    updateMany,
    mails,
    read: () => persisted,
    write: (booking: Booking | null) => {
      persisted = booking;
    },
  };
};

describe('booking status actions', () => {
  test.each([
    ['requested', 23, 'cancelled'],
    ['requested', 17, 'confirmed'],
    ['requested', 17, 'cancelled'],
    ['confirmed', 23, 'cancelled'],
    ['confirmed', 17, 'cancelled'],
  ] as const)(
    '%s: user %s may set %s without changing booking data',
    async (from, user, to) => {
      const testCase = setup(from);
      await testCase.service.updateStatus('booking-42', user, {
        bookingStatus: to,
      });
      expect(testCase.read()).toEqual({
        ...fixture(from),
        bookingStatus: to,
        updatedAt: expect.any(String),
      });
      expect(testCase.updateMany).toHaveBeenCalledWith({
        where: {
          id: 42,
          bookingStatus:
            to === 'cancelled'
              ? { $in: ['requested', 'confirmed'] }
              : 'requested',
        },
        data: { bookingStatus: to, updatedAt: expect.any(String) },
      });
      expect(testCase.strapi.plugin).toHaveBeenCalledWith('emails');
      expect(testCase.strapi.plugin).not.toHaveBeenCalledWith('prices');
    }
  );

  test.each([
    ['requested', 23, 'confirmed', 403],
    ['confirmed', 23, 'confirmed', 403],
    ['requested', 99, 'cancelled', 403],
    ['requested', 99, 'confirmed', 403],
    ['cancelled', 99, 'cancelled', 403],
    ['cancelled', 17, 'confirmed', 409],
    ['cancelled', 23, 'confirmed', 403],
  ] as const)('%s: user %s cannot set %s', async (from, user, to, status) => {
    const testCase = setup(from);
    await expect(
      testCase.service.updateStatus('booking-42', user, { bookingStatus: to })
    ).rejects.toMatchObject({ status });
    expect(testCase.updateMany).not.toHaveBeenCalled();
    expect(testCase.strapi.plugin).not.toHaveBeenCalled();
  });

  test.each([
    undefined,
    null,
    [],
    {},
    { bookingStatus: 'requested' },
    { bookingStatus: 'confirmed', commentCustomer: 'changed' },
    { bookingStatus: 'cancelled', start: fixture().start },
    { bookingStatus: 'cancelled', price: {} },
    { bookingStatus: 'cancelled', customer: 23 },
    { bookingStatus: 'confirmed', resourceOwner: 17 },
  ])('rejects malformed or extended payload %j', async (data) => {
    const testCase = setup();
    await expect(
      testCase.service.updateStatus('booking-42', 17, data)
    ).rejects.toMatchObject({ status: 400 });
    expect(testCase.updateMany).not.toHaveBeenCalled();
  });

  test('returns 404 for unknown bookings and rejects unauthenticated writes', async () => {
    const testCase = setup();
    testCase.write(null);
    await expect(
      testCase.service.updateStatus('missing', 17, {
        bookingStatus: 'confirmed',
      })
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      testCase.service.updateStatus('missing', NaN, {
        bookingStatus: 'confirmed',
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  test.each([
    ['confirmed', 17],
    ['cancelled', 23],
    ['cancelled', 17],
  ] as const)('repeating %s is idempotent', async (status, user) => {
    const testCase = setup(status);
    await testCase.service.updateStatus('booking-42', user, {
      bookingStatus: status,
    });
    expect(testCase.updateMany).not.toHaveBeenCalled();
    expect(testCase.strapi.plugin).not.toHaveBeenCalled();
  });

  test('two simultaneous confirmations send exactly one mail', async () => {
    const testCase = setup();
    await Promise.all(
      [1, 2].map(() =>
        testCase.service.updateStatus('booking-42', 17, {
          bookingStatus: 'confirmed',
        })
      )
    );
    expect(testCase.mails.sendBookingConfirmedMail).toHaveBeenCalledTimes(1);
  });

  test('two simultaneous cancellations send exactly one cancellation event with the winning actor', async () => {
    const testCase = setup();
    await Promise.all(
      [23, 17].map((user) =>
        testCase.service.updateStatus('booking-42', user, {
          bookingStatus: 'cancelled',
        })
      )
    );
    expect(testCase.mails.sendBookingCancelledMail).toHaveBeenCalledTimes(1);
    expect(testCase.mails.sendBookingCancelledMail).toHaveBeenCalledWith(
      expect.objectContaining({ bookingStatus: 'cancelled' }),
      { role: 'customer', name: 'Anna Kunde' }
    );
  });

  test('cancellation can follow a concurrent confirmation', async () => {
    const testCase = setup();
    const saveStatus = testCase.updateMany.getMockImplementation()!;
    testCase.updateMany.mockImplementationOnce(async (params) => {
      testCase.write(fixture('confirmed'));
      return saveStatus(params);
    });
    await testCase.service.updateStatus('booking-42', 23, {
      bookingStatus: 'cancelled',
    });
    expect(testCase.read()?.bookingStatus).toBe('cancelled');
    expect(testCase.updateMany).toHaveBeenCalledTimes(1);
    expect(testCase.findOne).toHaveBeenCalledTimes(1);
    expect(testCase.mails.sendBookingCancelledMail).toHaveBeenCalledTimes(1);
  });

  test('a concurrent cancellation cannot be overwritten by confirmation', async () => {
    const testCase = setup();
    testCase.updateMany.mockImplementationOnce(async () => {
      testCase.write(fixture('cancelled'));
      return { count: 0 };
    });
    await expect(
      testCase.service.updateStatus('booking-42', 17, {
        bookingStatus: 'confirmed',
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(testCase.read()?.bookingStatus).toBe('cancelled');
    expect(testCase.strapi.plugin).not.toHaveBeenCalled();
  });

  test('an unresolved write conflict returns 409 without retrying', async () => {
    const testCase = setup();
    testCase.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      testCase.service.updateStatus('booking-42', 17, {
        bookingStatus: 'confirmed',
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(testCase.updateMany).toHaveBeenCalledTimes(1);
    expect(testCase.findOne).toHaveBeenCalledTimes(2);
    expect(testCase.strapi.plugin).not.toHaveBeenCalled();
  });

  test('a mail exception cannot undo a persisted status; disabled emails need no price plugin', async () => {
    const testCase = setup();
    testCase.mails.sendBookingConfirmedMail.mockRejectedValue(
      new Error('SMTP down')
    );
    await expect(
      testCase.service.updateStatus('booking-42', 17, {
        bookingStatus: 'confirmed',
      })
    ).resolves.toMatchObject({ bookingStatus: 'confirmed' });
    expect(testCase.strapi.log.error).toHaveBeenCalled();
    testCase.strapi.plugin.mockReturnValue(undefined);
    await expect(
      testCase.service.updateStatus('booking-42', 23, {
        bookingStatus: 'cancelled',
      })
    ).resolves.toMatchObject({ bookingStatus: 'cancelled' });
  });
});
