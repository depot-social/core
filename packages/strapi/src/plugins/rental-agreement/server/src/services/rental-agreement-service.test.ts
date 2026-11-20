/// <reference types="vitest" />
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Core } from '@strapi/strapi';
import type { Booking, Resource, User } from '@depot/shared';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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

interface PdfSettings {
  pdfAppName?: string;
  pdfLogoPath?: string;
}

const generateAgreementText = async (
  settings: PdfSettings = {},
  { appRoot = process.cwd(), warn = vi.fn() } = {}
): Promise<string> => {
  const strapi = {
    plugin: () => ({ config: (key: keyof PdfSettings) => settings[key] }),
    dirs: { app: { root: appRoot } },
    log: { warn },
  } as unknown as Core.Strapi;
  const service = rentalAgreementService({ strapi });
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

describe('rental agreement app name', () => {
  test('uses the configured name in the introduction and footer', async () => {
    const pdfText = await generateAgreementText({ pdfAppName: '  Stadtteil-Verleih  ' });

    expect(pdfText).toContain('unter Stadtteil-Verleih für');
    expect(pdfText).toContain('via Stadtteil-Verleih');
  });

  test.each([undefined, '', '  '])('uses the default name for %j', async (pdfAppName) => {
    const pdfText = await generateAgreementText({ pdfAppName });

    expect(pdfText).toContain('unter depot.social für');
    expect(pdfText).toContain('via depot.social');
  });
});

describe('rental agreement logo', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="20"><rect width="50" height="20" fill="red"/></svg>';
  let appRoot: string;

  beforeEach(async () => {
    appRoot = await mkdtemp(join(tmpdir(), 'depot-rental-agreement-'));
  });

  afterEach(async () => {
    await rm(appRoot, { recursive: true, force: true });
  });

  test('embeds PNG data from an absolute path', async () => {
    const pdfLogoPath = join(appRoot, 'logo.png');
    await sharp(Buffer.from(svg)).png().toFile(pdfLogoPath);

    const pdfText = await generateAgreementText({ pdfLogoPath }, { appRoot });

    expect(pdfText).toContain('/Subtype /Image');
  });

  test('embeds SVG data from a relative path and detects the format by content', async () => {
    await writeFile(join(appRoot, 'logo'), svg);

    const pdfText = await generateAgreementText({ pdfLogoPath: ' logo ' }, { appRoot });

    expect(pdfText).toContain('/Subtype /Image');
  });

  test('skips the logo silently when the path is blank', async () => {
    const warn = vi.fn();
    const pdfText = await generateAgreementText({ pdfLogoPath: '  ' }, { appRoot, warn });

    expect(pdfText).not.toContain('/Subtype /Image');
    expect(warn).not.toHaveBeenCalled();
  });

  test.each(['missing', 'invalid'])('warns and skips a %s logo file', async (kind) => {
    const pdfLogoPath = `${kind}.png`;
    const filePath = join(appRoot, pdfLogoPath);
    if (kind === 'invalid') await writeFile(filePath, 'invalid image');

    const warn = vi.fn();
    const pdfText = await generateAgreementText({ pdfLogoPath }, { appRoot, warn });

    expect(pdfText).toContain('Verleihvertrag');
    expect(pdfText).not.toContain('/Subtype /Image');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(`${filePath}: `));
  });
});
