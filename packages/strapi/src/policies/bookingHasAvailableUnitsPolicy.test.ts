/// <reference types="vitest" />
import { describe, expect, test, vi } from 'vitest';
import bookingHasAvailableUnitsPolicy from './bookingHasAvailableUnitsPolicy';

describe('bookingHasAvailableUnitsPolicy', () => {
  test('uses a string resource documentId throughout booking creation', async () => {
    const resourceDocumentId = 'yeb23930423324';
    const getMaxAvailable = vi.fn().mockResolvedValue(2);
    const findResource = vi.fn().mockResolvedValue({
      documentId: resourceDocumentId,
      user: { id: 17 },
    });
    const body = {
      data: {
        start: '2026-08-12T10:00:00.000Z',
        end: '2026-08-12T12:00:00.000Z',
        bookedUnits: 1,
        resource: { id: resourceDocumentId },
      },
    };
    const strapi = {
      plugin: vi.fn().mockReturnValue({
        service: vi.fn().mockReturnValue({ getMaxAvailable }),
      }),
      documents: vi.fn().mockReturnValue({ findOne: findResource }),
    };

    const result = await bookingHasAvailableUnitsPolicy(
      {
        state: {
          user: { id: 23 },
          route: { method: 'POST' },
          isAuthenticated: true,
        },
        request: { body },
        params: {},
      },
      {},
      { strapi } as any,
    );

    expect(result).toBe(true);
    expect(body.data.resource).toEqual({ documentId: resourceDocumentId });
    expect(getMaxAvailable).toHaveBeenCalledWith(
      expect.anything(),
      new Date(body.data.start),
      new Date(body.data.end),
      resourceDocumentId,
      undefined,
    );
    expect(findResource).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: resourceDocumentId }),
    );
    expect(body.data).toMatchObject({
      customer: 23,
      resourceOwner: 17,
    });
  });
});
