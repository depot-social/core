import type { Schema, Struct } from '@strapi/strapi';

export interface CustomAddress extends Struct.ComponentSchema {
  collectionName: 'components_custom_addresses';
  info: {
    description: '';
    displayName: 'Address';
    icon: 'map-marked-alt';
  };
  attributes: {
    latitude: Schema.Attribute.Float;
    longitude: Schema.Attribute.Float;
    obfuscatedLatitude: Schema.Attribute.Float;
    obfuscatedLongitude: Schema.Attribute.Float;
    place: Schema.Attribute.String;
    street: Schema.Attribute.String;
    zip: Schema.Attribute.String;
  };
}

export interface CustomLink extends Struct.ComponentSchema {
  collectionName: 'components_custom_links';
  info: {
    description: '';
    displayName: 'Link';
    icon: 'anchor';
  };
  attributes: {
    title: Schema.Attribute.String;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CustomOrganization extends Struct.ComponentSchema {
  collectionName: 'components_custom_organizations';
  info: {
    displayName: 'Organization';
    icon: 'address-card';
  };
  attributes: {
    isApproved: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    proofDocument: Schema.Attribute.Media<'files'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['foundation', 'association', 'company', 'misc']
    >;
    website: Schema.Attribute.String;
  };
}

export interface CustomPrice extends Struct.ComponentSchema {
  collectionName: 'components_custom_prices';
  info: {
    description: '';
    displayName: 'Price';
    icon: 'money-bill-alt';
  };
  attributes: {
    currency: Schema.Attribute.Enumeration<['euro', 'usd']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'euro'>;
    depositValue: Schema.Attribute.Decimal;
    duration: Schema.Attribute.Integer;
    durationType: Schema.Attribute.Enumeration<['daily', 'hourly']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'daily'>;
    resourceValue: Schema.Attribute.Decimal;
    tariffType: Schema.Attribute.Enumeration<['regular', 'notForProfit']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'regular'>;
    title: Schema.Attribute.String;
    value: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    vatValue: Schema.Attribute.Decimal;
  };
}

export interface CustomResourceAttribute extends Struct.ComponentSchema {
  collectionName: 'components_custom_resource_attributes';
  info: {
    displayName: 'ResourceAttribute';
    icon: 'bulletList';
  };
  attributes: {
    attribute: Schema.Attribute.Relation<
      'oneToOne',
      'api::attribute.attribute'
    >;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MessageTypesBookingEventMessageType
  extends Struct.ComponentSchema {
  collectionName: 'components_booking_event_message_types';
  info: {
    displayName: 'BookingEventMessageType';
    icon: 'bell';
  };
  attributes: {
    booking: Schema.Attribute.Relation<'oneToOne', 'api::booking.booking'>;
  };
}

export interface MessageTypesUserMessageType extends Struct.ComponentSchema {
  collectionName: 'components_message_types_user_message_types';
  info: {
    displayName: 'UserMessageType';
    icon: 'message';
  };
  attributes: {
    content: Schema.Attribute.Text;
  };
}

export interface ResourceTypesBerlinResourceType
  extends Struct.ComponentSchema {
  collectionName: 'components_resource_types_berlin_resource_types';
  info: {
    displayName: 'BerlinResourceType';
    icon: 'bulletList';
  };
  attributes: {
    accessibilityInfo: Schema.Attribute.Text;
    accessibilityState: Schema.Attribute.Enumeration<
      ['accessible', 'not_accessible', 'partly_accessible']
    > &
      Schema.Attribute.Required;
    contactEmail: Schema.Attribute.Email;
    contactPerson: Schema.Attribute.String;
    contactPhone: Schema.Attribute.String;
    facilities: Schema.Attribute.Text;
    facilitiesAdditionalInfo: Schema.Attribute.Text;
    initialRoomName: Schema.Attribute.String;
    maxCapacity: Schema.Attribute.String;
    offerPublishedAt: Schema.Attribute.Date;
    provider: Schema.Attribute.String;
    roomName: Schema.Attribute.String;
    roomSizeSqm: Schema.Attribute.Integer;
    usageFeeDetails: Schema.Attribute.Text;
    usageHours: Schema.Attribute.Text;
  };
}

export interface ResourceTypesContingentResourceType
  extends Struct.ComponentSchema {
  collectionName: 'components_contingent_resource_type';
  info: {
    description: 'Provides fields for contingent-based availability check';
    displayName: 'ContingentResourceType';
    icon: 'bezier-curve';
  };
  attributes: {
    availableUnits: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
    extraTextBookingConfirmation: Schema.Attribute.RichText;
    extraTextRentContract: Schema.Attribute.RichText;
    generateRentContract: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    minBookableUnits: Schema.Attribute.Integer;
    onlyNotForProfit: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    openingTimes: Schema.Attribute.RichText;
  };
}

export interface SharedOpenGraph extends Struct.ComponentSchema {
  collectionName: 'components_shared_open_graphs';
  info: {
    displayName: 'openGraph';
    icon: 'project-diagram';
  };
  attributes: {
    ogDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    ogType: Schema.Attribute.String;
    ogUrl: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    keywords: Schema.Attribute.Text;
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
        minLength: 50;
      }>;
    metaImage: Schema.Attribute.Media<'images'>;
    metaRobots: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    metaViewport: Schema.Attribute.String;
    openGraph: Schema.Attribute.Component<'shared.open-graph', false>;
    structuredData: Schema.Attribute.JSON;
  };
}

export interface SingleTypeBlocksAccordion extends Struct.ComponentSchema {
  collectionName: 'components_single_type_blocks_accordions';
  info: {
    description: '';
    displayName: 'Accordion';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    illustration: Schema.Attribute.Media<'images'>;
    linkPath: Schema.Attribute.String;
    linkText: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SingleTypeBlocksAccordionBlock extends Struct.ComponentSchema {
  collectionName: 'components_accordion_blocks';
  info: {
    description: '';
    displayName: 'AccordionBlock';
    icon: 'bulletList';
  };
  attributes: {
    accordionItems: Schema.Attribute.Component<
      'single-type-blocks.accordion',
      true
    >;
    isStacked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SingleTypeBlocksFaqs extends Struct.ComponentSchema {
  collectionName: 'components_single_type_blocks_faqs';
  info: {
    displayName: 'faqs';
    icon: 'question';
  };
  attributes: {};
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'custom.address': CustomAddress;
      'custom.link': CustomLink;
      'custom.organization': CustomOrganization;
      'custom.price': CustomPrice;
      'custom.resource-attribute': CustomResourceAttribute;
      'message-types.booking-event-message-type': MessageTypesBookingEventMessageType;
      'message-types.user-message-type': MessageTypesUserMessageType;
      'resource-types.berlin-resource-type': ResourceTypesBerlinResourceType;
      'resource-types.contingent-resource-type': ResourceTypesContingentResourceType;
      'shared.open-graph': SharedOpenGraph;
      'shared.seo': SharedSeo;
      'single-type-blocks.accordion': SingleTypeBlocksAccordion;
      'single-type-blocks.accordion-block': SingleTypeBlocksAccordionBlock;
      'single-type-blocks.faqs': SingleTypeBlocksFaqs;
    }
  }
}
