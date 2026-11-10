import { afterEach, describe, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fillSecrets, setupEnvironment } from './setup-env.mjs';

const directories: string[] = [];
afterEach(() =>
  directories
    .splice(0)
    .forEach((directory) => rmSync(directory, { recursive: true, force: true }))
);

describe('Environment setup', () => {
  test('creates .env from the example and generates independent secrets', () => {
    const root = mkdtempSync(join(tmpdir(), 'depot-env-'));
    directories.push(root);
    writeFileSync(
      join(root, '.env.example'),
      '# settings\nAPP_KEYS=\nAPI_TOKEN_SALT=\nADMIN_JWT_SECRET=\nJWT_SECRET=\nSMTP_PASSWORD=custom\n'
    );
    expect(setupEnvironment(root).created).toBe(true);
    const source = readFileSync(join(root, '.env'), 'utf8');
    const values = Object.fromEntries(
      source
        .split('\n')
        .filter((line) => line.includes('='))
        .map((line) => [
          line.slice(0, line.indexOf('=')),
          line.slice(line.indexOf('=') + 1),
        ])
    );
    const secrets = [
      ...values.APP_KEYS.split(','),
      values.API_TOKEN_SALT,
      values.ADMIN_JWT_SECRET,
      values.JWT_SECRET,
    ];
    expect(new Set(secrets).size).toBe(7);
    expect(
      secrets.every((secret) => Buffer.from(secret, 'base64').length === 32)
    ).toBe(true);
    expect(source).toContain('SMTP_PASSWORD=custom');
    expect(setupEnvironment(root)).toEqual({ created: false, generated: [] });
    expect(readFileSync(join(root, '.env'), 'utf8')).toBe(source);
  });

  test('fills quoted blanks, retains comments and CRLF, and appends absent keys', () => {
    const { output } = fillSecrets(
      '# custom\r\nexport APP_KEYS = "" # keys\r\nAPI_TOKEN_SALT=\'\'\r\nADMIN_JWT_SECRET=keep-me\r\nOTHER="quoted # value"\r\n'
    );
    expect(output).toContain(' # keys\r\n');
    expect(output).toContain('ADMIN_JWT_SECRET=keep-me\r\n');
    expect(output).toContain('OTHER="quoted # value"\r\n');
    expect(output).toMatch(/\r\nJWT_SECRET=.+\r\n$/);
    expect(output.replace(/\r\n/g, '')).not.toContain('\n');
  });

  test('rejects duplicate secret assignments before changing a file', () => {
    expect(() => fillSecrets('JWT_SECRET=existing\nJWT_SECRET=\n')).toThrow(
      'Duplicate JWT_SECRET'
    );
  });
});
