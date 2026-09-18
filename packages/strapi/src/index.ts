// import { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   *
   * Note that many types on "Strapi" are not complete, so we gotta use "any" to avoid
   * type errors. This is hopefully resolved in one of the upcoming releases.
   */
  async bootstrap(/*{ strapi }: { strapi: Core.Strapi }*/) {},
};
