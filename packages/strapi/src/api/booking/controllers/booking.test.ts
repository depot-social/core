import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BookingStatusError } from '../utils/booking-status';

const { updateStatus, sanitizeOutput, transformResponse } = vi.hoisted(() => ({
  updateStatus: vi.fn(),
  sanitizeOutput: vi.fn(async (data) => ({ ...data, customer: undefined })),
  transformResponse: vi.fn((data) => ({ data })),
}));
vi.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController: (_uid, create) => ({
      ...create({ strapi: { service: () => ({ updateStatus }) } }),
      sanitizeOutput,
      transformResponse,
    }),
  },
}));
import controller from './booking';

describe('public booking controller', () => {
  beforeEach(() => vi.clearAllMocks());
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
    expect(result).toEqual({
      data: {
        documentId: 'booking-42',
        bookingStatus: 'confirmed',
        customer: undefined,
      },
    });
  });
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
