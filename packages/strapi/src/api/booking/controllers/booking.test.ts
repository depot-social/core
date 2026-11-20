import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BookingStatusError } from '../utils/booking-status';

const {
  updateStatus,
  sanitizeOutput,
  transformResponse,
  findOne,
  create,
  validateQuery,
} = vi.hoisted(() => ({
  updateStatus: vi.fn(),
  sanitizeOutput: vi.fn(async (data) => ({ ...data, customer: undefined })),
  transformResponse: vi.fn((data) => ({ data })),
  findOne: vi.fn(),
  create: vi.fn(),
  validateQuery: vi.fn(),
}));
vi.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController: (_uid, build) => {
      const controller = build({
        strapi: {
          service: () => ({ updateStatus }),
          db: { query: () => ({ findOne }) },
        },
      });
      Object.assign(controller, {
        sanitizeOutput,
        transformResponse,
        validateQuery,
      });
      Object.setPrototypeOf(controller, { create });
      return controller;
    },
  },
}));
import controller from './booking';

describe('public booking controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOne.mockResolvedValue({
      id: 42,
      documentId: 'booking-42',
      bookingStatus: 'confirmed',
      start: '2026-01-01',
      end: '2026-01-02',
      createdAt: '2025-12-01',
      updatedAt: '2025-12-01',
      bookedUnits: 1,
      title: 'Bohrer',
      commentCustomer: null,
      resource: {
        id: 1,
        documentId: 'resource-1',
        title: 'Bohrer',
        slug: 'bohrer',
        description: '',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      customer: {
        id: 23,
        firstName: 'Kunde',
        lastName: 'Beispiel',
        email: 'kunde@example.org',
        organizationName: '',
        password: 'private',
      },
      resourceOwner: {
        id: 17,
        firstName: 'Owner',
        lastName: 'Beispiel',
        email: 'owner@example.org',
        organizationName: 'Verein',
        password: 'private',
      },
    });
    create.mockResolvedValue({ data: { documentId: 'booking-42' } });
  });
  const context = () => ({
    params: { id: 'booking-42' },
    state: { user: { id: 17 } },
    request: { body: { data: { bookingStatus: 'confirmed' } } },
    throw: (status: number, message: string) => {
      throw Object.assign(new Error(message), { status });
    },
  });

  test('passes only the public action to the service and sanitizes the response', async () => {
    updateStatus.mockResolvedValue({
      documentId: 'booking-42',
      bookingStatus: 'confirmed',
      customer: { password: 'private' },
    });
    const ctx = context();
    const result = await controller.update(ctx);
    expect(updateStatus).toHaveBeenCalledWith('booking-42', 17, {
      bookingStatus: 'confirmed',
    });
    expect(sanitizeOutput).toHaveBeenCalledWith(expect.any(Object), ctx);
    expect(result).toMatchObject({
      data: {
        documentId: 'booking-42',
        bookingStatus: 'confirmed',
        customer: { id: 23, email: 'kunde@example.org' },
        resourceOwner: { id: 17, organizationName: 'Verein' },
      },
    });
    expect(JSON.stringify(result)).not.toContain('private');
  });
  test.each(['findOne', 'create'] as const)(
    '%s returns the same authorized party contract',
    async (action) => {
      const result = await controller[action](context());
      expect(result.data.customer).toEqual({
        id: 23,
        firstName: 'Kunde',
        lastName: 'Beispiel',
        email: 'kunde@example.org',
        organizationName: '',
      });
      expect(result.data.resourceOwner.id).toBe(17);
      expect(sanitizeOutput).toHaveBeenCalledOnce();
    }
  );
  test.each([400, 403, 404, 409])(
    'preserves status %s from validation',
    async (status) => {
      updateStatus.mockRejectedValue(
        new BookingStatusError(status, 'Rejected action')
      );
      await expect(controller.update(context())).rejects.toMatchObject({
        status,
      });
    }
  );
  test('public deletion is forbidden', async () => {
    await expect(controller.delete(context())).rejects.toMatchObject({
      status: 403,
    });
    expect(updateStatus).not.toHaveBeenCalled();
  });
});
