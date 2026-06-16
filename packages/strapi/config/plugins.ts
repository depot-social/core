export default ({ env }) => ({
    'users-permissions': {
        enabled: true,
        config: {
            register: {
                allowedFields: ["firstName", "lastName", "address", "phone", "salutation"],
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
        enabled: env('STRAPI_PLUGIN_PRICES', true),
        resolve: './src/plugins/prices'
    },
    'emails': {
        enabled: env('STRAPI_PLUGIN_EMAILS', true),
        resolve: './src/plugins/emails'
    },
    'rental-agreement': {
        enabled: env('STRAPI_PLUGIN_RENTAL_AGREEMENT', true),
        resolve: './src/plugins/rental-agreement'
    },
    'import-csv': {
        enabled: false, // env('STRAPI_PLUGIN_IMPORT_CSV', false),
        resolve: './src/plugins/import-csv'
    },
    seo: {
        enabled: true
    },
    email: {
        config: {
            // For all available mail providers @see https://market.strapi.io/providers
            // For configuration of nodemailer @see https://market.strapi.io/providers/@strapi-provider-email-nodemailer
            provider: 'nodemailer',
            providerOptions: {
                host: env('SMTP_HOST'),
                port: env('SMTP_PORT', 587),
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
