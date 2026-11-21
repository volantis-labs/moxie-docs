#!/usr/bin/env node
// Checks the docs pages.
//   node scripts/check-docs.mjs                 fail on a missing or old translation, warn on a long page
//   node scripts/check-docs.mjs --hash <file>   print the hash of an English page
//   node scripts/check-docs.mjs --stamp         write the current hash into each translated page
//                                               (use only after you updated the translations)
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = fileURLToPath(new URL('../src/content/docs/', import.meta.url));
const LOCALES = ['de', 'fr', 'nl'];
const MAX_WORDS = 300;
const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n?/;
const SOURCE_HASH = /^sourceHash:\s*["']?([0-9a-f]*)["']?\s*$/m;

const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 12);

// All .md and .mdx files below dir, as paths relative to dir.
function pages(dir, skip = []) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
    .map((e) => join(e.parentPath, e.name).slice(dir.length))
    .filter((p) => !skip.some((s) => p.startsWith(`${s}/`)))
    .sort();
}

// Words of text: no front matter, no code blocks, no imports, no tags.
function words(text) {
  const body = text
    .replace(FRONT_MATTER, '')
    .replace(/^```[\s\S]*?^```/gm, '')
    .replace(/^import .*$/gm, '')
    .replace(/<[^>]+>/g, ' ');
  return body.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function stamp(file, value) {
  const text = readFileSync(file, 'utf8');
  const front = FRONT_MATTER.exec(text);
  if (!front) throw new Error(`${file}: no front matter`);
  const line = `sourceHash: ${value}`;
  const next = SOURCE_HASH.test(front[1]) ? front[1].replace(SOURCE_HASH, line) : `${front[1]}\n${line}`;
  writeFileSync(file, text.replace(FRONT_MATTER, `---\n${next}\n---\n`));
}

const [mode, arg] = process.argv.slice(2);

if (mode === '--hash') {
  console.log(hash(arg));
  process.exit(0);
}

const english = pages(DOCS, LOCALES);
const errors = [];
const warnings = [];

for (const page of english) {
  const count = words(readFileSync(join(DOCS, page), 'utf8'));
  if (count > MAX_WORDS) warnings.push(`${page}: ${count} words (limit ${MAX_WORDS})`);
}

for (const locale of LOCALES) {
  const dir = join(DOCS, locale, '/');
  for (const page of english) {
    const file = join(dir, page);
    if (!existsSync(file)) {
      errors.push(`${locale}/${page}: translation is missing`);
      continue;
    }
    const current = hash(join(DOCS, page));
    if (mode === '--stamp') {
      stamp(file, current);
      continue;
    }
    const found = SOURCE_HASH.exec(FRONT_MATTER.exec(readFileSync(file, 'utf8'))?.[1] ?? '')?.[1];
    if (found !== current) {
      errors.push(`${locale}/${page}: the English page changed (sourceHash ${found ?? 'not set'}, now ${current})`);
    }
  }
  for (const page of pages(dir)) {
    if (!english.includes(page)) errors.push(`${locale}/${page}: no English page with this name`);
  }
}

for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
console.log(`${english.length} English pages, ${LOCALES.length} translations each: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
