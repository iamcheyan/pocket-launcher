import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(path.join(root, 'src/i18n.ts'), 'utf8');

// The English object is the source of truth (`as const`), so its keys double as
// the Key union. Every other locale is typed Record<Key,string>, but the check
// stays runtime-based so missing keys fail here rather than only in tsc.
function objectBody(name) {
  const marker = name === 'en' ? 'export const en = {' : `const ${name}: Record<Key, string> = {`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`locale ${name} not found in src/i18n.ts`);
  const open = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end < 0) throw new Error(`unterminated locale object ${name}`);
  return source.slice(open + 1, end);
}

function keysFor(name) {
  const body = objectBody(name);
  const keys = new Set();
  for (const match of body.matchAll(/(?:^|,)\s*([A-Za-z0-9_]+)\s*:/g)) keys.add(match[1]);
  return [...keys].sort();
}

const locales = ['en', 'zhCN', 'ja'];
const sets = Object.fromEntries(locales.map(locale => [locale, keysFor(locale)]));
const base = sets.en;
let failed = false;
if (base.length === 0) {
  console.error('no translation keys parsed');
  process.exit(1);
}
for (const locale of locales.slice(1)) {
  const missing = base.filter(key => !sets[locale].includes(key));
  const extra = sets[locale].filter(key => !base.includes(key));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`${locale}: missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`);
  }
}
if (failed) process.exit(1);
console.log(`i18n parity ok: ${locales.join(', ')} (${base.length} keys)`);
