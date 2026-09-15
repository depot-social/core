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
