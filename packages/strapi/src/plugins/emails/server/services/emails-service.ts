import {
  BerlinBooking,
  BerlinRaffleEntry,
  BerlinResourceType,
  Booking,
  getResourceType,
  getUsernameFromUser,
  priceToString,
  Resource,
  ResourceTypeComponent,
  SingleTypeEmailTemplate,
} from '@depot/shared';
import type { Core } from '@strapi/strapi';
import { format } from 'date-fns';
import template from 'lodash/template';
import mjml2html from 'mjml';

export interface EmailsService {
  sendBookingRequestMail(bookingDocumentId: string): Promise<boolean>;
  sendResourceAwaitsActivationMail(resourceId: string): Promise<boolean>;
  sendOrganizationAwaitsActivationMail(userId: number): Promise<boolean>;
  sendBerlinBookingEmail(berlinBooking: BerlinBooking): Promise<boolean>;
  sendBerlinRaffleEntryEmail(raffleEntry: BerlinRaffleEntry): Promise<boolean>;
}

const depotBaseUrl =
  process.env.PUBLIC_DEPOT_BASE_URL || 'https://depot.social';

/**
 * Wraps each line of "text" in a <p></p>, if wrapped
 * inside a <mj-text>. To avoid complexity, this function
 * requires each opening and closing HTML-tag to stand
 * on its own line
 */
export const newLineToHtmlParagraph = (text: string): string => {
  let isTextBlockActive = false;

  return text
    .split('\n')
    .map((line) => {
      if (!isTextBlockActive) {
        if (line.match(/<mj-text/)) {
          isTextBlockActive = true;
        }

        return line;
      }

      if (line.match(/<\/mj-text/)) {
        isTextBlockActive = false;
        return line;
      }

      return `<p>${line}</p>`;
    })
    .join('');
};

/**
 * Fetches the email template singleType from Strapi
 */
const getEmailTemplateSingleType = async (
  strapi: Core.Strapi,
): Promise<SingleTypeEmailTemplate | null> => {
  try {
    return (await strapi
      .documents('plugin::emails.email-template')
      .findFirst()) as SingleTypeEmailTemplate;
  } catch (error) {
    console.log('Error fetching email template:', error);
    return null;
  }
};

/**
 * Compiles a template string with data using lodash.template
 * - Supports {{ variable }} interpolation (unescaped)
 * - Supports Mustache-like conditionals: {{ #if cond }}, {{ #elseif cond }}, {{ #else }}, {{ /if }}
 */
