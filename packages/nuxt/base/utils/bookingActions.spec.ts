import type { Booking } from '@depot/shared';
import { describe, expect, it } from 'vitest';
import { getBookingPermissions } from './bookingActions';

describe('booking action visibility for both detail views', () => {
  it.each([
    ['requested', 23, false, true],
    ['requested', 17, true, true],
    ['confirmed', 23, false, true],
    ['confirmed', 17, false, true],
    ['cancelled', 23, false, false],
    ['cancelled', 17, false, false],
    ['requested', 99, false, false],
    ['requested', undefined, false, false],
  ] as const)('%s for user %s', (status, user, confirm, cancel) => {
    const booking = {
      bookingStatus: status,
      customer: { id: 23 },
      resourceOwner: { id: 17 },
    } as Booking;
    expect(getBookingPermissions(booking, user)).toMatchObject({
      canConfirm: confirm,
      canCancel: cancel,
    });
  });
  it('has no actions before a booking has loaded', () => {
    expect(getBookingPermissions(null, 23)).toMatchObject({
      canConfirm: false,
      canCancel: false,
    });
  });
});
