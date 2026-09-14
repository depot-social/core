import * as v from 'valibot';

export interface BookingFormValidationMessages {
  consentRequired: string;
}

export interface BookingFormCustomer {
  firstName: string;
  lastName: string;
  email: string;
}

export const createBookingFormSchema = (
  messages: BookingFormValidationMessages
) =>
  v.pipe(
    v.object({
      booking: v.object({
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
    v.transform(({ booking }) => ({
      customerAddress: booking.customerAddress,
      commentCustomer: booking.commentCustomer,
    }))
  );

export type BookingFormInput = v.InferInput<
  ReturnType<typeof createBookingFormSchema>
>;

export type BookingFormValues = v.InferOutput<
  ReturnType<typeof createBookingFormSchema>
>;

export interface BookingFormInitialData {
  customer?: Partial<BookingFormCustomer>;
  customerAddress?: Partial<BookingFormValues['customerAddress']>;
  commentCustomer?: string | null;
}
