/// <reference types="vitest" />
import { test, assert, expect, vi } from 'vitest';
import createPricesService, { calculatePrice } from '../services/prices-service';
import { PriceTariffType } from '@depot/shared';

test('calculatePrice, daily price, 1 unit, 1 day', () => {
  const price = {
    value: 100,
    currency: 'euro',
    durationType: 'daily',
    tariffType: PriceTariffType.REGULAR,
    depositValue: 10,
    vatValue: 5,
  };

  const resource = {
    title: 'Hello world',
  };

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 1);

  const units = 1;

  const result = calculatePrice(price, start, end, units, resource);
  assert.equal(result.value, 115);
});

test('calculatePrice, daily price, 1 unit, 2 days', () => {
  const price = {
    value: 100,
    currency: 'euro',
    durationType: 'daily',
    tariffType: PriceTariffType.REGULAR,
    depositValue: 10,
    vatValue: 5,
  };

  const resource = {
    title: 'Hello world',
  };

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 1);
  end.setMinutes(end.getMinutes() + 1);

  const units = 1;

  const result = calculatePrice(price, start, end, units, resource);

  assert.equal(result.value, 220);
});

test('calculatePrice, hourly price, 1 unit, 1 hour', () => {
  const price = {
    value: 100,
    currency: 'euro',
    durationType: 'hourly',
    tariffType: PriceTariffType.REGULAR,
    depositValue: 10,
    vatValue: 5,
  };

  const resource = {
    title: 'Hello world',
  };

  const start = new Date();
  const end = new Date();
  end.setHours(end.getHours() + 1);
  end.setMinutes(end.getMinutes() - 30);

  const units = 1;

  const result = calculatePrice(price, start, end, units, resource);
  console.log('RES', start, end, result);
  assert.equal(result.value, 115);
});

test('calculatePrice, hourly price, 1 unit, 10 hours', () => {
  const price = {
    value: 100,
    currency: 'euro',
    durationType: 'hourly',
    tariffType: PriceTariffType.REGULAR,
    depositValue: 10,
    vatValue: 10,
  };

  const resource = {
    title: 'Hello world',
  };

  const start = new Date();
  const end = new Date();
  end.setHours(end.getHours() + 10);
  //end.setMinutes(end.getMinutes() - 30);

  const units = 1;

  // @todo test VAT & co.
  const result = calculatePrice(price, start, end, units, resource);
  assert.equal(result.value, 1110);
});

test('getPrice looks up an authenticated user by numeric database ID', async () => {
  const findResource = vi.fn().mockResolvedValue({
    title: 'Test resource',
    prices: [
      {
        id: 1,
        title: 'Regular',
        value: 100,
        currency: 'euro',
        duration: 0,
        durationType: 'daily',
        tariffType: PriceTariffType.REGULAR,
        resourceValue: 0,
        depositValue: 0,
        vatValue: 0,
      },
      {
        id: 2,
        title: 'Non-profit',
        value: 50,
        currency: 'euro',
        duration: 0,
        durationType: 'daily',
        tariffType: PriceTariffType.NOT_FOR_PROFIT,
        resourceValue: 0,
        depositValue: 0,
        vatValue: 0,
      },
    ],
  });
  const findUser = vi.fn().mockResolvedValue({
    id: 42,
    documentId: 'user-document-id',
    organization: { isApproved: true },
  });
  const query = vi.fn().mockReturnValue({ findOne: findUser });
  const strapi = {
    documents: vi.fn().mockReturnValue({ findOne: findResource }),
    db: { query },
  };
  const pricesService = createPricesService({ strapi } as any);
  const start = new Date('2026-08-12T10:00:00.000Z');
  const end = new Date('2026-08-13T10:00:00.000Z');

  const price = await pricesService.getPrice(
    'resource-document-id',
    start,
    end,
    1,
    42,
  );

  expect(query).toHaveBeenCalledWith('plugin::users-permissions.user');
  expect(findUser).toHaveBeenCalledWith({
    where: { id: 42 },
    populate: ['organization'],
  });
  expect(strapi.documents).toHaveBeenCalledTimes(1);
  expect(price?.tariffType).toBe(PriceTariffType.NOT_FOR_PROFIT);
  expect(price?.value).toBe(50);
});

// @todo test PriceTariffType.NOT_FOR_PROFIT and float prices
