import type { Core } from '@strapi/strapi';
import type { EmailsService } from './services/emails-service';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const emailsService: EmailsService = strapi
    .plugin('emails')
    .service('emailsService');

  // Keep registration and reset password emails (users-permissions)
  // in sync with the email-template singleType
  const syncAuthEmailTemplates = async () => {
    await emailsService.syncAuthEmailTemplates();
  };

  strapi.db.lifecycles.subscribe({
    models: ['plugin::emails.email-template'],
    afterCreate: syncAuthEmailTemplates,
    afterUpdate: syncAuthEmailTemplates,
  });

  await syncAuthEmailTemplates();
};