const compileTemplate = (
  templateString: string,
  data: Record<string, any>,
): string => {
  if (!templateString) return '';

  // Translate Mustache-like control flow into lodash evaluate tags
  const withConditionals = templateString
    // {{ #if condition }}
    .replace(/{{\s*#if\s+([^}]+)\s*}}/g, '<% if ($1) { %>')
    // {{ #elseif condition }}
    .replace(/{{\s*#elseif\s+([^}]+)\s*}}/g, '<% } else if ($1) { %>')
    // {{ #else }}
    .replace(/{{\s*#else\s*}}/g, '<% } else { %>')
    // {{ /if }}
    .replace(/{{\s*\/if\s*}}/g, '<% } %>');

  const compiled = template(withConditionals, {
    // Keep {{ }} as unescaped interpolation to preserve MJML/HTML
    interpolate: /{{\s*([\s\S]+?)\s*}}/g,
    // Enable evaluation blocks translated above
    evaluate: /<%([\s\S]+?)%>/g,
    // Do not HTML-escape output
    escape: undefined,
  });

  return compiled(data);
};

export default ({ strapi }: { strapi: Core.Strapi }): EmailsService => ({
  async sendBookingRequestMail(bookingDocumentId) {
    const booking: Booking = (await strapi
      .documents('api::booking.booking')
      .findOne({
        documentId: bookingDocumentId,
        populate: ['resource', 'resourceOwner', 'customer', 'price'],
      })) as unknown as Booking;

    if (!booking) {
      return false;
    }

    try {
      const { customer, resource, resourceOwner, price } = booking;

      if (!customer || !resource || !resourceOwner || !resourceOwner.email) {
        console.log('INCOMPLETE BOOKING', booking);
        return false;
      }

      const customerName = `${customer.firstName} ${customer.lastName}`;
      const commentCustomer = booking.commentCustomer;
      const bookingUrl = `${depotBaseUrl}/bookings/${booking.documentId}`; // @todo Use getBookingPath(documentId) from @depot/nuxt
      const start =
        format(new Date(booking.start), 'dd.MM.yyyy, HH:mm') + ` Uhr`;
      const ende =
        format(new Date(booking.start), 'dd.MM.yyyy, HH:mm') + ` Uhr`;
      const priceText = price
        ? `Gesamt: ${priceToString(price.value || 0)} (Kaution: ${priceToString(
          price.depositValue || 0,
        )}, Steuern: ${priceToString(
          price.vatValue || 0,
        )}, Ausleihgebühr: ${priceToString(price.resourceValue)})`
        : '-';

      const templateData = {
        customerName,
        commentCustomer,
        bookingUrl,
        resourceTitle: resource.title,
        bookedUnits: booking.bookedUnits,
        start,
        ende,
        priceText,
        resourceOwnerEmail: resourceOwner.email,
      };

      // Get email template from database
      const emailTemplate = await getEmailTemplateSingleType(strapi);
      if (!emailTemplate) {
        console.log('Email template not found');
        return false;
      }

      // Compile title and body with data
      const compiledTitle = compileTemplate(
        emailTemplate.bookingRequestTitle,
        templateData,
      );
      const compiledBody = compileTemplate(
        emailTemplate.bookingRequestBody,
        templateData,
      );

      // Compile layout with compiled title and body
      const compiledLayout = compileTemplate(emailTemplate.layout, {
        headline: compiledTitle,
        content: compiledBody,
      });

      // Process MJML
      // @todo turn into try ... catch
      const mail = mjml2html(compiledLayout, {
        minify: true,
        validationLevel:
          process.env.NODE_ENV === 'production' ? 'skip' : 'strict',
      });

      if (mail.errors && mail.errors.length >= 1) {
        console.log('MJML errors:', mail.errors);
        return false;
      }

      const emailTemplateData = {
        subject: compiledTitle,
        text: compiledBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html: mail.html,
      };

      await strapi.plugins['email'].services.email.sendTemplatedEmail(
        {
          to: resourceOwner.email,
          // from: process.env.REPLY_EMAIL || '',
          // replyTo: process.env.REPLY_EMAIL || '',
        },
        emailTemplateData,
      );
    } catch (err) {
      console.log('Error sending email', err);
      return false;
    }
  },

  async sendOrganizationAwaitsActivationMail(userId) {
    // @todo Antrag Gemeinnützigkeit
    const username = '';
    const profileUrl = '';

    const templateData = {
      username,
      profileUrl,
      organizationName: 'xy', // @todo Get from actual data
      reason: 'xy', // @todo Get from actual data
      attachmentUrl: 'xy', // @todo Get from actual data
    };

    // Get email template from database
    const emailTemplate = await getEmailTemplateSingleType(strapi);
    if (!emailTemplate) {
      console.log('Email template not found');
      return false;
    }

    // Compile title and body with data
    const compiledTitle = compileTemplate(
      emailTemplate.organizationAwaitsActivationTitle,
      templateData,
    );
    const compiledBody = compileTemplate(
      emailTemplate.organizationAwaitsActivationBody,
      templateData,
    );

    // Compile layout with compiled title and body
    const compiledLayout = compileTemplate(emailTemplate.layout, {
      headline: compiledTitle,
      content: compiledBody,
    });

    // Process MJML
    // @todo turn into try ... catch
    const mail = mjml2html(compiledLayout, {
      minify: true,
      validationLevel:
        process.env.NODE_ENV === 'production' ? 'skip' : 'strict',
    });

    if (mail.errors && mail.errors.length >= 1) {
      console.log('MJML errors:', mail.errors);
      return false;
    }

    // @todo Send email with compiled content
    // const emailTemplateData = {
    //   subject: compiledTitle,
    //   text: compiledBody.replace(/<[^>]*>/g, ''),
    //   html: mail.html,
    // };

    return Promise.resolve(true);
  },

  async sendResourceAwaitsActivationMail(resourceId) {
    const resource = (await strapi.documents('api::resource.resource').findOne({
      documentId: resourceId,
      populate: ['user'],
    })) as unknown as Resource;

    if (!resource || !resource.user) {
      return false;
    }

    try {
      // @todo getResourcePath from @depot/shared
      const fullResourceUrl = `${depotBaseUrl}/ressourcen/${resource.slug}`;
      const username = getUsernameFromUser(resource.user);

      const templateData = {
        username,
        resourceTitle: resource.title,
        fullResourceUrl,
        adminEmail: process.env.ADMIN_EMAIL || '',
      };

      // Get email template from database
      const emailTemplate = await getEmailTemplateSingleType(strapi);
      if (!emailTemplate) {
        console.log('Email template not found');
        return false;
      }

      // Compile title and body with data
      const compiledTitle = compileTemplate(
        emailTemplate.resourceAwaitsActivationTitle,
        templateData,
      );
      const compiledBody = compileTemplate(
        emailTemplate.resourceAwaitsActivationBody,
        templateData,
      );

      // Compile layout with compiled title and body
      const compiledLayout = compileTemplate(emailTemplate.layout, {
        headline: compiledTitle,
        content: compiledBody,
      });

      // Process MJML
      // @todo turn into try ... catch
      const mail = mjml2html(compiledLayout, {
        minify: true,
        validationLevel:
          process.env.NODE_ENV === 'production' ? 'skip' : 'strict',
      });

      if (mail.errors && mail.errors.length >= 1) {
        console.log('MJML errors:', mail.errors);
        return false;
      }

      const emailTemplateData = {
        subject: compiledTitle,
        text: compiledBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html: mail.html,
      };

      await strapi.plugins['email'].services.email.sendTemplatedEmail(
        {
          to: process.env.ADMIN_EMAIL || '',
        },
        emailTemplateData,
      );
    } catch (err) {
      console.log('Error sending email', err);
      return false;
    }

    return true;
  },

  async sendBerlinBookingEmail(berlinBooking: BerlinBooking) {
    try {
      const {
        projectTitle,
        projectDescription,
        associationRegistrationNumber,
        projectWebsite,
        intend,
        personCount,
        start,
        end,
        contactName,
        contactEmail,
        contactPhone,
        resource,
      } = berlinBooking;

      const startDate = format(new Date(start), 'dd.MM.yyyy'); //, HH:mm') + ' Uhr';
      const endDate = format(new Date(end), 'dd.MM.yyyy'); //, HH:mm') + ' Uhr';

      const resourceTitle = resource?.title || 'n/a';

      const templateData = {
        projectTitle,
        projectDescription,
        associationRegistrationNumber,
        projectWebsite,
        intend,
        personCount,
        startDate,
        endDate,
        contactName,
        contactEmail,
        contactPhone,
        resourceTitle,
      };

      // Get email template from database
      const emailTemplate = await getEmailTemplateSingleType(strapi);
      if (!emailTemplate) {
        console.log('Email template single-type not found');
        return false;
      }

      const compiledTitle = compileTemplate(
        emailTemplate.berlinBookingTitle,
        templateData,
      );
      const compiledBody = compileTemplate(
        emailTemplate.berlinBookingBody,
        templateData,
      );

      const compiledLayout = compileTemplate(emailTemplate.layout, {
        headline: compiledTitle,
        content: compiledBody,
      });

      // Process MJML
      // @todo turn into try ... catch
      const mail = mjml2html(compiledLayout, {
        minify: true,
        validationLevel:
          process.env.NODE_ENV === 'production' ? 'skip' : 'strict',
      });

      if (mail.errors && mail.errors.length >= 1) {
        console.log('MJML errors:', mail.errors);
        return false;
      }

      const berlinResourceType = getResourceType(
        resource.resourceTypes,
        ResourceTypeComponent.BERLIN_RESOURCE_TYPE,
      ) as BerlinResourceType;

      if (
        !berlinResourceType ||
        typeof berlinResourceType.contactEmail === 'undefined'
      ) {
        console.log(
          'Error sending Berlin booking email - no resource owner contact email provided',
        );
        return false;
      }

      const emailTemplateData = {
        subject: compiledTitle,
        text: compiledBody.replace(/<[^>]*>/g, ''),
        html: mail.html,
      };

      await strapi.plugins['email'].services.email.sendTemplatedEmail(
        {
          to: berlinResourceType.contactEmail,
          from: process.env.REPLY_EMAIL,
          replyTo: contactEmail,
        },
        emailTemplateData,
      );

      const compiledTitleCopy = compileTemplate(
        emailTemplate.berlinBookingTitleCopy,
        templateData,
      );

      // Copy (not BCC!) to requesting person
      emailTemplateData.subject = compiledTitleCopy;

      await strapi.plugins['email'].services.email.sendTemplatedEmail(
        {
          to: contactEmail,
          from: process.env.REPLY_EMAIL,
        },
        emailTemplateData,
      );

      return true;
    } catch (err) {
      console.log('Error sending Berlin booking email', err);
      return false;
    }
  },

  async sendBerlinRaffleEntryEmail(raffleEntry: BerlinRaffleEntry) {
    try {
      const {
        provider,
        legalEntityType,
        contactPerson,
        address,
        raffleEmail,
        contactPhone,
        resource,
      } = raffleEntry;

      const resourceDocumentId = resource?.documentId || '';

      const berlinResourceType = getResourceType(
        resource?.resourceTypes,
        ResourceTypeComponent.BERLIN_RESOURCE_TYPE,
      ) as BerlinResourceType;

      const roomName = berlinResourceType?.roomName || 'n/a';

      const templateData = {
        provider,
        legalEntityType,
        contactPerson,
        street: address.street,
        zip: address.zip,
        city: address.city,
        raffleEmail,
        contactPhone,
        roomName,
        resourceDocumentId,
      };

      // Get email template from database
      const emailTemplate = await getEmailTemplateSingleType(strapi);
      if (!emailTemplate) {
        console.error('Raffle entry: email template not found');
        return false;
      }

      const compiledTitle = compileTemplate(
        emailTemplate.raffleEntryTitle,
        templateData,
      );
      const compiledBody = compileTemplate(
        emailTemplate.raffleEntryBody,
        templateData,
      );

      const compiledLayout = compileTemplate(emailTemplate.layout, {
        headline: compiledTitle,
        content: compiledBody,
      });

      const mail = mjml2html(compiledLayout, {
        minify: true,
        validationLevel:
          process.env.NODE_ENV === 'production' ? 'skip' : 'strict',
      });

      if (mail.errors && mail.errors.length >= 1) {
        console.error('Raffle entry: MJML errors:', mail.errors);
        return false;
      }

      const emailTemplateData = {
        subject: compiledTitle,
        text: compiledBody.replace(/<[^>]*>/g, ''),
        html: mail.html,
      };

      // Send to engagiertes Berlin team
      await strapi.plugins['email'].services.email.sendTemplatedEmail(
        {
          to: process.env.ADMIN_EMAIL || ''
        },
        emailTemplateData,
      );

      // Prepare copy for raffle participant / provider
      const compiledTitleCopy = compileTemplate(
        emailTemplate.raffleEntryTitleCopy,
        templateData,
      );

      const compiledLayoutCopy = compileTemplate(emailTemplate.layout, {
        headline: compiledTitleCopy,
        content: compiledBody,
      });

      const mailCopy = mjml2html(compiledLayoutCopy, {
        minify: true,
        validationLevel:
          process.env.NODE_ENV === 'production' ? 'skip' : 'strict',
      });

      if (mailCopy.errors && mailCopy.errors.length >= 1) {
        console.error('Raffle entry copy: MJML errors:', mailCopy.errors);
        return false;
      }

      const emailTemplateDataCopy = {
        subject: compiledTitleCopy,
        text: compiledBody.replace(/<[^>]*>/g, ''),
        html: mailCopy.html,
      };

      // send copy to raffle participant / provider
      await strapi.plugins['email'].services.email.sendTemplatedEmail(
        {
          to: raffleEmail,
        },
        emailTemplateDataCopy,
      );

      return true;
    } catch (err) {
      console.error('Error sending raffle entry email:', err);
      return false;
    }
  },
});
