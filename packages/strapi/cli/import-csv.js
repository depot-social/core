var strapi = require('@strapi/strapi');

strapi()
  .load()
  .then(async (strapiInstance) => {
    // ERROR: "field.uuid" is not defined
    // -> use src/index.ts.bootstrap
    return;
    await strapiInstance
      .plugin('import-csv')
      .service('importCSVService')
      .importCSV();

    strapiInstance.server.destroy();
    strapiInstance.stop(0);
  });
