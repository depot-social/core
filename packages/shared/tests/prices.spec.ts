/// <reference types="vitest" />
import { test, assert } from 'vitest';
import { priceToString, getPlainRentPrice } from '../functions';
import { Price } from '../types';

test('priceToString should format price correctly I', () => {
  const price = 56;
  const expected = '56,00\xa0€';

  const result = priceToString(price);

  assert.equal(result, expected);
});

test('priceToString should format price correctly II', () => {
  const price = 56.12;
  const expected = '56,12\xa0€';

  const result = priceToString(price);

  assert.equal(result, expected);
});

test('priceToString should format price correctly III', () => {
  const price = 1234.56;
  const expected = '1.234,56\xa0€';

  const result = priceToString(price);

  assert.equal(result, expected);
});

// Test string inputs: They are officially not supported, but can work in situations
test('priceToString should format string price', () => {
  const price = '12.34';
  const expected = '12,34\xa0€';

  const result = priceToString(price);
  assert.equal(result, expected);
});

test('priceToString should return NaN on invalid string price', () => {
  const price = '12,34';
  const expected = 'NaN\xa0€';

  const result = priceToString(price);
  assert.equal(result, expected);
});

test('getPlainRentPrice should return cleared, resource-only price', () => {
  const price = {
    value: 200,
    depositValue: 10,
    vatValue: 10,
  };
  const expected = 180;

  const result = getPlainRentPrice(price as Price);
  assert.equal(result, expected);
});

test('getPlainRentPrice should return 0 if empty price', () => {
  const price = null;
  const expected = 0;

  const result = getPlainRentPrice(price);
  assert.equal(result, expected);
});
