/**
 * Problem: Regular PUT /users/:id endpoint is very limited
 * with no support for custom fields.
 *
 * Extend users-permissions plugin to provide a dedicated
 * PATCH /users/me endpoint.
 *
 * Note that using PUT method here would not work.
 *
 * https://github.com/strapi/strapi/blob/708acdef812b5ff4e130861e0728905c2bd643cd/packages/plugins/users-permissions/server/routes/content-api/validation.js#L208
 */
module.exports = (plugin) => {
  plugin.controllers.user.updateMe = async (ctx) => {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized();
      }

      const allowedUpdateFields = plugin.config?.register?.allowedFields ?? [];
      const data = Object.fromEntries(
        Object.entries(ctx.request.body).filter(([key]) =>
          allowedUpdateFields.includes(key),
        ),
      );
      const updatedUser = await strapi
        .documents('plugin::users-permissions.user')
        .update({
          documentId: user.documentId,
          data,
        });
      return ctx.send(updatedUser);
    } catch (err) {
      console.error('Error updating user:', err);
      return ctx.badRequest('Unable to update user.');
    }
  };

  plugin.routes['content-api'].routes.push({
    method: 'PATCH',
    path: '/users/me',
    handler: 'user.updateMe',
    config: {
      prefix: '',
      policies: [],
    },
  });
  return plugin;
};
