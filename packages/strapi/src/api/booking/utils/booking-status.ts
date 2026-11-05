import type { Core } from '@strapi/strapi';
import type { Booking, UpdateBookingRequest } from '@depot/shared';
import type {
  EmailsService,
  BookingMailActor,
} from '../../../plugins/emails/server/services/emails-service';

type RequestedStatus = UpdateBookingRequest['bookingStatus'];

export class BookingStatusError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'BookingStatusError';
  }
}

/** Checks that the request contains only a confirmation or cancellation. */
export function parseBookingStatusRequest(data: unknown): UpdateBookingRequest {
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    Object.keys(data).length !== 1 ||
    !('bookingStatus' in data) ||
    (data.bookingStatus !== 'confirmed' && data.bookingStatus !== 'cancelled')
  ) {
    throw new BookingStatusError(
      400,
      'Only bookingStatus (confirmed or cancelled) may be updated.'
    );
  }
  return { bookingStatus: data.bookingStatus };
}

export interface BookingStatusService {
  updateStatus(
    documentId: string,
    userId: number,
    data: unknown
  ): Promise<Booking>;
}

async function loadBooking(
  strapi: Core.Strapi,
  documentId: string
): Promise<Booking> {
  const booking = (await strapi.documents('api::booking.booking').findOne({
    documentId,
    populate: [
      'resource',
      'customer',
      'resourceOwner',
      'customerAddress',
      'price',
    ],
  })) as unknown as Booking | null;

  if (!booking) throw new BookingStatusError(404, 'Booking not found.');
  return booking;
}

function checkStatusPermission(
  booking: Booking,
  userId: number,
  status: RequestedStatus
): void {
  const isCustomer = Number(booking.customer?.id) === userId;
  const isOwner = Number(booking.resourceOwner?.id) === userId;

  if ((!isCustomer && !isOwner) || (status === 'confirmed' && !isOwner)) {
    throw new BookingStatusError(
      403,
      'You are not allowed to perform this booking action.'
    );
  }
  if (booking.bookingStatus === 'cancelled' && status === 'confirmed') {
    throw new BookingStatusError(
      409,
      'Cancelled bookings cannot be confirmed.'
    );
  }
}

async function sendStatusMail(
  strapi: Core.Strapi,
  booking: Booking,
  userId: number
): Promise<void> {
  try {
    const emailsPlugin = strapi.plugin('emails');
    if (!emailsPlugin) return;
    const emails = emailsPlugin.service('emailsService') as EmailsService;

    if (booking.bookingStatus === 'confirmed') {
      await emails.sendBookingConfirmedMail(booking);
      return;
    }

    const isOwner = Number(booking.resourceOwner?.id) === userId;
    const user = isOwner ? booking.resourceOwner : booking.customer;
    const actor: BookingMailActor = {
      role: isOwner ? 'resourceOwner' : 'customer',
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    };
    await emails.sendBookingCancelledMail(booking, actor);
  } catch (error) {
    strapi.log.error(
      `Booking status mail failed: booking=${booking.documentId}, type=${booking.bookingStatus}`,
      error
    );
  }
}

async function updateBookingStatus(
  strapi: Core.Strapi,
  documentId: string,
  userId: number,
  data: unknown
): Promise<Booking> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new BookingStatusError(403, 'Authentication required.');
  }

  const { bookingStatus } = parseBookingStatusRequest(data);
  const booking = await loadBooking(strapi, documentId);
  checkStatusPermission(booking, userId, bookingStatus);
  if (booking.bookingStatus === bookingStatus) return booking;

  const updatedAt = new Date().toISOString();
  // Cancellation also covers a confirmation made after the booking was read.
  const allowedStatus =
    bookingStatus === 'cancelled'
      ? { $in: ['requested', 'confirmed'] }
      : 'requested';

  // updateMany keeps the status condition in the SQL update and skips price hooks.
  const result = await strapi.db.query('api::booking.booking').updateMany({
    where: { id: booking.id, bookingStatus: allowedStatus },
    data: { bookingStatus, updatedAt },
  });

  if (result.count !== 1) {
    const currentBooking = await loadBooking(strapi, documentId);
    checkStatusPermission(currentBooking, userId, bookingStatus);
    if (currentBooking.bookingStatus === bookingStatus) return currentBooking;
    throw new BookingStatusError(
      409,
      'The booking changed concurrently. Please reload it.'
    );
  }

  const updatedBooking = { ...booking, bookingStatus, updatedAt };
  await sendStatusMail(strapi, updatedBooking, userId);
  return updatedBooking;
}

/** Creates the service for checking, saving and notifying booking status changes. */
export function createBookingStatusService(
  strapi: Core.Strapi
): BookingStatusService {
  return {
    /** Changes the booking status if the user is allowed to perform the action. */
    async updateStatus(documentId, userId, data): Promise<Booking> {
      return updateBookingStatus(strapi, documentId, userId, data);
    },
  };
}
