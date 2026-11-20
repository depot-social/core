import { describe, expect, it, vi } from 'vitest';
import type { Booking } from '@depot/shared';
import type { Core } from '@strapi/strapi';
import { loadBookingView } from './booking-view';

const fixture = (status: Booking['bookingStatus'] = 'requested') => ({
  id: 42,
  documentId: 'booking-42',
  bookingStatus: status,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  start: '2026-02-01',
  end: '2026-02-02',
  bookedUnits: 1,
  title: 'Bohrer',
  commentCustomer: null,
  customer: {
    id: 23,
    firstName: 'Kunde',
    lastName: 'Beispiel',
    email: 'customer@example.org',
    organizationName: '',
    password: 'PRIVATE',
    address: { street: 'PROFILE PRIVATE' },
  },
  resourceOwner: {
    id: 17,
    firstName: 'Owner',
    lastName: 'Beispiel',
    email: 'owner@example.org',
    organizationName: 'Verein',
    role: { name: 'PRIVATE ROLE' },
  },
  resource: {
    id: 73,
    documentId: 'resource-73',
    title: 'Bohrer',
    slug: 'bohrer',
    description: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    user: { email: 'NESTED PRIVATE' },
    resourceTypes: [],
    address: { street: 'Resource street', zip: '12345', place: 'Berlin' },
  },
  customerAddress: {
    street: 'BOOKING ADDRESS',
    zip: '12345',
    place: 'Berlin',
    user: { password: 'PRIVATE' },
  },
  privateExtra: { email: 'PRIVATE EXTRA' },
});

const setup = (status?: Booking['bookingStatus']) => {
  const booking = fixture(status);
  const findOne = vi.fn().mockResolvedValue(booking);
  const strapi = {
    db: { query: () => ({ findOne }) },
  } as unknown as Core.Strapi;
  const sanitize = vi.fn(async (entry: Booking) => ({
    ...entry,
    customer: undefined,
    resourceOwner: undefined,
  }));
  return { strapi, findOne, sanitize };
};

describe('authorized booking projection without general user permissions', () => {
  it.each(['requested', 'confirmed', 'cancelled'] as const)(
    'returns both minimal parties for owner and customer in status %s',
    async (status) => {
      for (const userId of [17, 23]) {
        const { strapi, sanitize } = setup(status);
        const view = await loadBookingView(
          strapi,
          'booking-42',
          userId,
          sanitize
        );
        expect(Object.keys(view.customer).sort()).toEqual([
          'email',
          'firstName',
          'id',
          'lastName',
          'organizationName',
        ]);
        expect(Object.keys(view.resourceOwner).sort()).toEqual([
          'email',
          'firstName',
          'id',
          'lastName',
          'organizationName',
        ]);
        expect(view.resourceOwner.organizationName).toBe('Verein');
        expect(view.customerAddress.street).toBe('BOOKING ADDRESS');
        expect(view.resource.address.street).toBe('Resource street');
        expect(JSON.stringify(view)).not.toContain('PRIVATE');
        expect(view.resource).not.toHaveProperty('user');
        expect(sanitize).toHaveBeenCalledOnce();
      }
    }
  );
  it('checks authorization before sanitizing or emitting the view', async () => {
    const { strapi, findOne, sanitize } = setup();
    await expect(
      loadBookingView(strapi, 'booking-42', NaN, sanitize)
    ).rejects.toMatchObject({ name: 'ForbiddenError' });
    expect(findOne).not.toHaveBeenCalled();
    await expect(
      loadBookingView(strapi, 'booking-42', 99, sanitize)
    ).rejects.toMatchObject({ name: 'ForbiddenError' });
    expect(sanitize).not.toHaveBeenCalled();
  });
  it.each([17, 23])(
    'restricts populated resources to the published version for booking party %s',
    async (userId) => {
      const { strapi, findOne, sanitize } = setup();
      const booking = fixture();
      const publishedPrice = {
        id: 11,
        title: 'Published price',
        value: 10,
        currency: 'euro',
        duration: 1,
        durationType: 'daily',
        tariffType: 'regular',
        resourceValue: 10,
        depositValue: 0,
        vatValue: 0,
      };
      const publishedResource = {
        ...booking.resource,
        id: 74,
        publishedAt: '2026-01-01T00:00:00Z',
        description: 'Published description',
        address: { street: 'Published street', zip: '12345', place: 'Berlin' },
        prices: [publishedPrice],
      };
      findOne.mockResolvedValueOnce({
        ...booking,
        resource: publishedResource,
      });

      const view = await loadBookingView(
        strapi,
        'booking-42',
        userId,
        sanitize
      );

      // A booking can link both physical rows of a draft/published document.
      // The query must exclude drafts before the to-one populate picks a row.
      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          populate: expect.objectContaining({
            resource: expect.objectContaining({
              where: { publishedAt: { $notNull: true } },
            }),
          }),
        })
      );
      expect(view.resource.id).toBe(74);
      expect(view.resource.description).toBe('Published description');
      expect(view.resource.address.street).toBe('Published street');
      expect(view.resource.prices?.[0]?.value).toBe(10);
      expect(view.customerAddress.street).toBe('BOOKING ADDRESS');
    }
  );
  it('does not fall back to a draft when the resource has no published version', async () => {
    const { strapi, findOne, sanitize } = setup();
    // The filtered to-one populate returns null if every linked row is a draft.
    findOne.mockResolvedValueOnce({ ...fixture(), resource: null });

    await expect(
      loadBookingView(strapi, 'booking-42', 23, sanitize)
    ).rejects.toMatchObject({ name: 'ValidationError' });
    expect(findOne).toHaveBeenCalledOnce();
    expect(sanitize).not.toHaveBeenCalled();
  });
  it('handles deleted bookings and missing relations', async () => {
    const { strapi, findOne, sanitize } = setup();
    findOne.mockResolvedValueOnce(null);
    await expect(
      loadBookingView(strapi, 'missing', 17, sanitize)
    ).rejects.toMatchObject({ name: 'NotFoundError' });
    findOne.mockResolvedValueOnce({ ...fixture(), resourceOwner: null });
    await expect(
      loadBookingView(strapi, 'booking-42', 23, sanitize)
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });
  it('fails closed if sanitization produces an unexpected response shape', async () => {
    const { strapi } = setup();
    await expect(
      loadBookingView(strapi, 'booking-42', 17, async () => ({
        resource: { user: { password: 'PRIVATE' } },
      }))
    ).rejects.toMatchObject({ name: 'ApplicationError' });
  });
  it('preserves nullable resource-price durations independently of the stored booking price', async () => {
    const { strapi, findOne, sanitize } = setup();
    const booking = fixture();
    const price = {
      id: 1,
      title: null,
      value: 10,
      currency: 'euro',
      duration: 2,
      durationType: 'daily',
      tariffType: 'regular',
      resourceValue: 10,
      depositValue: null,
      vatValue: null,
    };
    findOne.mockResolvedValueOnce({
      ...booking,
      price,
      resource: { ...booking.resource, prices: [{ ...price, duration: null }] },
    });
    const view = await loadBookingView(strapi, 'booking-42', 17, sanitize);
    expect(view.price?.duration).toBe(2);
    expect(view.resource.prices?.[0]?.duration).toBeNull();
  });
});
