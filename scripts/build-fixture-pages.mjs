/** Writes the text of the tournament size pages into src/locales/packs/sports.en.json. Run: node --experimental-strip-types scripts/build-fixture-pages.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildFixtureContent } from './fixture-pages-content.mjs';

const file = new URL('../src/locales/packs/sports.en.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const content = buildFixtureContent();
for (const group of ['guideSteps', 'pageGuides', 'toolArticles']) Object.assign(data[group], content[group]);
writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${Object.keys(content.toolArticles).length} pages`);
