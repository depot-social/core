/// <reference types="vitest" />
import { test, assert } from 'vitest';
import { calculatePrice } from '../services/prices-service';
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

// @todo test PriceTariffType.NOT_FOR_PROFIT and float prices
