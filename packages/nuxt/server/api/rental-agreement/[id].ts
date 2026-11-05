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

  // Preserve the PDF stream, download headers and upstream error responses.
  return sendProxy(
    event,
    `${config.strapi.url}/api/bookings/${id}/rental-agreement`,
    {
      headers: {
        Authorization: `Bearer ${strapi_jwt}`,
      },
    }
  );
});
