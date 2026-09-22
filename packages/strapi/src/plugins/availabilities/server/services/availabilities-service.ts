import type { Core } from '@strapi/strapi';
import type {
  Resource,
  Booking,
  Availability,
  CalendarDate,
  AvailabilitiesGetCalendarResponseData,
  AvailabilitiesGetMaxAvailableResponseData,
  AvailabilitiesGetDashboardResponseData,
} from '@depot/shared';
import { eachDayOfInterval, endOfDay, startOfDay } from 'date-fns';
import flatMap from 'lodash/flatMap';
import { ParameterizedContext } from 'koa';

export interface AvailabilitiesService {
  populateTimespanFilter: (start: string, end: string) => any;
  getCalendar(
    ctx: ParameterizedContext,
    start: Date,
    end: Date,
    resourceDocumentId: string
  ): Promise<AvailabilitiesGetCalendarResponseData | undefined>;
  getMaxAvailable(
    ctx: ParameterizedContext,
    start: Date,
    end: Date,
    resourceDocumentId: string,
    excludeBookingId?: undefined | number
  ): Promise<AvailabilitiesGetMaxAvailableResponseData>;
  searchResourceWithAvailabilities(
    start: Date,
    end: Date,
    resourceDocumentId: string
  ): Promise<Resource | null>;
  searchBookingsWithAvailabilities(
    start: Date,
    end: Date,
    resourceDocumentId: string
  ): Promise<Booking[]>;
  calcMaxAvailableWithinTimespan(
    start: Date,
    end: Date,
    availabilities: Availability[],
    defaultAvailableUnits?: number
  ): number;
  getDashboardByUserId(userId: number): Promise<any>; // Promise<AvailabilitiesGetDashboardResponseData>;
}

const isAtOrBefore = (left: Date, right: Date): boolean =>
  left.getTime() <= right.getTime();

const overlapsTimespan = (
  availability: Availability,
  start: Date,
  end: Date
): boolean => {
  const availabilityStart = new Date(availability.start);

  if (!isAtOrBefore(availabilityStart, end)) {
    return false;
  }

  if (availability.end === null) {
    return true;
  }

  return isAtOrBefore(start, new Date(availability.end));
};

const isDefaultAvailabilityCoveringStart = (
  availability: Availability,
  start: Date
): boolean =>
  availability.end === null &&
  isAtOrBefore(new Date(availability.start), start);

