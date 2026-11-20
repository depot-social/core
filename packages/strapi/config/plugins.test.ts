/// <reference types="vitest" />
import { describe, expect, test } from 'vitest';
import plugins from './plugins';

describe('Prices plugin configuration', () => {
  test('disables the plugin for the string environment value false', () => {
    const configuration = plugins({
      env: (name: string) =>
        name === 'STRAPI_PLUGIN_PRICES' ? 'false' : undefined,
    });

    expect(configuration.prices.enabled).toBe(false);
  });

  test('keeps pricing enabled by default', () => {
    const configuration = plugins({
      env: () => undefined,
    });

    expect(configuration.prices.enabled).toBe(true);
  });
});

describe('Rental agreement plugin configuration', () => {
  test('passes PDF branding from the environment to the plugin', () => {
    const values: Record<string, string> = {
      PDF_APP_NAME: 'Stadtteil-Verleih',
      PDF_LOGO_PATH: 'branding/logo.svg',
    };
    const configuration = plugins({ env: (name: string) => values[name] });

    expect(configuration['rental-agreement'].config).toEqual({
      pdfAppName: 'Stadtteil-Verleih',
      pdfLogoPath: 'branding/logo.svg',
    });
  });
});
