import type { Core } from '@strapi/strapi';

import importResourcesFromCSV from '../helpers/csvResourcesImporter';
import importBookingsFromCSV from '../helpers/csvBookingsImporter';
import importUsersFromCSV from '../helpers/csvUsersImporter';
import importFAQsFromCSV from '../helpers/csvFAQsImporter';

export interface ImportCSVService {
  deleteAllUsers: () => Promise<void>;
  deleteAllBookings: () => Promise<void>;
  deleteAllResources: () => Promise<void>;
  deleteAllCategories: () => Promise<void>;
  deleteAllFAQs: () => Promise<void>;
  importCSV: () => Promise<void>;
}

export default ({ strapi }: { strapi: Core.Strapi }): ImportCSVService => ({
  deleteAllUsers: async () => {
    const users = await strapi.db
      .query('plugin::users-permissions.user')
      .deleteMany({
        filters: {
          $not: {
            role: 1,
          },
        },
      });
    console.log(`Removed ${users.count} users`);
  },

  deleteAllBookings: async () => {
    let bookings = await strapi.db.query('api::booking.booking').deleteMany({});
    console.log(`Removed ${bookings.count} bookings`);
  },

  deleteAllResources: async () => {
    let resources = await strapi.db
      .query('api::resource.resource')
      .deleteMany({});
    console.log(`Removed ${resources.count} resources`);
  },

  deleteAllCategories: async () => {
    let categories = await strapi.db
      .query('api::category.category')
      .deleteMany({});
    console.log(`Removed ${categories.count} categories`);
  },

  deleteAllFAQs: async () => {
    let faqs = await strapi.db.query('api::faq.faq').deleteMany({});
    console.log(`Removed ${faqs.count} faqs`);
  },

  async importCSV() {
    console.log('--- Running csvToResource import ---');
    await this.deleteAllCategories();
    await this.deleteAllResources();
    await this.deleteAllBookings();
    await this.deleteAllUsers();
    await this.deleteAllFAQs();
    console.log('--- Done flushing tables ---');
    await importUsersFromCSV();
    await importResourcesFromCSV();
    await importBookingsFromCSV();
    await importFAQsFromCSV();
    console.log('--- Finished csvToResource import ---');
  },
});
