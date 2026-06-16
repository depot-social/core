import type { AvailabilitiesGetMaxAvailableResponse } from '@depot/shared';

interface FetchMaxAvailableUnitsParams {
  start: string;
  end: string;
  resourceId: string;
  excludeBookingId?: string | number;
}

export const fetchMaxAvailableUnits = async ({
  start,
  end,
  resourceId,
  excludeBookingId,
}: FetchMaxAvailableUnitsParams): Promise<number> => {
  const response = await $fetch<AvailabilitiesGetMaxAvailableResponse>(
    '/api/availabilities/max-available',
    {
      query: {
        start,
        end,
        resource_id: resourceId,
        ...(excludeBookingId !== undefined
          ? { exclude_booking_id: excludeBookingId.toString() }
          : {}),
      },
    }
  );

  return typeof response?.data === 'number' ? response.data : 0;
};
