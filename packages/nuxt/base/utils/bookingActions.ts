import type { BookingStatus } from '@depot/shared';

export interface BookingPermissions {
  isCustomer: boolean;
  isOwner: boolean;
  canConfirm: boolean;
  canCancel: boolean;
}

/** Returns the current user's role and available booking actions. */
export const getBookingPermissions = (
  booking:
    | {
        bookingStatus: BookingStatus;
        customer?: { id: number };
        resourceOwner?: { id: number };
      }
    | null
    | undefined,
  userId?: number
): BookingPermissions => {
  const isCustomer = !!userId && Number(booking?.customer?.id) === userId;
  const isOwner = !!userId && Number(booking?.resourceOwner?.id) === userId;
  return {
    isCustomer,
    isOwner,
    canConfirm: isOwner && booking?.bookingStatus === 'requested',
    canCancel:
      (isCustomer || isOwner) &&
      (booking?.bookingStatus === 'requested' ||
        booking?.bookingStatus === 'confirmed'),
  };
};
