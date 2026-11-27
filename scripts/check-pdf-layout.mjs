/**
 * Checks the page layout logic of the PDF Booklet Maker and Resize PDF Page Size, and the Image Resizer minimum size padding: booklet page order (one booklet,
 * back cover kept last, folded sets, right-to-left), one-sided printing order, and page sizes after resizing, using
 * real PDFs made with pdf-lib.
 * Usage: node --experimental-strip-types scripts/check-pdf-layout.mjs
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s.startsWith('.') && !/[.](ts|json|mjs|js)$/.test(s)) s += '.ts'; return n(s, c); }`));
const { bookletPlan, bookletSides } = await import('../src/lib/more/booklet.ts');
const show = (sides) => sides.map((s) => s.map((n) => (n < 0 ? 'b' : n + 1)).join('|')).join('  ');
// 8 pages, one booklet: sheet 1 front 8|1, back 2|7; sheet 2 front 6|3, back 4|5
assert.equal(show(bookletSides(8)), '8|1  2|7  6|3  4|5');
// 10 pages, blanks at end
assert.equal(show(bookletSides(10)), 'b|1  2|b  10|3  4|9  8|5  6|7');
// 10 pages, back cover kept last: page 10 on the outside back
const bc = bookletPlan(10, false, { backCover: true });
assert.equal(show(bc.sets.flat()), '10|1  2|b  b|3  4|9  8|5  6|7');
assert.equal(bc.blanks, 2); assert.equal(bc.sheets, 3);
// 16 pages in sets of 2 sheets: two 8-page booklets
const st = bookletPlan(16, false, { sheetsPerSet: 2 });
assert.equal(st.sets.length, 2);
assert.equal(show(st.sets[1]), '16|9  10|15  14|11  12|13');
// every page appears exactly once
for (const n of [1, 3, 7, 13, 50]) for (const layout of [{}, { backCover: true }, { sheetsPerSet: 4 }, { backCover: true, sheetsPerSet: 3 }]) {
  const seen = bookletPlan(n, false, layout).sets.flat(2).filter((x) => x >= 0).sort((a, b) => a - b);
  assert.deepEqual(seen, Array.from({ length: n }, (_, i) => i), `${n} ${JSON.stringify(layout)}`);
}
// right-to-left mirrors each side
assert.equal(show(bookletPlan(8, true).sets.flat()), '1|8  7|2  3|6  5|4');

const { PDFDocument } = (await import('pdf-lib'));
const { makeBooklet } = await import('../src/lib/more/booklet.ts');
const { resizePdf, readPageSizes, sizeSummary, fitScales, PAGE_SIZES } = await import('../src/lib/more/pageSize.ts');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1, `${a} is not close to ${b}`);

// A test file: 3 Letter portrait pages, 1 A3 landscape page, 1 A4 portrait page.
const src = await PDFDocument.create();
for (let i = 0; i < 3; i += 1) src.addPage([612, 792]);
src.addPage([1190.55, 841.89]);
src.addPage([595.28, 841.89]);
const bytes = (await src.save()).buffer;

const sizes = await readPageSizes(bytes);
assert.equal(sizeSummary(sizes), '3 × Letter, 1 × A3 landscape, 1 × A4');

// Resize to A4, keeping the A4 page as it is: every page ends up A4, landscape stays landscape.
const out = await PDFDocument.load(await resizePdf(bytes, { size: 'a4', orientation: 'auto', fit: 'fit', margin: 0, keepMatching: true }));
const dims = out.getPages().map((p) => p.getSize());
assert.equal(dims.length, 5);
for (const d of [dims[0], dims[1], dims[2], dims[4]]) { near(d.width, PAGE_SIZES.a4.w); near(d.height, PAGE_SIZES.a4.h); }
near(dims[3].width, PAGE_SIZES.a4.h); near(dims[3].height, PAGE_SIZES.a4.w);

// A3 to A4 with Fit shrinks content to about 71%.
const scales = fitScales(sizes, { size: 'a4', orientation: 'auto', fit: 'fit', margin: 0, keepMatching: true });
assert.ok(Math.abs(Math.min(...scales) - 0.707) < 0.01, `A3 to A4 scale ${Math.min(...scales)}`);

// Custom size in points: 216 x 330 mm.
const mm = 72 / 25.4;
const custom = await PDFDocument.load(await resizePdf(bytes, { size: 'custom', custom: { w: 216 * mm, h: 330 * mm }, orientation: 'portrait', fit: 'fit', margin: 0 }));
near(custom.getPage(0).getWidth(), 216 * mm); near(custom.getPage(0).getHeight(), 330 * mm);

// Booklet: 5 pages make 2 sheets; one-sided printing puts the 2 fronts first, then the 2 backs, turned if asked.
const booklet = await makeBooklet(bytes, { paper: 'a4', rightToLeft: false, gutter: 0, manualDuplex: true, rotateBacks: true });
const bdoc = await PDFDocument.load(booklet.pdf);
assert.equal(booklet.sheets, 2); assert.equal(booklet.blanks, 3); assert.equal(bdoc.getPageCount(), 4);
assert.deepEqual(bdoc.getPages().map((p) => p.getRotation().angle), [0, 0, 180, 180]);
near(bdoc.getPage(0).getWidth(), PAGE_SIZES.a4.h);

// Image Resizer minimum size: blank comment segments are added after the start marker; the rest of the file is kept.
const { padJpeg } = await import('../src/lib/media/resizeToTarget.ts');
const fake = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 1, 2, 0xff, 0xd9]);
for (const target of [10, 13, 5000, 70000, 200000]) {
  const padded = padJpeg(fake, target);
  assert.ok(padded.length >= target && padded.length <= Math.max(target + 3, fake.length), `padded to ${padded.length} for ${target}`);
  assert.deepEqual([...padded.subarray(0, 2)], [0xff, 0xd8]);
  assert.deepEqual([...padded.subarray(padded.length - 8)], [...fake.subarray(2)]);
  // Walk the segments: every added one is FFFE with a correct length.
  let at = 2;
  while (padded[at] === 0xff && padded[at + 1] === 0xfe) at += 2 + ((padded[at + 2] << 8) | padded[at + 3]);
  assert.equal(at, padded.length - 8, 'segments line up with the original data');
}

console.log('pdf layout and image size checks passed');
