/// <reference types="vitest" />
import { test, describe, assert, expect, vi, afterEach } from 'vitest';
import { geocodeAddress, obfuscateGeodata } from '../functions';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('geocodeAddress', () => {
  test.skipIf(!process.env.PUBLIC_MAPBOX_TOKEN)(
    'geocodeAddress should return correct geocode data for a German address',
    async () => {
      const geocodeAddressResponse = {
        features: [
          {
            center: [13.404954, 52.520008],
          },
        ],
      };

      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce({ json: async () => geocodeAddressResponse })
      );

      const address = {
        street: 'Unter den Linden',
        zip: '10117',
        place: 'Berlin',
      };

      const expected = {
        latitude: 52.520008,
        longitude: 13.404954,
      };

      const result = await geocodeAddress(address);

      expect(fetch).toHaveBeenCalledWith(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${address.street}%20${address.zip}%20${address.place}.json?access_token=${process.env.PUBLIC_MAPBOX_TOKEN}&limit=1&autocomplete=false`
      );

      assert.deepEqual(result, expected);
    }
  );
});

describe('obfuscateGeodata', () => {
  test('Returns undefined if params missing or incorrect', () => {
    const geodata = obfuscateGeodata('NaNumber' as any, 12);
    assert.equal(geodata, undefined);
  });

  test('Returns random obfuscated geodata', () => {
    const geodata = obfuscateGeodata(12.345, 23.456);
    assert.notDeepEqual(geodata, {
      obfuscatedLatitude: 12.345,
      obfuscatedLongitude: 23.456,
    });
  });
});
