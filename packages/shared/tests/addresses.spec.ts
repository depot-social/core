/// <reference types="vitest" />
import { test, describe, assert, expect, vi, MockInstance } from 'vitest';
import { geocodeAddress, obfuscateGeodata } from '../functions';

global.fetch = vi.fn();

const createFetchResponse = (data) => ({
  json: () => new Promise((resolve) => resolve(data)),
});

describe('geocodeAddress', () => {
  test('geocodeAddress should return correct geocode data for a German address', async () => {
    const geocodeAddressResponse = {
      features: [
        {
          center: [13.404954, 52.520008],
        },
      ],
    };

    (fetch as unknown as MockInstance).mockResolvedValueOnce(
      createFetchResponse(geocodeAddressResponse)
    );

    const address = {
      street: 'Unter den Linden',
      zip: '10117',
      place: 'Berlin',
    };

    const expected = {
      latitude: 13.404954,
      longitude: 52.520008,
    };

    const result = await geocodeAddress(address);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${address.street}%20${address.zip}%20${address.place}.json?access_token=${process.env.PUBLIC_MAPBOX_TOKEN}&limit=1&autocomplete=false`
    );

    assert.deepEqual(result, expected);
  });
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
