import { randomCirclePoint } from 'random-location';
import {
  AccessibilityState,
  Address,
  BerlinBookingIntend,
  Price,
  PriceTariffType,
  ResourceType,
  ResourceTypeComponent,
  User,
} from './types';

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
  resourceTypes: ResourceType[],
  componentId: ResourceTypeComponent
): ResourceType | undefined =>
  resourceTypes.find(
    (resourceType) => resourceType.__component === componentId
  );

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

export const getBerlinBookingIntend = (intend: BerlinBookingIntend): string => {
  switch (intend) {
    case BerlinBookingIntend.LEARNING_TOGETHER:
      return 'Zusammen lernen';
    case BerlinBookingIntend.COMMUNITY_COOKING:
      return 'Gemeinsames Kochen';
    case BerlinBookingIntend.MOVE:
      return 'Bewegung';
    case BerlinBookingIntend.OPEN_EVENT:
      return 'Offene Veranstaltung';
    case BerlinBookingIntend.QUIET_MEETING:
      return 'Ruhiges Treffen';
    case BerlinBookingIntend.MUSIC_AND_SINGING:
      return 'Singen und Musik spielen';
    default:
      return '';
  }
};
