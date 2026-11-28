/**
 * Checks that every tool page has text of its own, not only text copied from sibling pages.
 * Run it after `vite build --ssr src/prerender/shellData.ts --outDir dist-ssr` (the same step `pnpm run build:static` runs):
 *   node scripts/check-page-text.mjs
 * It reads the same page text that is written into the pre-rendered HTML, so what it measures is what Google sees.
 *
 * A "repeated" block is a step, FAQ answer or article paragraph whose wording appears on three or more tool pages.
 * Such blocks are fine for the privacy and "is it free" answers, but a page must also say something only it can say:
 * the real sections, columns or slides of that tool. The check fails when a page has fewer than MIN_OWN words of its own.
 * Exit code 1 means at least one page needs a section written for it (see AGENTS.md, "Pages that say something of their own").
 */
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MIN_OWN = 200;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ssrDir = process.env.PRERENDER_SSR_DIR ?? join(root, 'dist-ssr');

const files = await readdir(ssrDir);
const entry = files.find((name) => /^shellData\.(m?js)$/.test(name));
if (!entry) { console.error(`shellData build output not found in ${ssrDir}. Run: vite build --ssr src/prerender/shellData.ts --outDir dist-ssr`); process.exit(2); }
const { getShellPages } = await import(pathToFileURL(join(ssrDir, entry)).href);

const normal = (text) => text.toLowerCase().replace(/\W+/g, ' ').trim();
const count = (text) => (text ? text.split(' ').length : 0);
const tools = getShellPages().filter((page) => page.kind === 'tool');
const units = (page) => [
  ...page.steps.map((step) => step.description),
  ...page.faqs.map((faq) => faq.answer),
  ...page.article.flatMap((section) => section.paragraphs),
].map(normal).filter(Boolean);

const seen = new Map();
for (const page of tools) for (const unit of units(page)) seen.set(unit, (seen.get(unit) ?? 0) + 1);

const rows = tools.map((page) => {
  let own = 0;
  let all = 0;
  for (const unit of units(page)) { const words = count(unit); all += words; if ((seen.get(unit) ?? 0) < 3) own += words; }
  return { path: page.path, own, all };
}).sort((a, b) => a.own - b.own);

const short = rows.filter((row) => row.own < MIN_OWN);
console.log(`${tools.length} tool pages checked. Fewest words of their own: ${rows.slice(0, 5).map((row) => `${row.path} ${row.own}`).join(', ')}`);
if (short.length > 0) {
  console.log(`\n${short.length} page(s) have fewer than ${MIN_OWN} words that no other page repeats:`);
  for (const row of short) console.log(`  ${row.own} of ${row.all}  ${row.path}`);
  process.exit(1);
}
console.log(`Every tool page has at least ${MIN_OWN} words of its own.`);
