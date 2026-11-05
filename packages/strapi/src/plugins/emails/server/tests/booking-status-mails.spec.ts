import type { Core } from '@strapi/strapi';
import type { Booking } from '@depot/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import createEmailsService from '../services/emails-service';

const booking = {
  documentId: 'booking-42',
  title: 'Bohrer',
  resource: { title: 'Bohrer' },
  start: '2026-11-01T10:00:00Z',
  end: '2026-11-02T14:00:00Z',
  bookedUnits: 2,
  customer: {
    firstName: 'Anna',
    lastName: 'Kunde',
    email: 'customer@example.test',
  },
  resourceOwner: {
    firstName: 'Ben',
    lastName: 'Verleiher',
    email: 'owner@example.test',
  },
  price: { value: 20, resourceValue: 20 },
} as Booking;

const setup = (templates: Record<string, string> = {}) => {
  const sendTemplatedEmail = vi.fn().mockResolvedValue(undefined);
  const strapi = {
    documents: vi.fn(() => ({
      findFirst: vi.fn().mockResolvedValue(templates),
      findOne: vi.fn().mockResolvedValue(booking),
    })),
    plugins: { email: { services: { email: { sendTemplatedEmail } } } },
    log: { error: vi.fn() },
  };
  return {
    service: createEmailsService({ strapi: strapi as unknown as Core.Strapi }),
    strapi,
    sendTemplatedEmail,
  };
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('booking status emails', () => {
  test('uses relative booking links when the base URL is empty', async () => {
    vi.stubEnv('PUBLIC_DEPOT_BASE_URL', '');
    vi.resetModules();
    const { default: createService } = await import(
      '../services/emails-service'
    );
    const testCase = setup();
    const service = createService({
      strapi: testCase.strapi as unknown as Core.Strapi,
    });
    await service.sendBookingConfirmedMail(booking);
    const mail = testCase.sendTemplatedEmail.mock.calls[0][1];
    expect(mail.html).toContain('href="/bookings/booking-42"');
    expect(mail.html).not.toContain('https://depot.social');
  });
  test('confirmation uses German fallback content, saved details, real end date and customer recipient', async () => {
    const testCase = setup({
      bookingConfirmedTitle: ' ',
      bookingConfirmedBody: '',
    });
    expect(await testCase.service.sendBookingConfirmedMail(booking)).toBe(true);
    expect(testCase.sendTemplatedEmail).toHaveBeenCalledTimes(1);
    const [recipient, mail] = testCase.sendTemplatedEmail.mock.calls[0];
    expect(recipient.to).toBe(booking.customer.email);
    expect(mail.subject).toBe('Deine Buchung wurde bestätigt');
    expect(mail.html).toContain('02.11.2026');
    expect(mail.html).toContain('Stückzahl: 2');
    expect(mail.html).toContain('/bookings/booking-42');
    expect(mail.html).toContain('20,00');
    expect(mail.html).not.toContain('undefined');
  });

  test.each(['customer', 'resourceOwner'] as const)(
    'cancellation names the %s actor and sends independently to both parties',
    async (role) => {
      const testCase = setup();
      expect(
        await testCase.service.sendBookingCancelledMail(booking, {
          role,
          name: 'Alex & Partner',
        })
      ).toBe(true);
      expect(
        testCase.sendTemplatedEmail.mock.calls.map(([to]) => to.to)
      ).toEqual([booking.customer.email, booking.resourceOwner.email]);
      for (const [, mail] of testCase.sendTemplatedEmail.mock.calls) {
        expect(mail.html).toContain('Alex &amp; Partner');
        expect(mail.html).toContain(
          role === 'customer' ? 'Ausleiher:in' : 'Verleiher:in'
        );
      }
    }
  );

  test('a failed first recipient still attempts the second, with no retry', async () => {
    const testCase = setup();
    testCase.sendTemplatedEmail.mockRejectedValueOnce(
      new Error('SMTP unavailable')
    );
    expect(
      await testCase.service.sendBookingCancelledMail(booking, {
        role: 'customer',
        name: 'Anna',
      })
    ).toBe(false);
    expect(testCase.sendTemplatedEmail).toHaveBeenCalledTimes(2);
    expect(testCase.strapi.log.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'booking=booking-42, type=cancelled, recipientRole=customer'
      ),
      expect.any(Error)
    );
  });

  test('a missing customer email does not prevent the owner notification', async () => {
    const testCase = setup();
    expect(
      await testCase.service.sendBookingCancelledMail(
        { ...booking, customer: { ...booking.customer, email: '' } },
        { role: 'resourceOwner', name: 'Ben' }
      )
    ).toBe(false);
    expect(testCase.sendTemplatedEmail).toHaveBeenCalledTimes(1);
    expect(testCase.sendTemplatedEmail.mock.calls[0][0].to).toBe(
      booking.resourceOwner.email
    );
  });

  test('uses CMS subject, body and layout', async () => {
    const testCase = setup({
      bookingConfirmedTitle: 'Bestätigt: {{ resourceTitle }}',
      bookingConfirmedBody: '<mj-text>Hallo {{ customerName }}!</mj-text>',
      layout:
        '<mjml><mj-body><mj-section><mj-column><mj-text>Depot {{ headline }}</mj-text>{{ content }}</mj-column></mj-section></mj-body></mjml>',
    });
    await testCase.service.sendBookingConfirmedMail(booking);
    const [, mail] = testCase.sendTemplatedEmail.mock.calls[0];
    expect(mail.subject).toBe('Bestätigt: Bohrer');
    expect(mail.html).toContain('Hallo Anna Kunde!');
    expect(mail.html).toContain('Depot Bestätigt: Bohrer');
  });

  test('disabled prices omit money from the fallback message', async () => {
    vi.stubEnv('STRAPI_PLUGIN_PRICES', 'false');
    const testCase = setup();
    await testCase.service.sendBookingConfirmedMail(booking);
    expect(testCase.sendTemplatedEmail.mock.calls[0][1].html).not.toContain(
      'Gesamt:'
    );
  });

  test('the existing request email also uses the actual end date', async () => {
    const testCase = setup({
      bookingRequestTitle: 'Anfrage',
      bookingRequestBody: '<mj-text>Ende: {{ ende }}</mj-text>',
      layout:
        '<mjml><mj-body><mj-section><mj-column>{{ content }}</mj-column></mj-section></mj-body></mjml>',
    });
    expect(
      await testCase.service.sendBookingRequestMail(booking.documentId)
    ).toBe(true);
    expect(testCase.sendTemplatedEmail.mock.calls[0][1].html).toContain(
      '02.11.2026'
    );
  });
});
