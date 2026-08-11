export type DocumentId = string;

export interface StrapiDocumentReference {
  documentId: DocumentId;
}

/** @deprecated Use StrapiDocumentReference for new request payloads. */
export interface TransitionalDocumentReference {
  id: DocumentId;
}

export interface StrapiBaseEntity extends StrapiDocumentReference {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id?: string;
  street: string;
  zip: string;
  place: string;
  latitude?: number;
  longitude?: number;
  obfuscatedLatitude?: number;
  obfuscatedLongitude?: number;
}

export type BookingStatus = 'requested' | 'cancelled' | 'confirmed';

export interface Booking extends StrapiBaseEntity {
  start: string;
  end: string;
  bookingStatus: BookingStatus;
  bookedUnits: number;
  title: string;
  resource: Resource;
  resourceOwner: User;
  customer: User;
  customerAddress: Address;
  price: Price;
  commentCustomer: string | null;
  checkTermsConditions: boolean;
}

export type ResourceRelationInput =
  | DocumentId
  | StrapiDocumentReference
  | TransitionalDocumentReference
  | Resource;

export type BookingRequest = Omit<Partial<Booking>, 'resource'> & {
  resource?: ResourceRelationInput;
};

export enum BerlinBookingIntend {
  LEARNING_TOGETHER = 'Zusammen lernen',
  COMMUNITY_COOKING = 'Gemeinsames Kochen',
  MOVE = 'Bewegung',
  YOUTH_PROJECTS = 'Jugend-Projekte',
  OPEN_EVENT = 'Offene Veranstaltung',
  QUIET_MEETING = 'Ruhiges Treffen',
  MUSIC_AND_SINGING = 'Singen und Musik spielen',
}

export enum BerlinBookingPersonCount {
  ONE_TO_TEN = '1-10',
  TEN_TO_TWENTY = '10-20',
  TWENTY_TO_THIRTY = '20-30',
  THIRTY_TO_FOURTY = '30-40',
  FOURTY_TO_FIFTY = '40-50',
  FIFTY_PLUS = '50+',
}

export interface BerlinBooking extends StrapiBaseEntity {
  projectTitle: string;
  projectDescription: string;
  associationRegistrationNumber?: string;
  projectWebsite?: string;
  intend: BerlinBookingIntend;
  personCount: BerlinBookingPersonCount;
  start: string;
  end: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  acceptAGB: boolean;
  resource: Partial<Resource>;
}

export interface BerlinRaffleEntry extends StrapiBaseEntity {
  provider: string;
  legalEntityType: string;
  contactPerson: string;
  address: {
    street: string;
    zip: string;
    city: string;
  };
  raffleEmail: string;
  contactPhone: string;
  resource?: Partial<Resource>;
}

export interface FAQ extends StrapiBaseEntity {
  question: string;
  slug: string;
  answer: string;
}

export interface Availability {
  id: number;
  documentId: DocumentId;
  title: string;
  start: string | Date;
  end: string | Date;
  availableUnits: number;
  resource?: Resource;
}

/**
 * @todo Idea: Separate all populatable fields of an entity
 * and add a param to the fetch function to populate them
 */

export type Media = ImageFormat; /* @todo */

export interface Organization {
  title: string;
  isApproved: boolean;
  type: 'foundation' | 'association' | 'company' | 'misc';
  website?: string;
  proofDocument?: Media;
}

export interface User extends StrapiBaseEntity {
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  salutation?: string;
  address?: Address;
  resources?: Resource[];
  bookingsResourceOwner?: Booking[];
  bookingsCustomer?: Booking[];
  organization: Organization;
}

export interface Conversation extends StrapiBaseEntity {
  users: User[];
  messages: Message[];
}

export enum MessageTypeComponent {
  USER_MESSAGE_TYPE = 'message-types.user-message-type',
  BOOKING_EVENT_MESSAGE_TYPE = 'message-types.booking-event-message-type',
}

interface BaseMessageType {
  __component: MessageTypeComponent;
}

export interface BookingEventMessageType extends BaseMessageType {
  booking: Booking;
}

export interface UserMessageType extends BaseMessageType {
  content: string;
}

export type MessageType = BookingEventMessageType | UserMessageType;

export interface Message extends StrapiBaseEntity {
  id: number;
  createdAt: string;
  sender?: User;
  conversation: number | Conversation;
  messageType: MessageType[];
}

export interface Category extends StrapiBaseEntity {
  title: string;
  resources?: Resource[];
  slug: string;
}

