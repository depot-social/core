import type { Address, GeoData } from '@depot/shared';
import { geocodeAddress } from '@depot/shared';

interface GeocodeBody {
  street?: string;
  zip?: string;
  place?: string;
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as GeocodeBody;

  if (!body?.street || !body?.zip || !body?.place) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing address fields',
    });
  }

  const config = useRuntimeConfig(event);

  if (!process.env.PUBLIC_MAPBOX_TOKEN && config.public.mapboxToken) {
    process.env.PUBLIC_MAPBOX_TOKEN = config.public.mapboxToken;
  }

  const address: Address = {
    street: body.street,
    zip: body.zip,
    place: body.place,
  };

  const geodata = (await geocodeAddress(address)) as GeoData | undefined;

  if (!geodata) {
    setResponseStatus(event, 204);
    return null;
  }

  return geodata;
});

