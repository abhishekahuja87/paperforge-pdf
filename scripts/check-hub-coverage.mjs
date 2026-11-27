/**
 * Prints what is missing when tools are added: run `node scripts/check-hub-coverage.mjs` before opening a PR that adds or
 * changes a tool. It only reads source files (no build, no install), and it reports; it never changes anything.
 *
 * Checks, per topic in COLLECTIONS (src/config/homeSections.ts):
 *  1. every tool has a row in the topic page's task table (src/content/hubExtras.ts)
 *  2. every tool has search phrases in src/config/searchTerms.ts (tools with none rely only on their title and keywords)
 *  3. every topic page description in src/content/hubs.ts is at most 160 characters (it becomes the meta description)
 *  4. every hero tile in src/config/heroTiles.ts has a blurb
 * Exit code is 1 when check 1, 3 or 4 fails. Check 2 is advice only.
 */
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sections = read('src/config/homeSections.ts');
const extras = read('src/content/hubExtras.ts');
const hubs = read('src/content/hubs.ts');
const terms = read('src/config/searchTerms.ts');
const tiles = read('src/config/heroTiles.ts');

const collections = [...sections.slice(sections.indexOf('export const COLLECTIONS')).matchAll(/\{ id: '(\w+)', icon: '[\w-]+', tools: \[(.*?)\] \}/gs)]
  .map((match) => ({ id: match[1], tools: [...match[2].matchAll(/'([\w-]+)'/g)].map((tool) => tool[1]) }));

const hubPathOf = {};
for (const match of hubs.matchAll(/path: ['"]([^'"]+)['"],\s*collection: ['"](\w+)['"]/g)) hubPathOf[match[2]] = match[1];

let failed = false;
const say = (line) => console.log(line);

for (const collection of collections) {
  const path = hubPathOf[collection.id];
  if (!path) { say(`FAIL  topic "${collection.id}" has no page in hubs.ts`); failed = true; continue; }
  const start = extras.search(new RegExp(`["']${path}["']: \\{`));
  const end = start < 0 ? -1 : extras.indexOf('situations', start);
  const table = start < 0 ? '' : extras.slice(start, end);
  const noRow = collection.tools.filter((id) => !table.includes(`"${id}"`) && !table.includes(`'${id}'`));
  if (noRow.length) { say(`FAIL  ${path}: no task-table row for ${noRow.join(', ')}`); failed = true; }
  const noTerms = collection.tools.filter((id) => !new RegExp(`['"]${id}['"]:\\s*\\[`).test(terms));
  if (noTerms.length) say(`note  ${path}: no search phrases yet for ${noTerms.length} tool(s): ${noTerms.join(', ')}`);
}

for (const match of hubs.matchAll(/path: ['"]([^'"]+)['"][\s\S]*?\n    description: (['"])(.*)\2,\n/g)) {
  if (match[3].length > 160) { say(`FAIL  ${match[1]}: description is ${match[3].length} characters (max 160)`); failed = true; }
}

for (const tile of tiles.matchAll(/\{ collection: '(\w+)', label: '[^']*'(, blurb: '[^']+')?/g)) {
  if (!tile[2]) { say(`FAIL  hero tile "${tile[1]}" has no blurb`); failed = true; }
}

say(failed ? '\nSome checks failed.' : '\nAll required checks passed.');
process.exit(failed ? 1 : 0);
