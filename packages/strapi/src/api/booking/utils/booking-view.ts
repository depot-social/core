import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  pickFields,
  projectBookingParty,
  type Booking,
  type BookingView,
} from '@depot/shared';
import { bookingResponseSchema } from './booking-response-schema';

const partyFields = [
  'id',
  'firstName',
  'lastName',
  'email',
  'organizationName',
];

/** Only authorized single-booking responses may include these user projections. */
export const loadBookingView = async (
  strapi: Core.Strapi,
  documentId: string,
  userId: number,
  sanitize: (booking: Booking) => Promise<unknown>
): Promise<BookingView> => {
  if (!Number.isInteger(userId) || userId <= 0)
    throw new errors.ForbiddenError('Authentication required.');
  const booking: Booking | null = await strapi.db
    .query('api::booking.booking')
    .findOne({
      where: { documentId },
      populate: {
        customer: { select: partyFields },
        resourceOwner: { select: partyFields },
        resource: {
          // Query Engine populates do not inherit Document Service publication
          // filters, and the booking can link both draft and published rows.
          where: { publishedAt: { $notNull: true } },
          populate: { images: true, prices: true, address: true },
        },
        customerAddress: true,
        price: true,
      },
    });
  if (!booking) throw new errors.NotFoundError('Booking not found.');
  if (
    Number(booking.customer?.id) !== userId &&
    Number(booking.resourceOwner?.id) !== userId
  ) {
    throw new errors.ForbiddenError(
      'User is not authorized to access this booking.'
    );
  }
  if (!booking.customer || !booking.resourceOwner || !booking.resource) {
    throw new errors.ValidationError('Booking relations are incomplete.');
  }
  // Keep Strapi sanitization for the booking and resource. General user.find may
  // remove the relations; attach only the authorized, explicitly picked parties.
  const parsed = bookingResponseSchema.safeParse(await sanitize(booking));
  if (!parsed.success)
    throw new errors.ApplicationError('Invalid sanitized booking response.');
  const sanitized = parsed.data;
  const projectPrice = (price: NonNullable<typeof sanitized.price>) => ({
    ...price,
    title: price.title,
    duration: price.duration,
    resourceValue: price.resourceValue,
    depositValue: price.depositValue,
    vatValue: price.vatValue,
  });
  return {
    ...pickFields(sanitized, [
      'id',
      'documentId',
      'createdAt',
      'updatedAt',
      'start',
      'end',
      'bookingStatus',
      'bookedUnits',
      'title',
      'commentCustomer',
    ]),
    title: sanitized.title,
    commentCustomer: sanitized.commentCustomer,
    createdAt: sanitized.createdAt,
    updatedAt: sanitized.updatedAt,
    start: sanitized.start,
    end: sanitized.end,
    resource: sanitized.resource
      ? {
          ...sanitized.resource,
          createdAt: sanitized.resource.createdAt,
          updatedAt: sanitized.resource.updatedAt,
          description: sanitized.resource.description,
          address: sanitized.resource.address
            ? {
                ...sanitized.resource.address,
                street: sanitized.resource.address.street,
                zip: sanitized.resource.address.zip,
                place: sanitized.resource.address.place,
              }
            : null,
          prices: sanitized.resource.prices.map(projectPrice),
          categories: [],
          purposes: [],
          district: null,
          links: [],
          resourceTypes: [],
        }
      : null,
    customerAddress: sanitized.customerAddress
      ? {
          street: sanitized.customerAddress.street,
          zip: sanitized.customerAddress.zip,
          place: sanitized.customerAddress.place,
        }
      : null,
    price: sanitized.price ? projectPrice(sanitized.price) : null,
    customer: projectBookingParty(booking.customer),
    resourceOwner: projectBookingParty(booking.resourceOwner),
  };
};
