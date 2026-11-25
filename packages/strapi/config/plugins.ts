import { readBooleanEnv } from '@depot/shared';
import { mutateBookingDocumentation } from './booking-documentation';

/**
 * Selectable icons for navigation items (Phosphor icon names without `ph-` prefix).
 * Frontend renders them as `<i class="ph ph-<name>">`.
 */
const NAVIGATION_ICONS = [
    'magnifying-glass',
    'plus',
    'squares-four',
    'key',
    'book-open',
    'question',
    'info',
    'envelope-simple',
    'calendar-dots',
    'chat-circle',
    'user',
    'gear',
    'star',
    'archive-box',
];

export default ({ env }) => ({
    'users-permissions': {
        enabled: true,
        config: {
            register: {
                allowedFields: ["firstName", "lastName", "address", "phone", "salutation", "organizationName", "link"],
            },
        }
    },
    'plugin-availabilities': {
        // Important: keep prefix "plugin-" to avoid confusion with api::availabilities
        enabled: env('STRAPI_PLUGIN_AVAILABILITIES', true),
        resolve: './src/plugins/availabilities'
    },
    'conversations': {
        enabled: env('STRAPI_PLUGIN_CONVERSATIONS', true),
        resolve: './src/plugins/conversations'
    },
    'prices': {
        enabled: readBooleanEnv(env('STRAPI_PLUGIN_PRICES'), true),
        resolve: './src/plugins/prices'
    },
    'emails': {
        enabled: env('STRAPI_PLUGIN_EMAILS', true),
        resolve: './src/plugins/emails'
    },
    'rental-agreement': {
        enabled: env('STRAPI_PLUGIN_RENTAL_AGREEMENT', true),
        resolve: './src/plugins/rental-agreement',
        config: {
            pdfAppName: env('PDF_APP_NAME'),
            pdfLogoPath: env('PDF_LOGO_PATH'),
        },
    },
    search: {
        enabled: env('STRAPI_PLUGIN_SEARCH', true),
        resolve: './src/plugins/search',
        config: {
            contentTypes: {
                'api::resource.resource': {
                    // PDP fields Ausleihe + Raum, concatenated into the hidden `searchIndex` on save.
                    searchFields: [
                        'title',
                        'description',
                        'address.street',
                        'resourceTypes.provider',
                        'resourceTypes.facilities',
                        'resourceTypes.facilitiesAdditionalInfo',
                    ],
                    populate: {
                        address: true,
                        resourceTypes: true,
                    },
                },
            },
        },
    },
    seo: {
        enabled: true
    },
    navigation: {
        enabled: true,
        config: {
            // Instance specific menus (e.g. left side "Raum für Engagement").
            // The engagiertes.berlin main navigation is hard coded in the frontend.
            additionalFields: [
                {
                    name: 'icon',
                    type: 'select',
                    label: 'Icon',
                    description: 'Phosphor icon name, see https://phosphoricons.com',
                    multi: false,
                    options: NAVIGATION_ICONS,
                    required: false,
                    enabled: true,
                },
                {
                    name: 'comingSoon',
                    type: 'boolean',
                    label: 'Noch nicht verfügbar',
                    description: 'Shows the item disabled with a "not yet available" hint',
                    required: false,
                    enabled: true,
                },
            ],
            contentTypes: ['api::page.page'],
            contentTypesNameFields: {
                'api::page.page': ['headline'],
            },
            pathDefaultFields: {
                'api::page.page': ['slug'],
            },
            allowedLevels: 2,
        },
    },
    email: {
        config: {
            // For all available mail providers @see https://market.strapi.io/providers
            // For configuration of nodemailer @see https://market.strapi.io/providers/@strapi-provider-email-nodemailer
            provider: 'nodemailer',
            providerOptions: {
                host: env('SMTP_HOST'),
                port: env('SMTP_PORT', 587),
                // requireTLS: true,
                auth: {
                    user: env('SMTP_USERNAME'),
                    pass: env('SMTP_PASSWORD')
                }
            },
            settings: {
                defaultFrom: env('ADMIN_EMAIL'),
                defaultReplyTo: env('REPLY_EMAIL'),
            },
        }
    },
    documentation: {
        enabled: true,
        config: {
            info: {
                version: "0.1.0",
                title: 'depot API documentation',
                description: '',
                termsOfService: 'https://depot.social',
                contact: {
                    name: 'depot dev',
                    email: 'felix@depot.social',
                    url: 'https://depot.social'
                },
                license: {
                    name: 'MIT License',
                    url: "https://mit-license.org/"
                },
            },
            'x-strapi-config': {
                mutateDocumentation: mutateBookingDocumentation,
                // Add plugins to create documentation for
                // @todo Make @depot/availabilities applicable (requires content-types)
                plugins: ["upload", "users-permissions", /*'@depot/availabilities'*/],
                path: '/documentation',
            },
        },
    },
    'local-image-sharp': {
        config: {
            maxAge: 31536000, // which corresponds to 1 year: 60 seconds × 60 minutes × 24 hours × 365 days = 31536000 seconds.
        },
    },
});
