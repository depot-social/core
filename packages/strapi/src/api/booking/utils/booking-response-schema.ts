import { z } from '@strapi/utils';
import { PriceTariffType } from '@depot/shared';

const timestamp = z.union([
  z.string(),
  z.date().transform((date) => date.toISOString()),
]);
const address = z.object({
  street: z.string().nullable(),
  zip: z.string().nullable(),
  place: z.string().nullable(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  obfuscatedLatitude: z.number().nullish(),
  obfuscatedLongitude: z.number().nullish(),
});
const price = z.object({
  id: z.number(),
  title: z.string().nullable(),
  value: z.number(),
  currency: z.enum(['euro', 'usd']),
  duration: z.number().nullable(),
  durationType: z.enum(['daily', 'hourly']),
  tariffType: z.enum(PriceTariffType),
  resourceValue: z.number().nullable(),
  depositValue: z.number().nullable(),
  vatValue: z.number().nullable(),
});

/** Strapi sanitization returns unknown. Validate and strip it before exposing it. */
export const bookingResponseSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
  start: timestamp,
  end: timestamp,
  bookingStatus: z.enum(['requested', 'confirmed', 'cancelled']),
  bookedUnits: z.number(),
  title: z.string().nullable(),
  commentCustomer: z.string().nullable(),
  customerAddress: address
    .pick({ street: true, zip: true, place: true })
    .nullish(),
  price: price.nullish(),
  resource: z
    .object({
      id: z.number(),
      documentId: z.string(),
      createdAt: timestamp,
      updatedAt: timestamp,
      title: z.string(),
      description: z.string().nullable(),
      slug: z.string(),
      address: address.nullish(),
      images: z
        .array(
          z.object({
            id: z.number(),
            documentId: z.string().optional(),
            url: z.string(),
            alternativeText: z.string().nullish(),
            width: z.number().nullish(),
            height: z.number().nullish(),
          })
        )
        .default([]),
      prices: z.array(price).default([]),
    })
    .nullish(),
});
