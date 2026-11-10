import { describe, expect, test } from 'vitest';
import plugins from './plugins';

function environment(values: Record<string, string> = {}) {
  return Object.assign(
    (key: string, fallback?: string) => values[key] ?? fallback,
    {
      int: (key: string, fallback: number) => Number(values[key] ?? fallback),
    }
  );
}

describe('Local plugin configuration', () => {
  test.each([
    ['plugin-availabilities', 'STRAPI_PLUGIN_AVAILABILITIES'],
    ['conversations', 'STRAPI_PLUGIN_CONVERSATIONS'],
    ['prices', 'STRAPI_PLUGIN_PRICES'],
    ['emails', 'STRAPI_PLUGIN_EMAILS'],
    ['rental-agreement', 'STRAPI_PLUGIN_RENTAL_AGREEMENT'],
    ['search', 'STRAPI_PLUGIN_SEARCH'],
  ] as const)(
    '%s respects string flags and defaults to enabled',
    (plugin, variable) => {
      expect(
        plugins({ env: environment({ [variable]: 'false' }) })[plugin].enabled
      ).toBe(false);
      expect(
        plugins({ env: environment({ [variable]: 'true' }) })[plugin].enabled
      ).toBe(true);
      expect(plugins({ env: environment() })[plugin].enabled).toBe(true);
    }
  );
});

describe('SMTP configuration', () => {
  test('uses a numeric port and no authentication for Mailpit', () => {
    const { providerOptions } = plugins({
      env: environment({
        SMTP_HOST: 'mailpit',
        SMTP_PORT: '1025',
        SMTP_USERNAME: '',
        SMTP_PASSWORD: '',
      }),
    }).email.config;
    expect(providerOptions).toEqual({ host: 'mailpit', port: 1025 });
  });

  test('keeps SMTP credentials and the default port', () => {
    const { providerOptions } = plugins({
      env: environment({
        SMTP_HOST: 'smtp.example.org',
        SMTP_USERNAME: 'user',
        SMTP_PASSWORD: 'secret',
      }),
    }).email.config;
    expect(providerOptions).toEqual({
      host: 'smtp.example.org',
      port: 587,
      auth: { user: 'user', pass: 'secret' },
    });
  });

  test('does not attempt authentication with incomplete credentials', () => {
    expect(
      plugins({ env: environment({ SMTP_USERNAME: 'user' }) }).email.config
        .providerOptions
    ).not.toHaveProperty('auth');
  });
});