export default ({
  strapi,
}: {
  strapi: Core.Strapi;
}): AvailabilitiesService => ({
  populateTimespanFilter: (start, end) => ({
    $or: [
      {
        $and: [
          // 1. Booking starts before $start and ends after $end
          {
            start: { $lte: start },
          },
          {
            end: { $gte: end },
          },
        ],
      },
      {
        // 2. Booking starts before $start, ends after $start and ends before $end
        $and: [
          {
            start: { $lte: start },
          },
          {
            end: { $gte: start },
          },
          {
            end: { $lte: end },
          },
        ],
      },
      {
        // 3. Booking starts after $start, starts before $end and ends after $end
        $and: [
          {
            start: { $gte: start },
          },
          {
            start: { $lte: end },
          },
          {
            end: { $gte: end },
          },
        ],
      },
      {
        // 4. Booking starts after $start and ends before $end
        $and: [
          {
            start: { $gte: start },
          },
          {
            end: { $lte: end },
          },
        ],
      },
      {
        // 5. A permanent default starts before the requested period ends.
        $and: [
          {
            start: { $lte: end },
          },
          {
            end: { $null: true },
          },
        ],
      },
    ],
  }),

  async getDashboardByUserId(userId) {
    const resourceFields = ['documentId', 'title'];

    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: {
          id: userId.toString(),
        },
        // @todo check after strapi 5 migration
        // populate: [
        //   'resources.id',
        //   'resources.title',
        //   'resources.availabilities',
        //   'bookingsResourceOwner.resource.id',
        //   'bookingsResourceOwner.resource.title',
        //   'bookingsCustomer.resource.id',
        //   'bookingsCustomer.resource.title',
        // ],
        populate: {
          resources: {
            fields: resourceFields,
            populate: {
              availabilities: true,
            },
          },
          bookingsResourceOwner: {
            populate: {
              resource: {
                fields: resourceFields,
              },
            },
          },
          bookingsCustomer: {
            populate: {
              resource: {
                fields: resourceFields,
              },
            },
          },
        },
      });

    // @todo expects return type Availability[]
    const availabilities = flatMap(user.resources, (resource) =>
      resource.availabilities.map((availability) => ({
        ...availability,
        resource: {
          documentId: resource.documentId,
          title: resource.title,
        },
      }))
    );

    return {
      availabilities,
      bookingsResourceOwner: user.bookingsResourceOwner,
      bookingsCustomer: user.bookingsCustomer,
    };
  },

  /**
   * Returns a list with each day from start to end with
   * a total number on (non-)bookable units for easy display in calendar.
   * @todo Loads to optimise, as each day is requested individually
   */
  async getCalendar(ctx, start, end, resourceDocumentId) {
    const resource = await (
      this as AvailabilitiesService
    ).searchResourceWithAvailabilities(start, end, resourceDocumentId);

    if (!resource) {
      ctx.throw(404, 'Resource not found');
      return;
    }

    const interval = eachDayOfInterval({ start, end }) || [];
    const dates: CalendarDate[] = await Promise.all(
      interval.map(async (date) => {
        let dateStart = startOfDay(date);
        let dateEnd = endOfDay(date);
        // Remove local specific time offset from the generated interval date
        dateStart = new Date(
          dateStart.getTime() - dateStart.getTimezoneOffset() * 60000
        );
        dateEnd = new Date(
          dateEnd.getTime() - dateEnd.getTimezoneOffset() * 60000
        );

        return {
          day: dateStart.toISOString().split('T')[0],
          //  availableUnits: (this as AvailabilitiesService).findMaxAvailableWithinTimespan(startOfDay(date), endOfDay(date), availabilities, defaultAvailableUnits),
          availableUnits:
            (await (this as AvailabilitiesService).getMaxAvailable(
              ctx,
              dateStart,
              dateEnd,
              resourceDocumentId
            )) || 0,
        };
      })
    );

    return {
      resource: {
        documentId: resource.documentId,
      },
      dates,
    } as AvailabilitiesGetCalendarResponseData;
  },

  calcMaxAvailableWithinTimespan(
    start,
    end,
    availabilities,
    defaultAvailableUnits = 0
  ) {
    return availabilities.reduce((lowestAvailableUnits, availability) => {
      if (!overlapsTimespan(availability, start, end)) {
        return lowestAvailableUnits;
      }

      return Math.min(lowestAvailableUnits, availability.availableUnits);
    }, defaultAvailableUnits);
  },

  async getMaxAvailable(
    ctx,
    start,
    end,
    resourceDocumentId,
    excludeBookingId = undefined
  ) {
    const resource = await (
      this as AvailabilitiesService
    ).searchResourceWithAvailabilities(start, end, resourceDocumentId);

    if (!resource) {
      // @todo To make this more agnostic, we should return
      // a simple error message instead of throwing an error
      ctx.throw(404, 'Resource not found');
      return;
    }

    const availabilities = resource.availabilities ?? [];
    const defaultAvailability = availabilities.find((availability) =>
      isDefaultAvailabilityCoveringStart(availability, start)
    );

    if (!defaultAvailability) {
      return 0;
    }

    let maxAvailableUnits = (
      this as AvailabilitiesService
    ).calcMaxAvailableWithinTimespan(
      start,
      end,
      availabilities,
      defaultAvailability.availableUnits
    );

    if (maxAvailableUnits === 0) {
      return 0;
    }

    let bookings = await (
      this as AvailabilitiesService
    ).searchBookingsWithAvailabilities(start, end, resourceDocumentId);

    if (bookings) {
      if (excludeBookingId) {
        // If currently editing a booking, exclude it from the list of bookings
        bookings = bookings.filter(
          (booking) => booking.id !== excludeBookingId
        );
      }
      const unitsBooked: number = bookings.reduce(
        (_unitsBooked, booking) => _unitsBooked + booking.bookedUnits,
        0
      );
      maxAvailableUnits -= unitsBooked;
    }

    return maxAvailableUnits;
  },

  async searchResourceWithAvailabilities(start, end, resourceDocumentId) {
    const resource = (await strapi.documents('api::resource.resource').findOne({
      fields: ['documentId', 'title'],
      documentId: resourceDocumentId,
      populate: {
        availabilities: {
          filters: (this as AvailabilitiesService).populateTimespanFilter(
            start.toISOString(),
            end.toISOString()
          ),
        },
      },
    })) as unknown as Resource;

    return resource ?? null;
  },

  async searchBookingsWithAvailabilities(start, end, resourceDocumentId) {
    const bookings = (await strapi.documents('api::booking.booking').findMany({
      fields: ['id', 'bookingStatus', 'bookedUnits'],
      filters: {
        resource: {
          documentId: resourceDocumentId,
        },
        bookingStatus: {
          $ne: 'cancelled',
        },
        ...(this as AvailabilitiesService).populateTimespanFilter(
          start.toISOString(),
          end.toISOString()
        ),
      },
    })) as Booking[];

    return bookings;
  },
});
