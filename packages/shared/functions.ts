import { randomCirclePoint } from 'random-location';
import {
  AccessibilityState,
  Address,
  Link,
  Price,
  PriceTariffType,
  ResourceType,
  ResourceTypeComponent,
  User,
} from './types';

/**
 * Resolves the deployment feature flags shared by Strapi and Nuxt.
 *
 * Only explicit true/false and 1/0 values override the supplied default so a
 * missing or malformed environment variable cannot accidentally disable a
 * feature.
 */
export const readBooleanEnv = (
  value: string | undefined | null,
  defaultValue = false
): boolean => {
  if (value === null || typeof value === 'undefined') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true'].includes(normalized)) return true;
  if (['0', 'false'].includes(normalized)) return false;

  return defaultValue;
};

export const getUsernameFromUser = (user: Partial<User>): string =>
  user.organization
    ? user.organization.title
    : `${user.firstName} ${user.lastName}`;

export const getUsernameAbbreviationFromUser = (user: User): string =>
  getUsernameFromUser(user)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export type GeoData = {
  longitude: number;
  latitude: number;
};

interface GeocodeFeature {
  center: number[];
}

export interface GeocodeResponse {
  features: GeocodeFeature;
}

export const geocodeAddress = async (
  address: Address
): Promise<GeoData | undefined> => {
  if (
    !process.env.PUBLIC_MAPBOX_TOKEN ||
    process.env.PUBLIC_MAPBOX_TOKEN === ''
  ) {
    return;
  }

  const placeFields = [address.street, address.zip, address.place];
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${placeFields.join(
      '%20'
    )}.json?access_token=${
      process.env.PUBLIC_MAPBOX_TOKEN
    }&limit=1&autocomplete=false`
  );
  const result = (await response.json()) as GeocodeResponse;

  if (result.features && result.features[0] && result.features[0].center) {
    return {
      latitude: result.features[0].center[1],
      longitude: result.features[0].center[0],
    };
  }

  return;
};

export type ObfuscatedGeoData = {
  obfuscatedLatitude: number;
  obfuscatedLongitude: number;
};

export const obfuscateGeodata = (
  latitude: number,
  longitude: number
): ObfuscatedGeoData | undefined => {
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;

  const randomPoints = randomCirclePoint(
    { latitude, longitude },
    process.env.PUBLIC_RANDOM_LOCATION_RADIUS || 200
  );

  return {
    obfuscatedLatitude: randomPoints.latitude,
    obfuscatedLongitude: randomPoints.longitude,
  };
};

export const priceToString = (price: number): string =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);

export const getPriceByPriceTariff = (
  prices: Price[],
  tariffType: PriceTariffType
): Price | undefined => prices.find((price) => price.tariffType === tariffType);

export const getPlainRentPrice = (price: Price | null): number => {
  if (!price) {
    return 0;
  }

  return price.value - price.vatValue - price.depositValue;
};

export const getResourceType = (
  resourceTypes: ResourceType[] | null | undefined,
  componentId: ResourceTypeComponent
): ResourceType | undefined =>
  resourceTypes?.find(
    (resourceType) => resourceType.__component === componentId
  );

// Keep in sync with custom.link's URL validation in Strapi.
export const WEBSITE_URL_PATTERN =
  /^(https?:\/\/)?[-a-zA-Z0-9._]{2,256}\.[a-z]{2,6}(:[0-9]+)?([/?#][-a-zA-Z0-9@:%_+.~#?&/=]*)?$/;

export const normalizeWebsiteUrl = (value: string): string | undefined => {
  const trimmed = value.trim();

  if (!WEBSITE_URL_PATTERN.test(trimmed)) {
    return undefined;
  }

  const url =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? url
      : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Resolves the website shown on a resource detail page: the resource's own
 * link wins, the provider's profile link is the fallback. The link title
 * is used as anchor text, otherwise the plain URL.
 */
export const getResourceWebsite = (resource: {
  links?: Pick<Link, 'url' | 'title'>[] | null;
  user?: { link?: Pick<Link, 'url' | 'title'> | null } | null;
}): { url: string; label: string } | undefined => {
  for (const link of [resource.links?.[0], resource.user?.link]) {
    const url = normalizeWebsiteUrl(link?.url ?? '');

    if (url) {
      return { url, label: link?.title?.trim() || url };
    }
  }

  return undefined;
};

export const getAccessibilityText = (
  accessibilityState: AccessibilityState | undefined
): string | null => {
  switch (accessibilityState) {
    case 'accessible':
      return 'barrierefrei';
    case 'partly_accessible':
      return 'Teilweise barrierefrei';
    case 'not_accessible':
      return 'Nicht barrierefrei';
    default:
      return null;
  }
};
