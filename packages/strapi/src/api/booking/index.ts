import type { Core } from '@strapi/strapi';
import { Booking, Price } from '@depot/shared';
import { ConversationsService } from '../../plugins/conversations/server/services/conversations-service';
import { PricesService } from '../../plugins/prices/server/services/prices-service';
import { EmailsService } from '../../plugins/emails/server/services/emails-service';
import { getRelationDocumentId, isAdminOrBackofficeRequest } from '../../utils';
import { AvailabilitiesService } from '../../plugins/availabilities/server/services/availabilities-service';

const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) {
    return '';
  }

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const populateBookingTitleFromResourceAndDates = async (
  strapi: Core.Strapi,
  bookingDocumentId: string,
): Promise<void> => {
  if (!bookingDocumentId) {
    return;
  }

  const booking = (await strapi
    .documents('api::booking.booking')
    .findOne({
      documentId: bookingDocumentId,
      fields: ['id', 'start', 'end'],
      populate: {
        resource: {
          fields: ['id', 'title'],
        },
      },
    })) as any;

  const startStr = formatDateTime(booking.start);
  const endStr = formatDateTime(booking.end);
  const resourceTitle = booking.resource?.title;

  if (!startStr || !endStr || !resourceTitle) {
    return;
  }

  const title = `${resourceTitle}-${startStr}-${endStr}`;

  await strapi.documents('api::booking.booking').update({
    documentId: bookingDocumentId,
    data: { title },
  } as any);
};

/**
 * Helper to upsert the booking price component, working around lifecycle limitations.
 */
