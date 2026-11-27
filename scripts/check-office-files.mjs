/**
 * Checks the PowerPoint writer against rules that Microsoft PowerPoint enforces strictly (it refuses the whole file as
 * "corrupted" when one is broken, while Google Slides and LibreOffice often open it anyway, so a quick look in a browser
 * does not catch these). Builds a deck with every slide kind, empty and heading-only slides, in every design.
 * Usage: node --experimental-strip-types scripts/check-office-files.mjs
 *
 * Rules checked, each one a bug that reached the live site once:
 * - the slide master's placeholders all have a type (an untyped placeholder on the master made every deck unopenable);
 * - every text body holds at least one paragraph (a heading-only slide made an empty text box);
 * - font sizes and positions are whole numbers.
 * For a full check, open the files in PowerPoint, Word and Excel (see TESTING.md, "Office files in real Office").
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('data:text/javascript,' + encodeURIComponent(`export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\\.[a-z]+$/.test(specifier)) specifier += '.ts';
  return next(specifier, context);
}`));

const { buildPptx } = await import('../src/lib/pptx/write.ts');
const { LOOKS, themeOf } = await import('../src/lib/pptx/model.ts');
const JSZip = (await import('jszip')).default;

const slides = [
  { kind: 'title', title: 'A title slide', sub: 'With a second line\nand a third' },
  { kind: 'section', title: 'A section' },
  { kind: 'bullets', title: 'Heading only, no points' },
  { kind: 'bullets', title: 'Points', bullets: ['One', 'Two & three <four>', 'नमस्ते, 你好, émigré'] },
  { kind: 'two', title: 'Two columns', columns: [{ head: 'Left', bullets: ['a', 'b'] }, { head: 'Right', bullets: [] }] },
  { kind: 'two', title: 'Two empty columns', columns: [] },
  { kind: 'table', title: 'A table', table: [['Name', 'Value', 'Note'], ['Rice', '20', ''], ['', '', '']] },
  { kind: 'table', title: 'An empty table', table: [] },
  { kind: 'big', title: '42%', sub: '' },
  { kind: 'closing', title: 'Thank you' },
];

let checks = 0;
const ok = (fn) => { fn(); checks += 1; };

for (const look of Object.keys(LOOKS)) {
  const blob = await buildPptx({ title: `Check ${look}`, slides, theme: themeOf(look, '') });
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const master = await zip.file('ppt/slideMasters/slideMaster1.xml').async('string');
  ok(() => assert.ok(![...master.matchAll(/<p:ph\b[^>]*\/>/g)].some((m) => !/\btype="/.test(m[0])), `${look}: master has an untyped placeholder`));
  const parts = Object.keys(zip.files).filter((name) => /^ppt\/(slides|slideMasters|slideLayouts)\/[^/]+\.xml$/.test(name));
  for (const name of parts) {
    const xml = await zip.file(name).async('string');
    for (const body of xml.matchAll(/<(p|a):txBody>([\s\S]*?)<\/\1:txBody>/g)) {
      ok(() => assert.ok(/<a:p[ >]/.test(body[2]), `${look} ${name}: a text body has no paragraph`));
    }
    for (const attr of xml.matchAll(/ (sz|x|y|cx|cy|w|h)="([^"]*)"|<a:spcPts (val)="([^"]*)"/g)) {
      if (attr[3]) { attr[1] = attr[3]; attr[2] = attr[4]; }
      ok(() => assert.match(attr[2], /^-?\d+$/, `${look} ${name}: ${attr[1]}="${attr[2]}" is not a whole number`));
    }
    let depth = 0;
    for (const tag of xml.matchAll(/<(\/?)([a-zA-Z][\w:.-]*)[^>]*?(\/?)>/g)) {
      if (tag[2].startsWith('?')) continue;
      if (tag[3] === '/') continue;
      depth += tag[1] === '/' ? -1 : 1;
      if (depth < 0) break;
    }
    ok(() => assert.equal(depth, 0, `${look} ${name}: tags do not balance`));
  }
}

console.log(`${checks} checks passed`);
