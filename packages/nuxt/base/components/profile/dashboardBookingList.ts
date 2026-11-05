import type {
  AvailabilitiesGetDashboardResponseData,
  Booking,
  User,
} from '@depot/shared';

export type BookingFilter = 'all' | 'past' | 'upcoming';

export type BookingListItem = Booking & { isOwn: boolean };

export const getBookingList = (
  dashboard: AvailabilitiesGetDashboardResponseData,
  filter: BookingFilter
): BookingListItem[] => {
  const now = Date.now();

  return [
    ...dashboard.bookingsCustomer.map((b) => ({ ...b, isOwn: true })),
    ...dashboard.bookingsResourceOwner.map((b) => ({ ...b, isOwn: false })),
  ]
    .filter((booking) => {
      if (filter === 'all') return true;
      const isPast = new Date(booking.end).getTime() < now;
      return filter === 'past' ? isPast : !isPast;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

export const getUserName = (user?: User) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ');
