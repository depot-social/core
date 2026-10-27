import { computed, ref } from 'vue';
import type { Booking } from '@depot/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBookingDetails } from './useBookingDetails';

const fixture = () =>
  ({
    documentId: 'booking-42',
    bookingStatus: 'requested',
    createdAt: '2026-11-01',
    customer: { id: 23 },
    resourceOwner: { id: 17 },
    resource: { title: 'Bohrer', images: [{ url: '/image.jpg' }] },
    price: { value: 20 },
  } as Booking);

const setup = (userId = 17) => {
  const booking = ref<Booking | null>(fixture());
  const error = ref<unknown>(null);
  const refresh = vi.fn(async () => {});
  const findOne = vi.fn(async () => ({ data: fixture() }));
  const update = vi.fn(
    async (
      _contentType: string,
      _id: string,
      data: { bookingStatus: string }
    ) => ({ data })
  );
  const add = vi.fn();
  const confirm = vi.fn(() => true);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('useStrapi', () => ({ findOne, update }));
  vi.stubGlobal('useStrapiClient', () => findOne);
  vi.stubGlobal('useStrapiUser', () => ref({ id: userId }));
  vi.stubGlobal('useToast', () => ({ add }));
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
  vi.stubGlobal('window', { confirm });
  vi.stubGlobal('createError', (data: unknown) => data);
  vi.stubGlobal(
    'useAsyncData',
    async (_key: string, load: () => Promise<Booking>) => {
      booking.value = await load();
      return { data: booking, error, refresh };
    }
  );
  return { booking, error, refresh, findOne, update, add, confirm };
};
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('shared booking detail actions', () => {
  it('sends only status, reloads relations and uses a booking-specific cache key', async () => {
    const testCase = setup();
    const details = await useBookingDetails('booking-42');
    await details.onConfirm();
    expect(testCase.update).toHaveBeenCalledWith('bookings', 'booking-42', {
      bookingStatus: 'confirmed',
    });
    expect(testCase.refresh).toHaveBeenCalledOnce();
    expect(details.booking.value?.resource.images).toEqual([
      { url: '/image.jpg' },
    ]);
    expect(details.canConfirm.value).toBe(false);
    expect(details.canCancel.value).toBe(true);
  });
  it('requires cancellation confirmation and allows customers to cancel confirmed bookings', async () => {
    const testCase = setup(23);
    const details = await useBookingDetails('booking-42');
    testCase.booking.value!.bookingStatus = 'confirmed';
    testCase.confirm.mockReturnValueOnce(false);
    await details.onCancel();
    expect(testCase.update).not.toHaveBeenCalled();
    await details.onCancel();
    expect(testCase.confirm).toHaveBeenCalledTimes(2);
    expect(testCase.update).toHaveBeenCalledWith('bookings', 'booking-42', {
      bookingStatus: 'cancelled',
    });
    expect(details.canCancel.value).toBe(false);
  });
  it('prevents double submission and disables both actions while saving', async () => {
    const testCase = setup();
    const details = await useBookingDetails('booking-42');
    let finish!: (result: { data: { bookingStatus: string } }) => void;
    testCase.update.mockImplementationOnce(
      () =>
        new Promise<{ data: { bookingStatus: string } }>((resolve) => {
          finish = resolve;
        })
    );
    const request = details.onConfirm();
    expect(details.submitting.value).toBe(true);
    await details.onCancel();
    await details.onConfirm();
    expect(testCase.update).toHaveBeenCalledOnce();
    finish({ data: { bookingStatus: 'confirmed' } });
    await request;
    expect(details.submitting.value).toBe(false);
  });
  it('reloads a conflicting status and reports a German translation key', async () => {
    const testCase = setup();
    const details = await useBookingDetails('booking-42');
    testCase.update.mockRejectedValueOnce({ error: { status: 409 } });
    testCase.refresh.mockImplementationOnce(async () => {
      testCase.booking.value!.bookingStatus = 'cancelled';
    });
    await details.onConfirm();
    expect(testCase.refresh).toHaveBeenCalledOnce();
    expect(details.canConfirm.value).toBe(false);
    expect(testCase.add).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'bookingStatusConflict',
        color: 'error',
      })
    );
  });
  it('keeps the successfully saved status if refreshing fails', async () => {
    const testCase = setup();
    const details = await useBookingDetails('booking-42');
    testCase.refresh.mockImplementationOnce(async () => {
      testCase.booking.value = null;
      testCase.error.value = new Error('Offline');
    });
    await details.onConfirm();
    expect(details.booking.value?.bookingStatus).toBe('confirmed');
    expect(testCase.add).toHaveBeenCalledWith({
      title: 'bookingConfirmed',
      description: 'bookingReloadFailed',
    });
  });
  it('never submits a confirmation as customer or any action for a stranger', async () => {
    const customer = setup(23);
    await (await useBookingDetails('booking-42')).onConfirm();
    expect(customer.update).not.toHaveBeenCalled();
    const stranger = setup(99);
    const details = await useBookingDetails('booking-42');
    await details.onConfirm();
    await details.onCancel();
    expect(stranger.update).not.toHaveBeenCalled();
  });
});
