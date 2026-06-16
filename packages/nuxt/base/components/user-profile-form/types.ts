export type UserSalutation = 'mrs' | 'mr' | 'na';

export interface UserProfileAddressPayload {
  street?: string;
  zip?: string;
  place?: string;
}

export interface UserProfileFormSubmitPayload {
  email: string;
  firstName: string;
  lastName: string;
  salutation?: UserSalutation;
  phone?: string;
  address: UserProfileAddressPayload;
  password?: string;
}

export interface UserProfileFormInitialData {
  email?: string;
  firstName?: string;
  lastName?: string;
  salutation?: UserSalutation;
  phone?: string;
  address?: UserProfileAddressPayload;
}
