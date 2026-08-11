/// <reference lib="dom" />
import type {
  AvailabilitiesGetCalendarResponse,
  AvailabilitiesGetCalendarResponseData,
  AvailabilitiesGetDashboardResponseData,
  AvailabilitiesGetMaxAvailableResponse,
  Availability,
  Booking,
  BookingRequest,
  Category,
  FAQ,
  FetchMaxAvailableUnitsRequest,
  FetchResourcePriceRequest,
  Price,
  Resource,
  SingleTypeHomepage,
  SingleTypeResourcesSearchPage,
  StrapiLoginResponse,
  StrapiResponse,
  User,
} from './';
import { format } from 'date-fns';
import { union } from 'lodash-es';

type ErrorFormState<T> = {
  error: true;
  message: string;
  inputErrors?: T;
};

export interface BaseAPIProps {
  baseUrl: string;
  jwt?: string;
}

export interface FilterOption {
  operator: string;
  value: any;
  join?: '$or' | '$and';
}

export interface Pagination {
  page?: number;
  pageSize?: number;
}

export interface Filters {
  [key: string]: FilterOption;
}

export interface Parameters {
  populate?: string[];
  fields?: string[];
  filters?: Filters | null;
  pagination?: Pagination | null;
  sort?: string[];
}

export interface APIProps<T = undefined> extends BaseAPIProps {
  body?: T;
  parameters?: Parameters;
  signal?: AbortSignal;
}

export const getPagination = (params: Parameters): any => [
  ...(params?.pagination?.page
    ? [`pagination[page]=${params.pagination.page}`]
    : []),
  ...(params?.pagination?.pageSize
    ? [`pagination[pageSize]=${params.pagination.pageSize}`]
    : []),
];

export const getPopulates = (params: Parameters): string[] =>
  params.populate
    ? params.populate.map((populate, i) => `populate[${i}]=${populate}`)
    : [];

export const getFields = (params: Parameters): string[] =>
  params.fields ? params.fields.map((field, i) => `fields[${i}]=${field}`) : [];

export const getSort = (params: Parameters): string[] =>
  params.sort ? params.sort.map((sort, i) => `sort[${i}]=${sort}`) : [];

export const getFilters = (params: Parameters): string[] => {
  let $and = 0;
  let $or = 0;

  return params.filters
    ? Object.keys(params.filters)
        .filter((filterKey) => params.filters[filterKey])
        .map(
          (filterKey, i) =>
            `filters[${params.filters[filterKey].join ?? '$or'}][${
              params.filters[filterKey].join === '$and' ? $and++ : $or++
            }]${filterKey
              .split('.')
              .reduce((memo, fKey) => `${memo}[${fKey}]`, '')}[${
              params.filters[filterKey].operator
            }]=${params.filters[filterKey].value}`
        )
    : [];
};

// Much cooler than qs.stringify ;)
export const getUrlFromParameters = (params: Parameters): string =>
  params
    ? union(
        getPopulates(params),
        getFields(params),
        getFilters(params),
        getPagination(params),
        getSort(params)
      ).join('&')
    : '';

/**
 * Child references of an entity should only contain their document ID,
 * not the full object.
 */
const simplifyEntityReferences = (data: object): object => {
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === 'object' && data[key] !== null) {
      if (typeof data[key].documentId === 'string') {
        data[key] = {
          documentId: data[key].documentId,
        };
      } else if (data[key].id) {
        data[key] = {
          id: data[key].id,
        };
      }
    }
  });

  return data;
};

export const fetchHomepage = async ({
  baseUrl,
  parameters,
}: APIProps): Promise<StrapiResponse<SingleTypeHomepage>> => {
  const response = await fetch(
    `${baseUrl}/api/homepage?${getUrlFromParameters(parameters)}`
  );

  const homepage = await response.json();
  return homepage as StrapiResponse<SingleTypeHomepage>;
};

export const fetchResourcesSearchPage = async ({
  baseUrl,
  parameters,
}: APIProps): Promise<StrapiResponse<SingleTypeResourcesSearchPage>> => {
  const response = await fetch(
    `${baseUrl}/api/resources-search-page?${getUrlFromParameters(parameters)}`
  );

  const resourcesSearchPage = await response.json();

  return resourcesSearchPage as StrapiResponse<SingleTypeResourcesSearchPage>;
};

