import {
  BerlinBooking,
  BerlinBookingIntend,
  BerlinBookingPersonCount,
  BerlinRaffleEntry,
  Resource,
} from '@depot/shared';
import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sendBerlinBookingEmail(ctx) {
    try {
      const { body } = ctx.request;
      const { data } = body;

      // Validate required fields
      const requiredFields = [
        'projectTitle',
        'projectDescription',
        'intend',
        'personCount',
        'start',
        'end',
        'contactName',
        'contactEmail',
        'contactPhone',
      ];

      const missingFields = requiredFields.filter((field) => !data[field]);
      if (missingFields.length > 0) {
        return ctx.badRequest(
          `Missing required fields: ${missingFields.join(', ')}`,
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.contactEmail)) {
        return ctx.badRequest('Invalid email format');
      }

      // Validate dates
      const startDate = new Date(data.start);
      const endDate = new Date(data.end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return ctx.badRequest('Invalid date format');
      }

      if (startDate > endDate) {
        return ctx.badRequest('Start date must be before end date');
      }

      // Validate personCount enum
      if (!Object.values(BerlinBookingPersonCount).includes(data.personCount)) {
        return ctx.badRequest('Invalid personCount value');
      }

      // Validate intend enum
      if (!Object.values(BerlinBookingIntend).includes(data.intend)) {
        return ctx.badRequest('Invalid intend value');
      }

      // Validate acceptAGB
      if (data.acceptAGB !== true) {
        return ctx.badRequest('Terms and conditions must be accepted');
      }

      // Validate and resolve resource
      if (!data.resource || !data.resource.id) {
        return ctx.badRequest('Resource is required');
      }

      const resource = await strapi
        .documents('api::resource.resource')
        .findOne({
          documentId: data.resource.id,
          populate: ['resourceTypes'],
        });

      if (!resource) {
        return ctx.badRequest('Resource not found');
      }

      const berlinBooking: Partial<BerlinBooking> = {
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        associationRegistrationNumber: data.associationRegistrationNumber,
        projectWebsite: data.projectWebsite,
        intend: data.intend,
        personCount: data.personCount,
        start: data.start,
        end: data.end,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        acceptAGB: data.acceptAGB,
        resource: resource as unknown as Resource,
      };

      const result = await strapi
        .plugin('emails')
        .service('emailsService')
        .sendBerlinBookingEmail(berlinBooking);

      if (result) {
        ctx.body = {
          success: true,
          message: 'Berlin booking email sent successfully',
        };
        ctx.status = 200;
      } else {
        ctx.body = {
          success: false,
          message: 'Failed to send Berlin booking email',
        };
        ctx.status = 500;
      }
    } catch (error) {
      console.error('Error in sendBerlinBookingEmail controller:', error);
      ctx.body = { success: false, message: 'Internal server error' };
      ctx.status = 500;
    }
  },

  async sendBerlinRaffleEntryEmail(ctx) {
    try {
      const { body } = ctx.request;
      const { data } = body;

      if (!data) {
        return ctx.badRequest('No data provided');
      }

      // Validate required fields
      const requiredFields = [
        'provider',
        'legalEntityType',
        'contactPerson',
        'raffleEmail',
        'contactPhone',
      ];

      const missingFields = requiredFields.filter((field) => !data[field]);
      if (missingFields.length > 0) {
        return ctx.badRequest(
          `Missing required fields: ${missingFields.join(', ')}`,
        );
      }

      // Validate address
      if (
        !data.address ||
        !data.address.street ||
        !data.address.zip ||
        !data.address.city
      ) {
        return ctx.badRequest('Complete address is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.raffleEmail)) {
        return ctx.badRequest('Invalid email format');
      }

      // Validate acceptTerms and acceptPrivacy
      if (data.acceptTerms !== true) {
        return ctx.badRequest('Terms must be accepted');
      }
      if (data.acceptPrivacy !== true) {
        return ctx.badRequest('Privacy policy must be acknowledged');
      }

      // Validate and resolve resource
      if (!data.resource || !data.resource.id) {
        return ctx.badRequest('Resource reference is required');
      }

      const resource = await strapi
        .documents('api::resource.resource')
        .findOne({
          documentId: data.resource.id,
          populate: ['resourceTypes'],
        });

      if (!resource) {
        return ctx.badRequest('Resource not found');
      }

      const raffleEntry: Partial<BerlinRaffleEntry> = {
        provider: data.provider,
        legalEntityType: data.legalEntityType,
        contactPerson: data.contactPerson,
        address: {
          street: data.address.street,
          zip: data.address.zip,
          city: data.address.city,
        },
        raffleEmail: data.raffleEmail,
        contactPhone: data.contactPhone,
        resource: resource as unknown as Resource,
      };

      const result = await strapi
        .plugin('emails')
        .service('emailsService')
        .sendBerlinRaffleEntryEmail(raffleEntry);

      if (result) {
        ctx.body = {
          success: true,
          message: 'Raffle entry email sent successfully',
        };
        ctx.status = 200;
      } else {
        ctx.body = {
          success: false,
          message: 'Failed to send raffle entry email',
        };
        ctx.status = 500;
      }
    } catch (error) {
      console.error('Error in sendBerlinRaffleEntryEmail controller:', error);
      ctx.body = { success: false, message: 'Internal server error' };
      ctx.status = 500;
    }
  },
});
