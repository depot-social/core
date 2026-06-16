module.exports = {
  apps: [
    {
      name: 'default',
      cwd: __dirname,
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'default',
        PORT: 1337,
        PUBLIC_STRAPI_URL: 'http://127.0.0.1:1337',
      },
    },
/*    {
      name: 'site1',
      cwd: __dirname,
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'site1',
        PORT: 4338,
        PUBLIC_STRAPI_URL: 'http://127.0.0.1:4338',
        DATABASE_NAME: 'strapi_site1',
      },
    },*/
  ],
};