export interface Purpose extends StrapiBaseEntity {
  title: string;
  slug: string;
  resources?: Resource[];
}

export interface District extends StrapiBaseEntity {
  name: string;
  slug: string;
  resources?: Resource[];
}

interface ImageFormat {
  ext: string;
  hash: string;
  height: number;
  width: number;
  size: number;
  mime: string;
  name: string;
  path: string;
  url: string;
  alternativeText: string | null;
}

type ImageFormatKeys = 'small' | 'thumbnail';

export interface UploadedImage extends StrapiBaseEntity {
  // UploadedImage === Media???
  alternativeText: string | null;
  caption: string | null;
  ext: string;
  folderPath: string;
  formats: { [key in ImageFormatKeys]: ImageFormat };
  hash: string;
  height: number;
  width: number;
  size: number;
  mime: string;
  name: string;
  previewUrl: string | null;
  proivder: 'local';
  provider_metadata: string | null;
  url: string;
}

export enum ResourceTypeComponent {
  CONTINGENT_RESOURCE_TYPE = 'resource-types.contingent-resource-type',
  BERLIN_RESOURCE_TYPE = 'resource-types.berlin-resource-type',
}

interface BaseResourceType {
  __component: ResourceTypeComponent;
}

export interface ContingentResourceType extends BaseResourceType {
  availableUnits: number;
  minBookableUnits: number;
  generateRentContract: boolean;
  onlyNotForProfit: boolean;
  extraTextRentContract: string;
  extraTextBookingConfirmation: string;
  openingTimes: string;
}

export type AccessibilityState =
  | 'accessible'
  | 'not_accessible'
  | 'partly_accessible';

export type ResourceType = ContingentResourceType | BerlinResourceType;

export interface BerlinResourceType extends BaseResourceType {
  __component: ResourceTypeComponent.BERLIN_RESOURCE_TYPE;
  provider: string;
  initialRoomName: string;
  roomName: string;
  maxCapacity: string;
  facilities: string;
  facilitiesAdditionalInfo: string;
  roomSizeSqm: number;
  accessibilityState: AccessibilityState;
  accessibilityInfo: string;
  usageHours: string;
  usageFeeDetails: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  offerPublishedAt: string;
}

export interface Attribute extends StrapiBaseEntity {
  value: string;
  slug: string;
  recommended: boolean;
}

export interface Link {
  url: string;
  title: string;
}

export interface ResourceAttribute {
  attribute: Attribute;
  value: string;
}

export interface Resource extends StrapiBaseEntity {
  title: string;
  description: string;
  categories: Category[];
  purposes: Purpose[];
  district: District;
  address: Address;
  images: UploadedImage[];
  slug: string;
  prices: Price[];
  links?: Link[];
  uploads?: Media[]; // @todo Correct?
  bookings?: Booking[];
  resourceTypes: ResourceType[];
  availabilities?: Availability[];
  attributes?: ResourceAttribute[];
  user: User;
  legacyId?: number; // This HAS to stay here until migration to v3 finished
}

export const EmptyAddress = (): Address => ({
  id: null,
  street: '',
  zip: '',
  place: '',
  latitude: null,
  longitude: null,
});

export const EmptyResource = (): Resource => ({
  documentId: '',
  id: null,
  createdAt: '',
  updatedAt: '',
  title: '',
  description: '',
  categories: [],
  purposes: [],
  district: null,
  address: EmptyAddress(),
  images: [],
  slug: '',
  prices: [],
  links: null,
  uploads: null,
  resourceTypes: [],
  user: null as User, // @todo HAS to be set by front- or backend
});

// @todo export as fn or class?
export const EmptyBooking = (): Partial<Booking> => ({
  start: '',
  end: '',
  bookingStatus: 'requested' as BookingStatus,
  bookedUnits: 0,
  title: '',
  resource: null,
  resourceOwner: null,
  customer: null,
});

// constructor(start = null, end = null, resource = null, bookedUnits = 0) {
//   this.start = start;
//   this.end = end;
//   this.resource = resource;
//   this.bookedUnits;
// }
export enum PriceTariffType {
  REGULAR = 'regular',
  NOT_FOR_PROFIT = 'notForProfit',
}

export interface Price {
  id: number;
  title: string;
  value: number;
  currency: 'euro' | 'usd';
  duration: number;
  durationType: 'daily' | 'hourly';
  tariffType: PriceTariffType;
  resourceValue: number;
  depositValue: number;
  vatValue: number;
}

