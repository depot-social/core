const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

// Local workspace plugins also resolve dependencies from the Strapi application.
process.env.NODE_PATH = [
  path.join(__dirname, '../node_modules'),
  process.env.NODE_PATH,
]
  .filter(Boolean)
  .join(path.delimiter);
Module._initPaths();

const { compileStrapi, createStrapi } = require('@strapi/strapi');

async function main() {
  const context = await compileStrapi();
  const app = createStrapi(context);
  try {
    await app.load();
    const { applyDefaults, flattenActions } = require(path.join(
      context.distDir,
      'src/setup/defaults.js'
    ));
    const configuration = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../configuration.json'), 'utf8')
    );
    const preset = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../permissions.json'), 'utf8')
    );
    await app.db.transaction(async () =>
      applyDefaults(
        {
          actions: flattenActions(
            app
              .plugin('users-permissions')
              .service('users-permissions')
              .getActions()
          ),
          hasPlugin: (name) => Boolean(app.plugin(name)),
          findRole: (type) =>
            app.db
              .query('plugin::users-permissions.role')
              .findOne({ where: { type }, populate: ['permissions'] }),
          addPermission: (role, action) =>
            app.db
              .query('plugin::users-permissions.permission')
              .create({ data: { role, action } }),
          removePermissions: (role, actions) =>
            app.db
              .query('plugin::users-permissions.permission')
              .deleteMany({ where: { role, action: { $in: actions } } }),
          hasConfiguration: async (key) =>
            Boolean(
              await app.db
                .query('strapi::core-store')
                .findOne({ where: { key } })
            ),
          addConfiguration: (entry) =>
            app.db.query('strapi::core-store').create({ data: entry }),
        },
        configuration,
        preset
      )
    );
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
