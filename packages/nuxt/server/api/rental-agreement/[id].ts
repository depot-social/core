/**
 * Proxy for rental-agreement PDF download
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const cookies = parseCookies(event);
  const { strapi_jwt } = cookies;

  if (!strapi_jwt) {
    setResponseStatus(event, 401);
    return { message: 'Unauthorized' };
  }

  const id = event.context.params?.id;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing booking id' });
  }

  // Forward response buffer to client
  return $fetch(`${config.strapi.url}/api/bookings/${id}/rental-agreement`, {
    headers: {
      Authorization: `Bearer ${strapi_jwt}`,
    },
  });
});
