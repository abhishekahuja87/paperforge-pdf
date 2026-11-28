/**
 * Checks that the one-tool-at-a-time text loader (src/locales/contentSplit.ts) finds exactly the same guide steps, questions
 * and article for every key as the combined text made by src/locales/content.ts. Run it after
 * `vite build --ssr src/prerender/shellData.ts --outDir dist-ssr` (the step `pnpm run build:static` runs):
 *   node scripts/check-content-split.mjs
 * Exit code 1 lists each key that differs, which means a tool page would show different text than it should.
 */
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ssrDir = process.env.PRERENDER_SSR_DIR ?? join(root, 'dist-ssr');
const files = await readdir(ssrDir);
const entry = files.find((name) => /^shellData\.(m?js)$/.test(name));
if (!entry) { console.error(`shellData build output not found in ${ssrDir}. Run: vite build --ssr src/prerender/shellData.ts --outDir dist-ssr`); process.exit(2); }
const { checkContentSplit } = await import(pathToFileURL(join(ssrDir, entry)).href);
const problems = await checkContentSplit();
if (problems.length > 0) {
  console.log(`${problems.length} difference(s) between the split loader and the combined text:`);
  for (const line of problems.slice(0, 50)) console.log(`  ${line}`);
  process.exit(1);
}
console.log('The split loader finds the same text as the combined text for every key.');
