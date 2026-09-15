/// <reference types="vitest" />
import { describe, expect, test } from 'vitest';
import { readBooleanEnv } from '@depot/shared';

describe('readBooleanEnv', () => {
  test.each([
    ['true', true],
    ['TRUE', true],
    [' 1 ', true],
    ['false', false],
    ['FALSE', false],
    [' 0 ', false],
  ])('parses %j as %s', (value, expected) => {
    expect(readBooleanEnv(value, true)).toBe(expected);
  });

  test('uses the supplied default for missing or invalid values', () => {
    expect(readBooleanEnv(undefined, true)).toBe(true);
    expect(readBooleanEnv(null, false)).toBe(false);
    expect(readBooleanEnv('enabled', true)).toBe(true);
    expect(readBooleanEnv('', false)).toBe(false);
  });
});