const saveBookingPrice = async (
  strapi: Core.Strapi,
  bookingDocumentId: string,
  price: Price,
): Promise<void> => {
  if (!bookingDocumentId || !price) {
    return;
  }

  await strapi.documents('api::booking.booking').update({
    documentId: bookingDocumentId,
    data: {
      price: price,
    },
  });
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   *
   * Note that many types on "Strapi" are not complete, so we gotta use "any" to avoid
   * type errors. This is hopefully resolved in one of the upcoming releases.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    let bookingUpdateInProgress = false;

    const validateBooking = async (event: any, isUpdate = false) => {
      const { params } = event;
      const { data, where } = params;
      const ctx = strapi.requestContext.get();

      // @todo update of bookings should(!) only be allowed via Strapi UI,
      // except for start, end and status fields. Once that logic is implemented,
      // continue here:

      // if (isUpdate && where) {
      //   const existingBooking = await strapi.db
      //     .query('api::booking.booking')
      //     .findOne({
      //       where,
      //       populate: ['resource'],
      //     });

      //   if (existingBooking) {
      //     bookingData = {
      //       ...existingBooking,
      //       ...data,
      //       resource: data.resource !== undefined ? data.resource : existingBooking.resource,
      //     };
      //   }
      // }

      const { start, end, resource, bookedUnits } = data;

      if (!start || !end || !resource || !bookedUnits || isNaN(bookedUnits) || bookedUnits <= 0) {
        ctx.throw(400, 'Fields start, end, resource, and bookedUnits must be set.');
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (endDate <= startDate) {
        ctx.throw(400, 'End date must be larger than start date.');
      }

      return;

      // @todo the rest of the validation doesn't work in context
      // of content-type api (resource id vs. documentid mismatch)

      const resourceDocumentId = getRelationDocumentId(resource);

      if (!resourceDocumentId) {
        ctx.throw(400, 'Invalid resource document ID.');
      }

      const availabilitiesService: AvailabilitiesService = await strapi
        .plugin('plugin-availabilities')
        .service('availabilitiesService');

      let excludeBookingId: number | undefined;

      if (isUpdate) {
        if (where?.id) {
          excludeBookingId = Number(where.id);
        } else if (data.id) {
          excludeBookingId = Number(data.id);
        }
      }

      const maxAvailableUnits = await availabilitiesService.getMaxAvailable(
        ctx,
        startDate,
        endDate,
        resourceDocumentId,
        excludeBookingId
      );

      if (typeof maxAvailableUnits === 'number' && bookedUnits > maxAvailableUnits) {
        ctx.throw(400, `Requested booked units are not available. Available: ${maxAvailableUnits}`);
      }

      // Automatically assign the resource owner
      const fullResource = await strapi.documents('api::resource.resource').findOne({
        documentId: resourceDocumentId,
        populate: ['user'],
      });

      if (!fullResource?.user?.id) {
        ctx.throw(400, 'Resource has no owner.');
      }

      event.params.data.resourceOwner = fullResource.user.id;

      if (isAdminOrBackofficeRequest(ctx)) {
        return;
      }

      // Automatically assign the customer
      if (ctx?.state?.user?.id) {
        event.params.data.customer = ctx.state.user.id;
      }
    };

    const beforeCreateBooking = async (event: any) => {
      await validateBooking(event, false);
    };

    const beforeUpdateBooking = async (event: any) => {
      await validateBooking(event, true);
    };

    const setBookingPrice = async (event: any) => {
      // Before creating or updating a booking, calculate and add/update its price
      // For doing so, we assume that the input params were already validated by the
      // booking policies
      const { result } = event;
      const { documentId, start, end, bookedUnits } = result as Booking;

      const ctx = strapi.requestContext.get();
      if (false && isAdminOrBackofficeRequest(ctx)) {
        // e.g. when called from import-csv or Strapi UI
        return;
      }

      if (!start || !end || !bookedUnits) {
        console.warn(
          'setBookingPrice hook: Incomplete booking data',
          result,
        );

        return;
      }

      const resolvedResource = (await strapi
        .documents('api::booking.booking')
        .findOne({
          documentId,
          populate: {
            resource: {
              fields: ['documentId'],
            },
          },
        })) as any;

      const resourceDocumentId = resolvedResource?.resource?.documentId;

      if (!resourceDocumentId) {
        console.warn(
          'setBookingPrice: No resource document ID found',
          result,
        );
        return;
      }

      const loggedInUserDatabaseId = ctx.state?.user?.id;

      if (!loggedInUserDatabaseId) {
        console.warn(
          'setBookingPrice: No logged in user. Probably called from within backend.'
        );
        return;
      }

      const pricesService: PricesService = await strapi
        .plugin('prices')
        .service('pricesService');

      const price = await pricesService.getPrice(
        resourceDocumentId,
        new Date(start),
        new Date(end),
        bookedUnits,
        loggedInUserDatabaseId
      );

      if (!price) {
        console.warn(
          'setBookingPrice: Failed to get price',
        );
        return;
      }

      await saveBookingPrice(strapi, documentId, price);
    }

    const addBookingMessage = async (event: any) => {
      const conversationsService: ConversationsService = await strapi
        .plugin('conversations')
        .service('conversationsService');

      await conversationsService.addBookingMessage(event.result);
    };

    /**
     * After updating a booking:
     * - (Re-calculate) and save booking price
     * - (@todo apply further actions as necessary)
     */
    const afterUpdateBooking = async (ev: any) => {
      if (bookingUpdateInProgress) {
        return;
      }

      bookingUpdateInProgress = true;
      await setBookingPrice(ev);
      bookingUpdateInProgress = false;
    };

    /**
     * After creating a booking:
     * - Add conversation/message to user chats
     * - Calculate and save booking price
     * - Populate booking title from resource and dates
     * - Send notification email to resource owner
     */
    const afterCreateBooking = async (event: any) => {
      if (bookingUpdateInProgress) {
        return;
      }

      const { result } = event;
      const { documentId } = result as Booking;

      if (!documentId) {
        return 'Error in afterCreateBooking: Unknown booking document ID';
      }

      bookingUpdateInProgress = true;
      await addBookingMessage(event);
      await setBookingPrice(event);
      await populateBookingTitleFromResourceAndDates(strapi, documentId);
      bookingUpdateInProgress = false;

      const ctx = strapi.requestContext.get();

      if (!ctx) {
        // e.g. when called from import-csv
        return;
      }

      if (isAdminOrBackofficeRequest(ctx)) {
        return;
      }

      const emailsPlugin = strapi.plugin('emails');

      if (!emailsPlugin) {
        return;
      }

      const emailsService: EmailsService = await emailsPlugin.service(
        'emailsService'
      );

      emailsService.sendBookingRequestMail(documentId);
    };

    strapi.db.lifecycles.subscribe({
      models: ['api::booking.booking'],
      beforeCreate: beforeCreateBooking,
      beforeUpdate: beforeUpdateBooking,
      afterUpdate: afterUpdateBooking,
      afterCreate: afterCreateBooking,
    } as any);
  },
};
