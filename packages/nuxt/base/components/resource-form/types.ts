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
  price: ResourceFormPricePayload;
  categoryIds: number[];
  address: Pick<Address, 'street' | 'zip' | 'place'>;
  agreement: boolean;
  images: File[];
  geoData?: GeoData | null;
}


