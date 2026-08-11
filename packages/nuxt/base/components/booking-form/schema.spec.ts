import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { createBookingFormSchema } from './schema';

const schema = createBookingFormSchema({
  required: 'Required',
  minLength2: 'Must contain at least two characters',
  invalidEmail: 'Invalid email',
  consentRequired: 'Consent is required',
});

const validBooking = {
  customer: {
    firstName: 'Erika',
    lastName: 'Musterfrau',
    email: 'erika@example.com',
  },
  customerAddress: {
    street: 'Musterstraße 1',
    zip: '10115',
    place: 'Berlin',
  },
  commentCustomer: 'Please prepare the room.',
};

describe('createBookingFormSchema', () => {
  it('rejects a submission without accepted terms', () => {
    const result = v.safeParse(schema, {
      booking: validBooking,
      termsAccepted: false,
    });

    expect(result.success).toBe(false);
    expect(result.issues?.[0]?.message).toBe('Consent is required');
  });

  it('returns only booking data after successful validation', () => {
    const result = v.parse(schema, {
      booking: validBooking,
      termsAccepted: true,
    });

    expect(result).toEqual(validBooking);
    expect(result).not.toHaveProperty('termsAccepted');
  });
});
