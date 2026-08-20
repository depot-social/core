import type { Address, GeoData } from '@depot/shared';

export interface ResourceFormPricePayload {
  currency: 'euro';
  durationType: 'daily' | 'hourly';
  vatValue: number;
  depositValue: number | null;
  discountedValue: number;
  regularValue: number | null;
}

export interface ResourceFormSubmitPayload {
  title: string;
  description: string;
  districtId: number;
  price: ResourceFormPricePayload;
  categoryIds: number[];
  address: Pick<Address, 'street' | 'zip' | 'place'>;
  agreement: boolean;
  images: number[];
  geoData?: GeoData | null;
}
