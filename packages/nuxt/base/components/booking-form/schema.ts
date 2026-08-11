import * as v from 'valibot';

export interface BookingFormValidationMessages {
  required: string;
  minLength2: string;
  invalidEmail: string;
  consentRequired: string;
}

export const createBookingFormSchema = (
  messages: BookingFormValidationMessages
) =>
  v.pipe(
    v.object({
      booking: v.object({
        customer: v.object({
          firstName: v.pipe(
            v.string(),
            v.nonEmpty(messages.required),
            v.minLength(2, messages.minLength2)
          ),
          lastName: v.pipe(
            v.string(),
            v.nonEmpty(messages.required),
            v.minLength(2, messages.minLength2)
          ),
          email: v.pipe(
            v.string(),
            v.nonEmpty(messages.required),
            v.email(messages.invalidEmail)
          ),
        }),
        customerAddress: v.object({
          street: v.string(),
          zip: v.string(),
          place: v.string(),
        }),
        commentCustomer: v.string(),
      }),
      termsAccepted: v.pipe(
        v.boolean(),
        v.check((accepted) => accepted, messages.consentRequired)
      ),
    }),
    v.transform(({ booking }) => booking)
  );

export type BookingFormInput = v.InferInput<
  ReturnType<typeof createBookingFormSchema>
>;

export type BookingFormValues = v.InferOutput<
  ReturnType<typeof createBookingFormSchema>
>;

export interface BookingFormInitialData {
  customer?: Partial<BookingFormValues['customer']>;
  customerAddress?: Partial<BookingFormValues['customerAddress']>;
  commentCustomer?: string | null;
}