// Strapi API
export type StrapiResponseData<T> = T & {
  id: number;
};

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiResponseMeta {
  pagination?: StrapiPagination;
}

// @todo rename to StrapiIndexResponse<T>?
export interface StrapiResponse<T> {
  data: T;
  meta: StrapiResponseMeta;
}

// Prices API
export interface FetchResourcePriceRequest {
  resource_id: DocumentId;
  start: Date;
  end: Date;
  units: number;
}

// Availabilities API
export type AvailabilitiesGetMaxAvailableResponseData = number | undefined;

export interface AvailabilitiesGetMaxAvailableResponse {
  data: AvailabilitiesGetMaxAvailableResponseData;
}

export interface CalendarDate {
  day: string;
  availableUnits: number;
}

export interface AvailabilitiesGetCalendarResponseData {
  resource: Partial<Resource>;
  dates: CalendarDate[];
}

export interface AvailabilitiesGetCalendarResponse {
  data: AvailabilitiesGetCalendarResponseData;
}

export interface AvailabilitiesGetDashboardResponseData {
  availabilities: Availability[];
  bookingsResourceOwner: Booking[];
  bookingsCustomer: Booking[];
}

export interface AvailabilitiesGetDashboardResponse {
  data: AvailabilitiesGetDashboardResponseData;
}

export interface FetchMaxAvailableUnitsRequest {
  start: Date;
  end: Date;
  resource_id: DocumentId;
  exclude_booking_id?: number;
}

// Socket.io
export enum SocketRequestEvent {
  JOIN = 'join',
  SEND_MESSAGE = 'sendMessage',
  OPEN_CONVERSATION = 'openConversation',
}

export enum SocketResponseEmit {
  AUTHENTICATION_ERROR = 'authentication_error',
  MESSAGE = 'message',
  CONVERSATIONS = 'conversations',
  CONVERSATION_MESSAGES = 'conversation_messages',
}

export interface ConversationSendMessageEventData {
  conversation_id: number | string;
  content: string;
  user_id: number | string;
}

export interface ConversationOpenEventData {
  conversation_id: number | string;
}

// Strapi API
export interface StrapiLoginResponse {
  jwt: string;
  user: User;
}

// Strapi single types
export interface SingleTypeHomepage {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  headerHeadline: string;
  headerDescription: string;
  accordionSectionIntroLine: string;
  accordionSectionHeadline: string;
  accordionSectionDescription: string;
  resourcesSectionIntroLine: string;
  resourcesSectionHeadline: string;
  resourcesSectionDescription: string;
  blogSectionIntroLine: string;
  blogSectionHeadline: string;
  placesSectionDescription: string;
  headerResources: Resource[];
  accordionAccordion: AccordionAccordion;
  seo?: StrapiSEO;
}

interface AccordionItem {
  id: number;
  title: string;
  description: string;
  linkPath: string | null;
  linkText: string | null;
  illustration: string | null;
}

interface AccordionAccordion {
  id: number;
  isStacked: boolean;
  accordionItems: AccordionItem[];
}

export interface SingleTypeResourcesSearchPage {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  faqSectionHeadline?: string;
  faqs: FAQ[];
  seo?: StrapiSEO;
}

export interface StrapiSEOOpenGraph {
  ogDescription?: string;
  ogImage?: Media;
  ogTitle?: string;
  ogType?: string;
  ogUrl?: string;
}

export interface StrapiSEO {
  canonicalURL?: string;
  keywords?: string;
  metaDescription?: string;
  metaImage?: Media;
  metaRobots?: string;
  metaTitle?: string;
  metaViewport?: string;
  openGraph?: StrapiSEOOpenGraph;
  structuredData?: any;
}

export interface SingleTypePage extends StrapiBaseEntity {
  headline: string;
  slug: string;
  content: string;
  publishedAt: string;
  locale: string;
  seo?: StrapiSEO;
}

export interface SingleTypeEmailTemplate extends StrapiBaseEntity {
  title: string;
  layout: string;
  bookingRequestTitle: string;
  bookingRequestBody: string;
  resourceAwaitsActivationTitle: string;
  resourceAwaitsActivationBody: string;
  organizationAwaitsActivationTitle: string;
  organizationAwaitsActivationBody: string;
  berlinBookingTitle: string;
  berlinBookingTitleCopy: string;
  berlinBookingBody: string;
  raffleEntryTitle: string;
  raffleEntryTitleCopy: string;
  raffleEntryBody: string;
}
