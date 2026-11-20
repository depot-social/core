import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import qs from 'qs';
import { loadPublicResources } from './resources';
import { parseResourcesQuery, buildResourceFilters } from './resourceQueries';

const event = {} as Parameters<typeof loadPublicResources>[0];
const resource = () => ({
  id: 1,
  documentId: 'resource-1',
  title: 'Bohrer',
  slug: 'bohrer',
  description: 'Beschreibung',
  createdAt: '2025-01-01',
  updatedAt: '2026-01-01',
  address: {
    street: 'Allowed location',
    zip: '12345',
    place: 'Berlin',
    latitude: 52,
    longitude: 13,
    user: { email: 'nested-secret' },
  },
  images: [
    {
      id: 1,
      url: '/image.jpg',
      alternativeText: 'Bohrer',
      user: { email: 'image-secret' },
    },
  ],
  categories: [
    {
      id: 2,
      title: 'Werkzeuge',
      resources: [{ user: { email: 'category-secret' } }],
    },
  ],
  availabilities: [
    { id: 3, availableUnits: 1, customer: { email: 'calendar-secret' } },
  ],
  resourceTypes: [],
  user: { id: 99, email: 'user-secret', password: 'password-secret' },
  bookings: [{ customer: { email: 'booking-secret' } }],
  searchIndex: 'hidden-index',
});
const provider = () => ({
  documentId: 'resource-1',
  // Token response must never replace the location from the JWT request.
  address: { street: 'TOKEN PRIVATE LOCATION' },
  user: {
    id: 99,
    firstName: 'Anna',
    lastName: 'Beispiel',
    organizationName: 'Verein',
    createdAt: '2022-04-17T11:23:34Z',
    email: 'user-secret',
    phone: 'phone-secret',
    address: {
      id: 'profile-address-id',
      street: 'PRIVATE PROFILE ADDRESS',
      zip: '10115',
      place: 'Berlin',
      latitude: 52.5,
      longitude: 13.4,
      obfuscatedLatitude: 52.51,
      obfuscatedLongitude: 13.41,
      user: { email: 'address-secret' },
    },
    organization: {
      title: 'Organisation',
      proofDocument: { url: '/private.pdf' },
    },
    link: { url: 'example.org', title: 'Website' },
  },
});

