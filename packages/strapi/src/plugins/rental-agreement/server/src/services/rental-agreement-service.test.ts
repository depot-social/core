/// <reference types="vitest" />
import type { Core } from '@strapi/strapi';
import type { Booking, Resource, User } from '@depot/shared';
import { afterEach, describe, expect, test } from 'vitest';
import rentalAgreementService from './rental-agreement-service';

const booking = {
  documentId: 'booking-document-id',
  start: '2026-08-21T10:00:00.000Z',
  end: '2026-08-22T10:00:00.000Z',
  bookedUnits: 1,
  price: {
    id: 1,
    title: 'Test price',
    value: 20,
    currency: 'euro',
    duration: 1,
    durationType: 'daily',
    tariffType: 'regular',
    resourceValue: 15,
    depositValue: 3,
    vatValue: 2,
  },
} as Booking;

const resource = {
  title: 'Test resource',
  address: {
    street: 'Teststraße 1',
    zip: '10115',
    place: 'Berlin',
  },
} as Resource;

const user = {
  firstName: 'Test',
  lastName: 'Person',
  username: 'test-person',
  address: {
    street: 'Teststraße 2',
    zip: '10115',
    place: 'Berlin',
  },
} as User;

const originalPricesSetting = process.env.STRAPI_PLUGIN_PRICES;

afterEach(() => {
  if (originalPricesSetting === undefined) {
    delete process.env.STRAPI_PLUGIN_PRICES;
  } else {
    process.env.STRAPI_PLUGIN_PRICES = originalPricesSetting;
  }
});

const generateAgreementText = async (): Promise<string> => {
  const service = rentalAgreementService({ strapi: {} as Core.Strapi });
  const pdf = await service.generateRentalAgreementPdf(booking, resource, user, user);

  return pdf.toString('latin1');
};

describe('rental agreement pricing', () => {
  test('omits price and payment sections when disabled', async () => {
    process.env.STRAPI_PLUGIN_PRICES = 'false';

    const pdfText = await generateAgreementText();

    expect(pdfText).not.toContain('Preis');
    expect(pdfText).not.toContain('Kaution');
    expect(pdfText).not.toContain('Leihpreis');
    expect(pdfText).not.toContain('Gesamt');
  });

  test('keeps price and payment sections when enabled', async () => {
    process.env.STRAPI_PLUGIN_PRICES = 'true';

    const pdfText = await generateAgreementText();

    expect(pdfText).toContain('Preis');
    expect(pdfText).toContain('Kaution');
    expect(pdfText).toContain('Leihpreis');
    expect(pdfText).toContain('Gesamt');
  });
});
