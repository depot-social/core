import type { AvailabilitiesGetMaxAvailableResponse } from '@depot/shared';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { start, end, resource_id, exclude_booking_id } = query;

  if (
    typeof start !== 'string' ||
    typeof end !== 'string' ||
    typeof resource_id !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required availability query parameters',
    });
  }

  const config = useRuntimeConfig(event);

  return await $fetch<AvailabilitiesGetMaxAvailableResponse>(
    `${config.strapi.url}/api/plugin-availabilities/max-available`,
    {
      query: {
        start,
        end,
        resource_id,
        ...(typeof exclude_booking_id === 'string'
          ? { exclude_booking_id }
          : {}),
      },
    }
  );
});
