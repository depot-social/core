/// <reference types="vitest" />
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  getResourceWebsite,
  normalizeWebsiteUrl,
  WEBSITE_URL_PATTERN,
} from '../functions';

const linkSchema = JSON.parse(
  readFileSync(
    new URL('../../strapi/src/components/custom/link.json', import.meta.url),
    'utf8'
  )
);
const backendPattern = new RegExp(linkSchema.attributes.url.regex);

describe('website URL validation', () => {
  test('keeps the frontend pattern in sync with Strapi', () => {
    expect(WEBSITE_URL_PATTERN.source).toBe(backendPattern.source);
  });

  test.each([
    ['https://example.org', 'https://example.org'],
    ['http://example.org', 'http://example.org'],
    ['www.example.org', 'https://www.example.org'],
    ['example.org', 'https://example.org'],
    [
      'example.org:1337/path?key=value#section',
      'https://example.org:1337/path?key=value#section',
    ],
    [
      'https://sub.example.org/path%20name?next=%2Fother&key=1#section',
      'https://sub.example.org/path%20name?next=%2Fother&key=1#section',
    ],
  ])('accepts %s in both validators', (input, expected) => {
    expect(backendPattern.test(input)).toBe(true);
    expect(normalizeWebsiteUrl(input)).toBe(expected);
  });

  test.each([
    '',
    ' ',
    'javascript:alert(document.domain)',
    'javascript:example.org',
    'javascript://example.org/%0Aalert(1)',
    'data:text/html,example.org',
    'ftp://example.org',
    '//example.org',
    'not a URL example.org text',
    'https://example.org trailing text',
    'https://localhost',
    'https://127.0.0.1',
    'https://example.technology',
  ])('rejects %j in both validators', (input) => {
    expect(backendPattern.test(input)).toBe(false);
    expect(normalizeWebsiteUrl(input)).toBeUndefined();
  });

  test('trims input without serializing or changing an existing absolute URL', () => {
    expect(normalizeWebsiteUrl('  https://example.org/path?key=1  ')).toBe(
      'https://example.org/path?key=1'
    );
  });

  test('rejects a URL the URL parser cannot read', () => {
    expect(normalizeWebsiteUrl('https://example.org:99999')).toBeUndefined();
  });
});

describe('getResourceWebsite', () => {
  const providerLink = { url: 'https://provider.org', title: ' Provider ' };

  test('prefers a resource website and trims its title', () => {
    expect(
      getResourceWebsite({
        links: [{ url: 'https://resource.org', title: ' Resource ' }],
        user: { link: providerLink },
      })
    ).toEqual({ url: 'https://resource.org', label: 'Resource' });
  });

  test('falls back to the provider when the resource website is unsafe', () => {
    expect(
      getResourceWebsite({
        links: [{ url: 'javascript:alert(document.domain)', title: 'Website' }],
        user: { link: providerLink },
      })
    ).toEqual({ url: providerLink.url, label: 'Provider' });
  });

  test('resolves a bare domain without mutating the resource', () => {
    const resource = { links: [{ url: 'www.example.org', title: '' }] };

    expect(getResourceWebsite(resource)).toEqual({
      url: 'https://www.example.org',
      label: 'https://www.example.org',
    });
    expect(resource.links[0].url).toBe('www.example.org');
  });

  test('uses the provider when resource links were not populated', () => {
    expect(getResourceWebsite({ user: { link: providerLink } })).toEqual({
      url: providerLink.url,
      label: 'Provider',
    });
  });

  test('returns no website when both URLs are unsafe or missing', () => {
    expect(getResourceWebsite({})).toBeUndefined();
    expect(
      getResourceWebsite({
        links: [{ url: 'javascript:alert(document.domain)', title: '' }],
        user: { link: { url: 'data:text/html,example.org', title: '' } },
      })
    ).toBeUndefined();
  });
});
