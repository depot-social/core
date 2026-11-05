import type { Core } from '@strapi/strapi';
import { describe, expect, test, vi } from 'vitest';
import policy from './isBookingPartyPolicy';

describe('booking detail access', () => {
  test.each([23, 17, 99])(
    'checks saved parties for user %s',
    async (userId) => {
      const strapi = {
        documents: () => ({
          findOne: vi
            .fn()
            .mockResolvedValue({
              customer: { id: 23 },
              resourceOwner: { id: 17 },
            }),
        }),
      };
      const action = policy(
        {
          params: { id: 'booking-42' },
          state: { user: { id: userId }, isAuthenticated: true },
        },
        {},
        { strapi: strapi as unknown as Core.Strapi }
      );
      if (userId === 99) await expect(action).rejects.toThrow('not authorized');
      else await expect(action).resolves.toBe(true);
    }
  );
  test('missing booking is a 404 error rather than a forbidden error', async () => {
    const strapi = {
      documents: () => ({ findOne: vi.fn().mockResolvedValue(null) }),
    };
    await expect(
      policy(
        {
          params: { id: 'missing' },
          state: { user: { id: 23 }, isAuthenticated: true },
        },
        {},
        { strapi: strapi as unknown as Core.Strapi }
      )
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });
});
