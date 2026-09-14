import { describe, expect, it } from 'vitest';
import { getStrapiErrorMessage } from './errors';

describe('getStrapiErrorMessage', () => {
  it('returns a Strapi lifecycle error message', () => {
    expect(
      getStrapiErrorMessage(
        {
          error: {
            status: 400,
            name: 'BadRequestError',
            message: 'Resource has no owner.',
            details: {},
          },
        },
        'Fallback message'
      )
    ).toBe('Resource has no owner.');
  });

  it('returns the fallback for an unknown error shape', () => {
    expect(
      getStrapiErrorMessage(new Error('Network error'), 'Fallback message')
    ).toBe('Fallback message');
  });
});
