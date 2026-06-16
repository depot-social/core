/// <reference types="vitest" />
import { test, assert } from 'vitest';
import { newLineToHtmlParagraph } from '../services/emails-service';

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
  const expected = 'Hello, <mj-text><p>World!</p></mj-text>';

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
