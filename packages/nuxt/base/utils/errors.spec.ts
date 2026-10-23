import { describe, expect, it } from 'vitest';
import { getStrapiErrorMessage, getStrapiErrorStatus } from './errors';

it.each([
  [{ error: { status: 409 } }, 409],
  [{ data: { error: { status: 403 } } }, 403],
  [{ statusCode: 409 }, 409],
  [new Error('Network error'), undefined],
])('reads Strapi and fetch status codes', (error, status) => {
  expect(getStrapiErrorStatus(error)).toBe(status);
});

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
