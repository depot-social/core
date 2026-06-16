import path from 'path';

export default ({ env }) => ({
  connection: {
    client: env('DATABASE_TYPE', 'sqlite'),
    connection: env('DATABASE_TYPE', 'sqlite') === 'sqlite' ? {
      filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
    } : {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 3306),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'strapi'),
      // ssl: {
      //   rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false), // For self-signed certificates
      // },
    },
    useNullAsDefault: env('DATABASE_TYPE', 'sqlite') === 'sqlite',
    debug: false, // env('DATABASE_DEBUG', false),
  },
});
