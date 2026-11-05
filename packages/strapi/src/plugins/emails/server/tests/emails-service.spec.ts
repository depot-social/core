/// <reference types="vitest" />
import { test, assert } from 'vitest';
import { PriceTariffType } from '@depot/shared';
import type { Core } from '@strapi/strapi';
import emailsService, {
  getBookingRequestPriceTemplateData,
  newLineToHtmlParagraph,
  removeBookingRequestPriceTemplateContent,
} from '../services/emails-service';

test('newLineToHtmlParagraph should wrap content within <mj-text> with <p>', () => {
  const input = `<mj-text>
Hello, World!
</mj-text>`;
  const expected = '<mj-text><p>Hello, World!</p></mj-text>';

  const result = newLineToHtmlParagraph(input);

  assert.equal(result, expected);
});

test('newLineToHtmlParagraph should wrap each line within <mj-text> with <p>', () => {
  const input = `<mj-text>
Hello,
World!
</mj-text>`;
  const expected = '<mj-text><p>Hello,</p><p>World!</p></mj-text>';

  const result = newLineToHtmlParagraph(input);

  assert.equal(result, expected);
});

test('newLineToHtmlParagraph should not affect content outside of <mj-text>', () => {
  const input = `Hello,
<mj-text>
World!
</mj-text>`;
  const expected = 'Hello,<mj-text><p>World!</p></mj-text>';

  const result = newLineToHtmlParagraph(input);

  assert.equal(result, expected);
});

test('newLineToHtmlParagraph leaves non-text tags unaffected', () => {
  const input = `
<mj-text>
Hello,
</mj-text>
<mj-button href="#">
World
</mj-button>
<mj-text>
!
</mj-text>
`;
  const expected =
    '<mj-text><p>Hello,</p></mj-text><mj-button href="#">World</mj-button><mj-text><p>!</p></mj-text>';

  const result = newLineToHtmlParagraph(input);

  assert.equal(result, expected);
});

test('omits booking-request price template data when prices are disabled', () => {
  assert.deepEqual(
    getBookingRequestPriceTemplateData(
      {
        id: 1,
        title: 'Test price',
        value: 20,
        currency: 'euro',
        duration: 1,
        durationType: 'daily',
        tariffType: PriceTariffType.REGULAR,
        resourceValue: 15,
        depositValue: 3,
        vatValue: 2,
      },
      false
    ),
    {}
  );
});

test('keeps booking-request price template data when prices are enabled', () => {
  assert.deepEqual(
    getBookingRequestPriceTemplateData(
      {
        id: 1,
        title: 'Test price',
        value: 20,
        currency: 'euro',
        duration: 1,
        durationType: 'daily',
        tariffType: PriceTariffType.REGULAR,
        resourceValue: 15,
        depositValue: 3,
        vatValue: 2,
      },
      true
    ),
    {
      priceText:
        'Gesamt: 20,00 € (Kaution: 3,00 €, Steuern: 2,00 €, Ausleihgebühr: 15,00 €)',
    }
  );
});

test('removes the legacy price block from a booking-request MJML template', () => {
  const templateWithoutPrice = removeBookingRequestPriceTemplateContent(`
    <mj-text>Die Buchung kostet:</mj-text>
    <mj-text>{{ priceText }}</mj-text>
    <mj-text>Weitere Buchungsdetails</mj-text>
  `);

  assert.include(templateWithoutPrice, 'Weitere Buchungsdetails');
  assert.notInclude(templateWithoutPrice, 'priceText');
  assert.notInclude(templateWithoutPrice, 'kostet');
});

test('syncAuthEmailTemplates renders auth emails into the users-permissions store', async () => {
  const emailSettings = {
    email_confirmation: { options: { object: 'old', message: 'old' } },
    reset_password: { options: { object: 'old', message: 'old' } },
  };
  let storedValue: typeof emailSettings | undefined;

  const strapi = {
    documents: () => ({
      findFirst: async () => ({
        layout:
          '<mjml><mj-body background-color="#fff2e1"><mj-section><mj-column><mj-text>{{ headline }}</mj-text>{{ content }}</mj-column></mj-section></mj-body></mjml>',
        emailConfirmationTitle: 'Willkommen {{ USER.username }}',
        emailConfirmationBody:
          '<mj-button href="{{ URL }}?confirmation={{ CODE }}">Bestätigen</mj-button>',
      }),
    }),
    store: () => ({
      get: async () => emailSettings,
      set: async ({ value }: { value: typeof emailSettings }) => {
        storedValue = value;
      },
    }),
  } as unknown as Core.Strapi;

  await emailsService({ strapi }).syncAuthEmailTemplates();

  const confirmation = storedValue?.email_confirmation.options;
  assert.equal(confirmation?.object, 'Willkommen <%= USER.username %>');
  assert.include(confirmation?.message, '<%= URL %>?confirmation=<%= CODE %>');
  assert.include(confirmation?.message, '#fff2e1');

  // Without title and body the existing template is kept
  assert.equal(storedValue?.reset_password.options.message, 'old');
});
