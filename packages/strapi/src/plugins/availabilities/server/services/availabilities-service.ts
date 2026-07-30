import type { Core } from '@strapi/strapi';
import type {
  Resource,
  Booking,
  Availability,
  CalendarDate,
  AvailabilitiesGetCalendarResponseData,
  AvailabilitiesGetMaxAvailableResponseData,
  AvailabilitiesGetDashboardResponseData,
  ContingentResourceType,
} from '@depot/shared';
import { getResourceType, ResourceTypeComponent } from '@depot/shared';
import {
  isBefore,
  isAfter,
  eachDayOfInterval,
  endOfDay,
  startOfDay,
} from 'date-fns';
import flatMap from 'lodash/flatMap';
import { ParameterizedContext } from 'koa';

export interface AvailabilitiesService {
  populateTimespanFilter: (start: string, end: string) => any;
  getCalendar(
    ctx: ParameterizedContext,
    start: Date,
    end: Date,
    resourceId: string | number
  ): Promise<AvailabilitiesGetCalendarResponseData | undefined>;
  getMaxAvailable(
    ctx: ParameterizedContext,
    start: Date,
    end: Date,
    resourceId: string | number,
    excludeBookingId?: undefined | number
  ): Promise<AvailabilitiesGetMaxAvailableResponseData>;
  searchResourceWithAvailabilities(
    start: Date,
    end: Date,
    resourceId: string | number
  ): Promise<Resource | null>;
  searchBookingsWithAvailabilities(
    start: Date,
    end: Date,
    resourceId: string | number
  ): Promise<Booking[]>;
  calcMaxAvailableWithinTimespan(
    start: Date,
    end: Date,
    availabilities: Availability[],
    defaultAvailableUnits?: number
  ): number;
  getDashboardByUserId(userId: number): Promise<any>; // Promise<AvailabilitiesGetDashboardResponseData>;
}

const getSmallestMaxAvailableUnit = (
  availabilitiesCoveringTimespan: Availability[],
  maxAvailableUnits: number
): number =>
  availabilitiesCoveringTimespan.reduce(
    (maxAvailableUnitsInTimespan: number, availability) =>
      availability.availableUnits > maxAvailableUnitsInTimespan
        ? availability.availableUnits
        : maxAvailableUnitsInTimespan,
    maxAvailableUnits
  );

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
    ],
  }),

  async getDashboardByUserId(userId) {
    const resourceFields = ['id', 'title'];

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
          id: resource.id,
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
  async getCalendar(ctx, start, end, resourceId) {
    const resource = await (
      this as AvailabilitiesService
    ).searchResourceWithAvailabilities(start, end, resourceId);

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
              resourceId
            )) || 0,
        };
      })
    );

    return {
      resource: {
        id: resource.id,
      },
      dates,
    } as AvailabilitiesGetCalendarResponseData;
  },

  /**
   * @todo In some occasions, the max available may not be as desired; e.g. when availability
   * ends at that day.
   */
  calcMaxAvailableWithinTimespan(
    start,
    end,
    availabilities,
    defaultAvailableUnits = 0
  ) {
    // Filter availabilities covering (at least) the whole timespan to set new max value (if higher than currently)
    const availabilitiesCoveringTimespan = availabilities.filter(
      (availability) => {
        // What for did we need this?
        // if (availability.availableUnits < defaultAvailableUnits) {
        //   return false
        // }

        const avStartDate = new Date(availability.start);
        const avEndDate = new Date(availability.end);

        return isBefore(avStartDate, start) && isAfter(avEndDate, end);
      }
    );

    // Use remaining availabilities to find the lowest available units
    const availabilitiesWithinTimespan = availabilities.filter(
      (availability) => !availabilitiesCoveringTimespan.includes(availability)
    );

    // Find lowest of the highest available units covering whole timespan
    let maxAvailableUnits = getSmallestMaxAvailableUnit(
      availabilitiesCoveringTimespan,
      availabilitiesCoveringTimespan[0]
        ? availabilitiesCoveringTimespan[0].availableUnits
        : defaultAvailableUnits
    );

    // Find lowest of the remaining availabilities
    maxAvailableUnits = getSmallestMaxAvailableUnit(
      availabilitiesWithinTimespan,
      maxAvailableUnits
    );

    return maxAvailableUnits;
  },

  async getMaxAvailable(
    ctx,
    start,
    end,
    resourceId,
    excludeBookingId = undefined
  ) {
    const resource = await (
      this as AvailabilitiesService
    ).searchResourceWithAvailabilities(start, end, resourceId);

    if (!resource) {
      // @todo To make this more agnostic, we should return
      // a simple error message instead of throwing an error
      ctx.throw(404, 'Resource not found');
      return;
    }

    const { availabilities, resourceTypes } = resource;

    const contingentResourceType = getResourceType(
      resourceTypes,
      ResourceTypeComponent.CONTINGENT_RESOURCE_TYPE
    ) as ContingentResourceType;

    if (!contingentResourceType) {
      ctx.throw(404, 'Contingent resource type not found');
      return;
    }

    const defaultAvailableUnits = contingentResourceType
      ? contingentResourceType.availableUnits
      : 0;
    const minBookableUnits = contingentResourceType
      ? contingentResourceType.minBookableUnits
      : 0;

    let maxAvailableUnits = defaultAvailableUnits;

    if (availabilities) {
      maxAvailableUnits = (
        this as AvailabilitiesService
      ).calcMaxAvailableWithinTimespan(
        start,
        end,
        availabilities,
        defaultAvailableUnits
      );
    }

    if (maxAvailableUnits === 0) {
      return 0;
    }

    let bookings = await (
      this as AvailabilitiesService
    ).searchBookingsWithAvailabilities(start, end, resourceId);

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

  async searchResourceWithAvailabilities(start, end, resourceId) {
    const resource = await strapi.documents('api::resource.resource').findOne({
      fields: ['id', 'title'],
      documentId: resourceId.toString(),
      populate: {
        availabilities: {
          filters: (this as AvailabilitiesService).populateTimespanFilter(
            start.toISOString(),
            end.toISOString()
          ),
        },
        resourceTypes: {
          on: {
            'resource-types.contingent-resource-type': {
              fields: ['availableUnits', 'minBookableUnits'],
            },
          },
        },
      },
    }) as unknown as Resource;

    return resource ?? null;
  },

  async searchBookingsWithAvailabilities(start, end, resourceId) {
    const bookings = (await strapi.documents('api::booking.booking').findMany({
      fields: ['id', 'bookingStatus', 'bookedUnits'],
      filters: {
        resource: {
          id: resourceId,
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