export const fetchFaqs = async ({
  baseUrl,
  parameters,
  signal,
}: APIProps): Promise<StrapiResponse<FAQ[]>> => {
  const response = await fetch(
    `${baseUrl}/api/faqs?${getUrlFromParameters(parameters)}`,
    {
      signal,
    }
  );

  const faqs = await response.json();
  return faqs as StrapiResponse<FAQ[]>;
};

export const fetchResources = async ({
  baseUrl,
  parameters,
  signal,
}: APIProps): Promise<StrapiResponse<Resource[]>> => {
  const response = await fetch(
    `${baseUrl}/api/resources?${getUrlFromParameters(parameters)}`,
    {
      signal,
    }
  );

  const resources = await response.json();
  return resources as StrapiResponse<Resource[]>;
};

export const fetchCategories = async ({
  baseUrl,
  parameters,
}: APIProps): Promise<StrapiResponse<Category[]>> => {
  const response = await fetch(
    `${baseUrl}/api/categories?${getUrlFromParameters(parameters)}`
  );

  const categories = await response.json();
  return categories as StrapiResponse<Category[]>;
};

// const fullResourcePopulate = [
//   "images",
//   "attributes",
//   "user",
//   "address"
// ];

export const fetchBookingById = async ({
  baseUrl,
  jwt,
  body,
  parameters,
}: APIProps<{ id: string }>): Promise<
  StrapiResponse<Booking | undefined>
> => {
  const { id } = body;

  const response = await fetch(
    `${baseUrl}/api/bookings/${id}?${getUrlFromParameters(parameters)}`,
    {
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    }
  );

  const bookingData = await response.json();
  return bookingData as StrapiResponse<Booking | undefined>;
};

export const fetchResourceBySlug = async ({
  baseUrl,
  parameters,
  body,
}: APIProps<{ slug: string }>): Promise<
  StrapiResponse<Resource | undefined>
> => {
  const { slug } = body;

  const response = await fetch(
    `${baseUrl}/api/resources?filters[slug][$eq]=${slug}&${getUrlFromParameters(
      parameters
    )}`
  );
  // @todo Missing: Resolved attributes.attribute
  // WAS: ${fullResourcePopulate.join("&populate[]=")}

  const resourceData = await response.json();
  return resourceData as StrapiResponse<Resource | undefined>;
};

/** @todo evtl. add param to populatable fields */
export const fetchOwnUser = async ({
  baseUrl,
  jwt,
}: BaseAPIProps): Promise<User> => {
  const params = {
    populate: [
      'address',
      'resources',
      'resources.user',
      'resources.user.organization',
      'resources.images',
      'resources.prices',
    ],
  };
  const response = await fetch(
    `${baseUrl}/api/users/me?${getPopulates(params).join('&')}`,
    {
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    }
  );

  const userData = await response.json();
  return userData as User;
};

export const fetchResourcePrice = async ({
  baseUrl,
  body,
}: APIProps<FetchResourcePriceRequest>): Promise<Price> => {
  // @todo Authenticate as user, if logged in
  const { resource_id, start, end, units } = body;

  const response = await fetch(
    `${baseUrl}/api/resources/${resource_id}/price?start=${start}&end=${end}&units=${units}`
  );

  const price = await response.json();

  return price;
};

export const fetchResourceById = async ({
  baseUrl,
  parameters,
  body,
}: APIProps<{ id: string }>): Promise<Resource> => {
  const { id } = body;

  const response = await fetch(
    `${baseUrl}/api/resources/${id}?${getUrlFromParameters(parameters)}`
  );

  const resource = await response.json();

  return resource;
};

export const fetchMaxAvailableUnits = async ({
  baseUrl,
  body,
}: APIProps<FetchMaxAvailableUnitsRequest>): Promise<number> => {
  const { start, end, resource_id, exclude_booking_id } = body;

  const response = await fetch(
    `${baseUrl}/api/plugin-availabilities/max-available?start=${format(
      start,
      'yyyy-MM-dd'
    )}&end=${format(end, 'yyyy-MM-dd')}&resource_id=${resource_id.toString()}${
      exclude_booking_id
        ? `&exclude_booking_id=${exclude_booking_id.toString()}`
        : ''
    }`
  );

  const calendarData = await response.json();
  return Number(
    (calendarData as AvailabilitiesGetMaxAvailableResponse).data || 0
  );
};

