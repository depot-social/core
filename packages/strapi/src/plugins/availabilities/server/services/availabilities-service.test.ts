/// <reference types="vitest" />
import type { Core } from '@strapi/strapi';
import type { Availability, Resource } from '@depot/shared';
import { describe, expect, test, vi } from 'vitest';
import createAvailabilitiesService from './availabilities-service';

const bookingStart = new Date('2026-09-21T10:00:00.000Z');
const bookingEnd = new Date('2026-09-21T14:00:00.000Z');

const availability = (
  availableUnits: number,
  start: string,
  end: string | null
): Availability =>
  ({
    id: availableUnits,
    documentId: `availability-${availableUnits}`,
    title: 'Availability',
    availableUnits,
    start,
    end,
  } as Availability);

const createService = (resource: Partial<Resource> | null) => {
  const findResource = vi.fn().mockResolvedValue(resource);
  const findBookings = vi.fn().mockResolvedValue([]);
  const strapi = {
    documents: vi.fn((uid: string) =>
      uid === 'api::resource.resource'
        ? { findOne: findResource }
        : { findMany: findBookings }
    ),
  };

  return {
    findBookings,
    findResource,
    service: createAvailabilitiesService({
      strapi: strapi as unknown as Core.Strapi,
    }),
  };
};

describe('availabilities service default availability', () => {
  test('keeps the finite overlap cases and adds a bounded permanent-default case', () => {
    const { service } = createService(null);

    expect(
      service.populateTimespanFilter(
        bookingStart.toISOString(),
        bookingEnd.toISOString()
      )
    ).toEqual({
      $or: [
        {
          $and: [
            { start: { $lte: bookingStart.toISOString() } },
            { end: { $gte: bookingEnd.toISOString() } },
          ],
        },
        {
          $and: [
            { start: { $lte: bookingStart.toISOString() } },
            { end: { $gte: bookingStart.toISOString() } },
            { end: { $lte: bookingEnd.toISOString() } },
          ],
        },
        {
          $and: [
            { start: { $gte: bookingStart.toISOString() } },
            { start: { $lte: bookingEnd.toISOString() } },
            { end: { $gte: bookingEnd.toISOString() } },
          ],
        },
        {
          $and: [
            { start: { $gte: bookingStart.toISOString() } },
            { end: { $lte: bookingEnd.toISOString() } },
          ],
        },
        {
          $and: [
            { start: { $lte: bookingEnd.toISOString() } },
            { end: { $null: true } },
          ],
        },
      ],
    });
  });

  test('uses a null-ended default availability as the baseline capacity', async () => {
    const { service } = createService({
      documentId: 'resource-document-id',
      availabilities: [availability(5, '2026-09-01T00:00:00.000Z', null)],
    });
    const ctx = { throw: vi.fn() };

    await expect(
      service.getMaxAvailable(
        ctx as never,
        bookingStart,
        bookingEnd,
        'resource-document-id'
      )
    ).resolves.toBe(5);
  });

  test('uses the lowest capacity from the default and overlapping overrides', async () => {
    const { service } = createService({
      documentId: 'resource-document-id',
      availabilities: [
        availability(5, '2026-09-01T00:00:00.000Z', null),
        availability(2, '2026-09-21T12:00:00.000Z', '2026-09-21T13:00:00.000Z'),
      ],
    });
    const ctx = { throw: vi.fn() };

    await expect(
      service.getMaxAvailable(
        ctx as never,
        bookingStart,
        bookingEnd,
        'resource-document-id'
      )
    ).resolves.toBe(2);
  });

  test('returns zero until a legacy resource gains a default availability', async () => {
    const { service } = createService({
      documentId: 'resource-document-id',
      availabilities: [
        availability(5, '2026-09-21T10:00:00.000Z', '2026-09-21T14:00:00.000Z'),
      ],
    });
    const ctx = { throw: vi.fn() };

    await expect(
      service.getMaxAvailable(
        ctx as never,
        bookingStart,
        bookingEnd,
        'resource-document-id'
      )
    ).resolves.toBe(0);
  });
});