describe('public resources boundary', () => {
  let request: ReturnType<typeof vi.fn>;
  let query: Record<string, unknown>;
  let config: {
    strapiReadToken: string;
    strapi: { url: string };
    public: { activeLayer: string };
  };
  let cookie: string | undefined;
  beforeEach(() => {
    query = {};
    cookie = 'user-jwt';
    config = {
      strapiReadToken: 'PRIVATE SERVICE TOKEN',
      strapi: { url: 'http://strapi' },
      public: { activeLayer: 'base' },
    };
    request = vi
      .fn()
      .mockResolvedValueOnce({
        data: [resource()],
        meta: {
          pagination: { page: 1, pageSize: 16, pageCount: 1, total: 1 },
          user: { email: 'meta-secret' },
        },
      })
      .mockResolvedValue({ data: [provider()], meta: {} });
    vi.stubGlobal('$fetch', request);
    vi.stubGlobal('getQuery', () => query);
    vi.stubGlobal('getCookie', () => cookie);
    vi.stubGlobal('useRuntimeConfig', () => config);
    vi.stubGlobal('setResponseHeader', vi.fn());
    vi.stubGlobal('createError', (input: object) =>
      Object.assign(new Error('Request rejected'), input)
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses separate credentials, projects nested data, and keeps JWT location policy', async () => {
    const response = await loadPublicResources(event);
    expect(request.mock.calls[0]![1].headers).toEqual({
      Authorization: 'Bearer user-jwt',
    });
    expect(request.mock.calls[1]![1].headers).toEqual({
      Authorization: 'Bearer PRIVATE SERVICE TOKEN',
    });
    const firstQuery = qs.parse(request.mock.calls[0]![0].split('?')[1]);
    expect(firstQuery.status).toBe('published');
    expect(JSON.stringify(firstQuery.populate)).not.toContain('user');
    expect(response.data[0]!.provider).toEqual({ isOrganization: true });
    expect(response.data[0]!.address.street).toBe('Allowed location');
    expect(response.meta).toEqual({
      pagination: { page: 1, pageSize: 16, pageCount: 1, total: 1 },
    });
    const payload = JSON.stringify(response);
    for (const secret of [
      'secret',
      'PRIVATE',
      'user',
      'bookings',
      'searchIndex',
      'proofDocument',
    ])
      expect(payload).not.toContain(secret);
    expect(setResponseHeader).toHaveBeenCalledWith(
      event,
      'Cache-Control',
      'private, no-store'
    );
  });

  it('keeps anonymous requests anonymous and exposes only display values on detail pages', async () => {
    cookie = undefined;
    const response = await loadPublicResources(event, { slug: 'bohrer' });
    expect(request.mock.calls[0]![1].headers).toBeUndefined();
    expect(response.data[0]!.provider).toEqual({
      displayName: 'Organisation',
      initials: 'O',
      memberSince: '2022-04',
      website: { url: 'https://example.org', label: 'Website' },
    });
    expect(JSON.stringify(response)).not.toContain('user-secret');
  });

  it('exposes only public provider names before a booking exists', async () => {
    const response = await loadPublicResources(event, {
      documentId: 'resource-1',
    });
    expect(response.data[0]!.provider).toEqual({
      displayName: 'Anna Beispiel',
      organizationName: 'Verein',
    });
  });

  const respondWithAddress = (
    address: unknown,
    preciseLocationAllowedDocumentIds?: string[],
    enriched: unknown = provider()
  ) => {
    request
      .mockReset()
      .mockResolvedValueOnce({
        data: [{ ...resource(), address }],
        meta: preciseLocationAllowedDocumentIds
          ? { locationAccess: { preciseLocationAllowedDocumentIds } }
          : {},
      })
      .mockResolvedValue({ data: [enriched], meta: {} });
  };

  it.each([undefined, 'user-jwt'])(
    'adds only text fields for a missing Ausleihe detail address (JWT: %s)',
    async (jwt) => {
      cookie = jwt;
      config.public.activeLayer = 'berlin-ausleihe';
      // Supplied by Strapi when redaction is disabled or this user is allowed.
      respondWithAddress(null, ['resource-1']);
      const response = await loadPublicResources(event, { slug: 'bohrer' });
      expect(response.data[0]!.displayAddress).toEqual({
        street: 'PRIVATE PROFILE ADDRESS',
        zip: '10115',
      });
      // No profile coordinates or address object may become map input.
      expect(response.data[0]!.address).toBeNull();
      expect(response.meta).toEqual({});
      const payload = JSON.stringify(response);
      for (const excluded of [
        'profile-address-id',
        'latitude',
        'longitude',
        'obfuscatedLatitude',
        'obfuscatedLongitude',
        'address-secret',
        'user-secret',
        'TOKEN PRIVATE LOCATION',
        'locationAccess',
      ])
        expect(payload).not.toContain(excluded);
      const tokenQuery = qs.parse(request.mock.calls[1]![0].split('?')[1]);
      expect(tokenQuery.status).toBe('published');
      expect(tokenQuery.populate).toMatchObject({
        user: { populate: { address: { fields: ['street', 'zip'] } } },
      });
    }
  );

  it('keeps a fallback street hidden when the end-user request denies precise access', async () => {
    config.public.activeLayer = 'berlin-ausleihe';
    respondWithAddress(null, []);
    // Even broader access in the service-token response cannot grant access
    // to a location denied by the primary end-user request.
    request.mockResolvedValue({
      data: [provider()],
      meta: {
        locationAccess: {
          preciseLocationAllowedDocumentIds: ['resource-1'],
        },
      },
    });
    const response = await loadPublicResources(event, { slug: 'bohrer' });
    expect(response.data[0]!.displayAddress).toEqual({ zip: '10115' });
    expect(JSON.stringify(response)).not.toContain('PRIVATE PROFILE ADDRESS');
    expect(response.data[0]!.address).toBeNull();
  });

  it.each([
    { street: 'Resource street', zip: '12345', latitude: 52, longitude: 13 },
    { zip: '12345', obfuscatedLatitude: 52, obfuscatedLongitude: 13 },
    {},
    undefined,
  ])(
    'never replaces a present, redacted, empty, or omitted address: %j',
    async (address) => {
      config.public.activeLayer = 'berlin-ausleihe';
      respondWithAddress(address, ['resource-1']);
      const response = await loadPublicResources(event, { slug: 'bohrer' });
      expect(response.data[0]!.displayAddress).toEqual(
        address ? { street: address.street, zip: address.zip } : null
      );
      expect(JSON.stringify(response)).not.toContain('PRIVATE PROFILE ADDRESS');
      const tokenQuery = qs.parse(request.mock.calls[1]![0].split('?')[1]);
      expect(tokenQuery.populate).not.toHaveProperty('user.populate.address');
    }
  );

  it('omits the fallback when authoritative location metadata is unavailable', async () => {
    config.public.activeLayer = 'berlin-ausleihe';
    respondWithAddress(null);
    const response = await loadPublicResources(event, { slug: 'bohrer' });
    expect(response.data[0]!.displayAddress).toBeNull();
    expect(JSON.stringify(response)).not.toContain('PRIVATE PROFILE ADDRESS');
    const tokenQuery = qs.parse(request.mock.calls[1]![0].split('?')[1]);
    expect(tokenQuery.populate).not.toHaveProperty('user.populate.address');
  });

  it.each([
    { ...provider(), user: null },
    { ...provider(), user: { ...provider().user, address: null } },
  ])(
    'handles missing provider addresses without an additional fallback',
    async (enriched) => {
      config.public.activeLayer = 'berlin-ausleihe';
      respondWithAddress(null, ['resource-1'], enriched);
      const response = await loadPublicResources(event, { slug: 'bohrer' });
      expect(response.data[0]!.displayAddress).toBeNull();
      expect(response.data[0]!.address).toBeNull();
    }
  );

  it.each([
    ['base', { slug: 'bohrer' }],
    ['berlin-raum', { slug: 'bohrer' }],
    ['berlin-ausleihe', {}],
    ['berlin-ausleihe', { documentId: 'resource-1' }],
  ])(
    'limits address enrichment to Ausleihe details (%s, %j)',
    async (layer, lookup) => {
      config.public.activeLayer = layer;
      respondWithAddress(null, ['resource-1']);
      const response = await loadPublicResources(event, lookup);
      expect(response.data[0]).not.toHaveProperty('displayAddress');
      expect(JSON.stringify(response)).not.toContain('PRIVATE PROFILE ADDRESS');
      const tokenQuery = qs.parse(request.mock.calls[1]![0].split('?')[1]);
      expect(tokenQuery.populate).not.toHaveProperty('user.populate.address');
    }
  );

  it('never falls back to broad requests when the token is missing or rejected', async () => {
    config.strapiReadToken = '';
    await expect(loadPublicResources(event)).rejects.toMatchObject({
      statusCode: 503,
    });
    expect(request).not.toHaveBeenCalled();
    config.strapiReadToken = 'PRIVATE SERVICE TOKEN';
    request
      .mockReset()
      .mockResolvedValueOnce({ data: [resource()], meta: {} })
      .mockRejectedValue({
        statusCode: 403,
        data: { token: config.strapiReadToken },
      });
    await expect(loadPublicResources(event)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Unable to load resources',
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('preserves end-user authorization failures and handles missing resources', async () => {
    request.mockReset().mockRejectedValue({ statusCode: 403 });
    await expect(loadPublicResources(event)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(request).toHaveBeenCalledOnce();
    request.mockReset().mockResolvedValue({ data: [], meta: {} });
    await expect(
      loadPublicResources(event, { slug: 'missing' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('bounds enrichment batches and ignores unrequested resource identifiers', async () => {
    const resources = Array.from({ length: 101 }, (_, index) => ({
      ...resource(),
      documentId: `resource-${index}`,
    }));
    query = { pageSize: '1000' };
    request
      .mockReset()
      .mockResolvedValueOnce({ data: resources, meta: {} })
      .mockResolvedValue({
        data: [{ ...provider(), documentId: 'unrequested' }],
        meta: {},
      });
    const response = await loadPublicResources(event);
    expect(request).toHaveBeenCalledTimes(3);
    expect(response.data.every((entry) => entry.provider === null)).toBe(true);
  });

  it.each([
    { populate: 'user' },
    { fields: 'email' },
    { filters: { user: 3 } },
    { status: 'draft' },
    { q: ['one', 'two'] },
    { pageSize: '1001' },
    { page: '-1' },
    { categoryIds: '1,$eq' },
    { categoryIds: '9007199254740992' },
    { sort: 'user.email' },
  ])('rejects unapproved query input %j', async (input) => {
    query = input;
    await expect(loadPublicResources(event)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('preserves layer-specific search and explicit filter semantics', () => {
    const input = parseResourcesQuery({
      q: '  Bohr  ',
      categoryIds: '1,2',
      districtIds: '3',
      pageSize: '1000',
    });
    expect(input.pageSize).toBe(1000);
    expect(buildResourceFilters(input, 'berlin-ausleihe')).toEqual({
      categories: { id: { $in: [1, 2] } },
      district: { id: { $in: [3] } },
      searchIndex: { $containsi: 'Bohr' },
    });
    expect(buildResourceFilters({ q: 'ab' }, 'berlin-raum')).toEqual({});
    expect(buildResourceFilters({ q: 'ab' }, 'base')).toEqual({
      $or: [
        { title: { $contains: 'ab' } },
        { description: { $contains: 'ab' } },
      ],
    });
  });
});
