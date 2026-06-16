const dotenv = require('dotenv');
const strapi = require('@strapi/strapi');

// Load environment variables
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

// Start strapi
strapi.createStrapi({ distDir: './dist' }).start();
