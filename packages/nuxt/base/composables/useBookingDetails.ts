import type { Booking, UpdateBookingRequest } from '@depot/shared';
import { getBookingPermissions } from '../utils/bookingActions';
import { getStrapiErrorStatus, PAGE_NOT_FOUND } from '../utils/errors';

export const useBookingDetails = async (documentId: string) => {
  const { update } = useStrapi();
  const client = useStrapiClient();
  const user = useStrapiUser();
  const toast = useToast();
  const { t } = useI18n();
  const submitting = ref(false);
  const {
    data: booking,
    refresh,
    error,
  } = await useAsyncData(`booking-${documentId}`, async () => {
    const response = await client<{ data: Booking }>(
      `/bookings/${encodeURIComponent(documentId)}`,
      {
        params: {
          populate: [
            'resource',
            'resource.images',
            'resource.prices',
            'resource.address',
            'resource.user',
            'resource.user.organization',
            'customer',
            'customerAddress',
            'resourceOwner',
            'price',
          ],
        },
      }
    );
    if (!response?.data)
      throw createError({ statusCode: 404, statusMessage: PAGE_NOT_FOUND });
    return response.data;
  });
  if (!booking.value)
    throw createError({ statusCode: 404, statusMessage: PAGE_NOT_FOUND });

  const permissions = computed(() =>
    getBookingPermissions(booking.value, Number(user.value?.id))
  );
  const reloadBooking = async () => {
    const previous = booking.value;
    await refresh();
    if (error.value) booking.value = previous;
    return !error.value;
  };
  const changeStatus = async (
    bookingStatus: UpdateBookingRequest['bookingStatus']
  ) => {
    if (submitting.value) return;
    if (
      bookingStatus === 'confirmed'
        ? !permissions.value.canConfirm
        : !permissions.value.canCancel
    )
      return;
    if (
      bookingStatus === 'cancelled' &&
      !window.confirm(t('bookingCancelConfirmation'))
    )
      return;
    submitting.value = true;
    try {
      const response = await update<Booking>('bookings', documentId, {
        bookingStatus,
      } satisfies UpdateBookingRequest);
      if (!response?.data) throw new Error('Missing booking response');
      // Keep populated relations while refreshing, and keep the saved status if
      // the follow-up read fails after a successful write.
      if (booking.value)
        booking.value = {
          ...booking.value,
          bookingStatus: response.data.bookingStatus,
        };
      await reloadBooking();
      toast.add({
        title: t(
          bookingStatus === 'confirmed'
            ? 'bookingConfirmed'
            : 'bookingCancelled'
        ),
        description: error.value ? t('bookingReloadFailed') : undefined,
      });
    } catch (cause) {
      const status = getStrapiErrorStatus(cause);
      if (status === 409) await reloadBooking();
      toast.add({
        title: t('error'),
        color: 'error',
        description: t(
          status === 409
            ? 'bookingStatusConflict'
            : status === 403
            ? 'bookingActionForbidden'
            : 'bookingActionFailed'
        ),
      });
    } finally {
      submitting.value = false;
    }
  };
  return {
    booking,
    submitting,
    userIsCustomer: computed(() => permissions.value.isCustomer),
    canConfirm: computed(() => permissions.value.canConfirm),
    canCancel: computed(() => permissions.value.canCancel),
    createdAtDisplay: computed(() =>
      booking.value?.createdAt
        ? new Date(booking.value.createdAt).toLocaleDateString('de-DE')
        : ''
    ),
    onConfirm: () => changeStatus('confirmed'),
    onCancel: () => changeStatus('cancelled'),
  };
};
