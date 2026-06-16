export * from './types';
export * from './requests';
export * from './functions';

// @see https://docs.strapi.io/dev-docs/backend-customization/requests-responses
export interface KoaRequest {
  body?: any;
  query?: any;
  params?: any;
  files?: any;
}

export interface Token {
  id: number;
  iat: number;
  exp: number;
}

interface Route {
  method: string;
  path: string;
  handler: string;
  config: any;
  info: any;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface StrapiUser {
  id: number;
  username: string;
  email: string;
  provider: string;
  password: string;
  resetPasswordToken: string | null;
  confirmationToken: string | null;
  confirmed: boolean;
  blocked: boolean;
  uuid: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  salutation: string | null;
  createdAt: string;
  updatedAt: string;
  role: Role;
}

interface State {
  route: Route;
  user: StrapiUser;
  isAuthenticated: boolean;
  auth: any;
}

export interface StrapiContext {
  body: any;
  request: KoaRequest;
  throw: (status: number, message: string) => void;
  state: State;
  params: any;
  query: any;
}
