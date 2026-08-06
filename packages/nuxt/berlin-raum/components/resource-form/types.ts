import type { AccessibilityState, Address, GeoData } from '@depot/shared';

export interface ResourceFormSubmitPayload {
  title: string;
  purposesIds: number[];
  districtId: number;
  address: Pick<Address, 'street' | 'zip' | 'place'>;
  agreement: boolean;
  images: number[];
  geoData?: GeoData | null;
  // BERLIN_RESOURCE_TYPE fields
  provider: string;
  roomName: string;
  accessibilityInfo: string;
  accessibilityState: AccessibilityState;
  maxCapacity: string;
  roomSizeSqm: number;
  facilities: string;
  facilitiesAdditionalInfo?: string;
  usageHours: string;
  usageFeeDetails?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}