export const fetchCalendar = async ({
  baseUrl,
  body,
}: APIProps<{
  start: Date;
  end: Date;
  resource_id: string;
}>): Promise<AvailabilitiesGetCalendarResponseData> => {
  const { start, end, resource_id } = body;

  const response = await fetch(
    `${baseUrl}/api/plugin-availabilities/calendar?start=${format(
      start,
      'yyyy-MM-dd'
    )}&end=${end.toISOString()}&resource_id=${resource_id}`
  );

  const calendarData = await response.json();
  return (calendarData as AvailabilitiesGetCalendarResponse).data;
};

export const fetchDashboard = async ({
  baseUrl,
  jwt,
}: BaseAPIProps): Promise<AvailabilitiesGetDashboardResponseData> => {
  const response = await fetch(
    `${baseUrl}/api/plugin-availabilities/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  const dashboardData = await response.json();
  return dashboardData as AvailabilitiesGetDashboardResponseData;
};

export const fetchProfile = async ({
  baseUrl,
  jwt,
  parameters,
}: APIProps): Promise<User> => {
  const response = await fetch(
    `${baseUrl}/api/users/me?${getUrlFromParameters(parameters)}`,
    {
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    }
  );

  const user = await response.json();
  return user;
};

type RegisterInputErrors = {
  email?: string[];
  // @todo complete list
};

export const registerUser = async ({
  baseUrl,
  body,
}: APIProps<any>): Promise<
  StrapiLoginResponse | ErrorFormState<RegisterInputErrors>
> => {
  const response = await fetch(`${baseUrl}/api/auth/local/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const user = await response.json();
  return user;
};

export const requestForgotPassword = async ({
  baseUrl,
  body,
}: APIProps<{ email: string }>): Promise<{ ok: boolean }> => {
  const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const user = await response.json();
  return user;
};

export const resetPassword = async ({
  baseUrl,
  body,
}: APIProps<{
  password: string;
  passwordConfirmation: string;
  code: string;
}>): Promise<{ ok: boolean }> => {
  const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const user = await response.json();
  return user;
};

export const addBooking = async ({
  baseUrl,
  jwt,
  body,
}: APIProps<BookingRequest>): Promise<any> => {
  const response = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${jwt}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ data: simplifyEntityReferences(body) }),
  });

  const booking = await response.json();
  return booking;
};

export const addResource = async ({
  baseUrl,
  jwt,
  body,
}: APIProps<Partial<Resource>>): Promise<any> => {
  const response = await fetch(`${baseUrl}/api/resources`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${jwt}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ data: simplifyEntityReferences(body) }),
  });

  const resource = await response.json();
  return resource;
};

export const addAvailability = async ({
  baseUrl,
  jwt,
  body,
}: APIProps<Availability>): Promise<
  StrapiResponse<Availability | undefined>
> => {
  const response = await fetch(
    `${baseUrl}/api/availabilities?populate[]=resource`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${jwt}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ data: simplifyEntityReferences(body) }),
    }
  );

  const availabilityData = await response.json();
  return availabilityData as StrapiResponse<Availability | undefined>;
};

export const deleteAvailability = async ({
  baseUrl,
  jwt,
  body,
}: APIProps<string>): Promise<boolean> => {
  const availabilityDocumentId = body;

  const response = await fetch(
    `${baseUrl}/api/availabilities/${availabilityDocumentId}`,
    {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    }
  );

  // @todo May also "just" return a status code
  const availabilityData = await response.json();
  console.log('DELETE', availabilityData);
  return availabilityData as boolean;
};

export const updateAvailability = async ({
  baseUrl,
  jwt,
  body,
}: APIProps<Availability>): Promise<
  StrapiResponse<Availability | undefined>
> => {
  const { documentId } = body;

  const response = await fetch(
    `${baseUrl}/api/availabilities/${documentId}?populate[]=resource`,
    {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${jwt}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ data: simplifyEntityReferences(body) }),
    }
  );

  const availabilityData = await response.json();
  return availabilityData as StrapiResponse<Availability | undefined>;
};
