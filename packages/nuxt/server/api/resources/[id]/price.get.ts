import type { Price } from '@depot/shared';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  const query = getQuery(event);
  const { start, end, units } = query;

  if (
    typeof id !== 'string' ||
    typeof start !== 'string' ||
    typeof end !== 'string' ||
    typeof units !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required price query parameters',
    });
  }

  const config = useRuntimeConfig(event);
  const { strapi_jwt } = parseCookies(event);

  return await $fetch<Price>(`${config.strapi.url}/api/resources/${id}/price`, {
    query: {
      start,
      end,
      units,
    },
    headers: strapi_jwt
      ? {
          Authorization: `Bearer ${strapi_jwt}`,
        }
      : undefined,
  });
});
