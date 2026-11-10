import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const secretNames = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'JWT_SECRET',
];
const newSecret = () => randomBytes(32).toString('base64');

/** Fill empty secrets while retaining existing assignments and comments. */
export function fillSecrets(source) {
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  let output = source;
  const generated = [];

  for (const name of secretNames) {
    const pattern = new RegExp(
      `^([ \\t]*(?:export[ \\t]+)?${name}[ \\t]*=[ \\t]*)([^\\r\\n]*)`,
      'gm'
    );
    const matches = [...output.matchAll(pattern)];
    // Duplicate assignments are ambiguous: do not silently rotate a real key.
    if (matches.length > 1)
      throw new Error(
        `Duplicate ${name} assignments; remove the duplicate before continuing.`
      );
    const match = matches[0];
    if (match) {
      const empty = match[2].match(
        /^(?:"[ \t]*"|'[ \t]*'|[ \t]*)([ \t]*(?:#.*)?)$/
      );
      if (!empty) continue;
      const value =
        name === 'APP_KEYS'
          ? Array.from({ length: 4 }, newSecret).join(',')
          : newSecret();
      output =
        output.slice(0, match.index) +
        match[1] +
        value +
        empty[1] +
        output.slice(match.index + match[0].length);
    } else {
      const value =
        name === 'APP_KEYS'
          ? Array.from({ length: 4 }, newSecret).join(',')
          : newSecret();
      output += `${
        output && !output.endsWith('\n') ? newline : ''
      }${name}=${value}${newline}`;
    }
    generated.push(name);
  }

  return { output, generated };
}

export function setupEnvironment(root) {
  const target = resolve(root, '.env');
  const exists = existsSync(target);
  const source = readFileSync(
    exists ? target : resolve(root, '.env.example'),
    'utf8'
  );
  const { output, generated } = fillSecrets(source);
  if (!exists || output !== source)
    writeFileSync(target, output, { mode: 0o600 });
  return { created: !exists, generated };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = setupEnvironment(
    fileURLToPath(new URL('../', import.meta.url))
  );
  console.log(
    `${result.created ? 'Created' : 'Checked'} .env. Generated: ${
      result.generated.join(', ') || 'none (existing secrets kept)'
    }.`
  );
}
