import { PDFDocument } from 'pdf-lib';
import { drawUpright, PAGE_SIZES, shownSize, type PageSizeId } from './pageSize';

/**
 * Page order for a folded booklet. Pages are padded with blanks to a multiple of 4. Each printed side holds two pages;
 * the list is front, back, front, back and so on, ready to print on both sides, flipping on the short edge.
 * A page number of -1 is a blank page.
 */
export function bookletSides(pageCount: number, rightToLeft = false): [number, number][] {
  const total = Math.ceil(pageCount / 4) * 4;
  const real = (n: number) => (n < pageCount ? n : -1);
  const sides: [number, number][] = [];
  for (let sheet = 0; sheet < total / 4; sheet += 1) {
    const front: [number, number] = [real(total - 1 - 2 * sheet), real(2 * sheet)];
    const back: [number, number] = [real(2 * sheet + 1), real(total - 2 - 2 * sheet)];
    sides.push(rightToLeft ? [front[1], front[0]] : front, rightToLeft ? [back[1], back[0]] : back);
  }
  return sides;
}

export interface BookletOptions { paper: PageSizeId; rightToLeft: boolean; gutter: number }

/** Lays two pages on each landscape sheet in booklet order. Returns the PDF and how many sheets of paper it needs. */
export async function makeBooklet(bytes: ArrayBuffer, options: BookletOptions): Promise<{ pdf: Uint8Array; sheets: number; blanks: number }> {
  const source = await PDFDocument.load(bytes, { updateMetadata: false });
  const out = await PDFDocument.create();
  const pages = source.getPages();
  const embedded = await out.embedPages(pages);
  const paper = PAGE_SIZES[options.paper];
  const width = paper.h; const height = paper.w;
  const sides = bookletSides(pages.length, options.rightToLeft);
  const gutter = Math.max(0, options.gutter);
  for (const side of sides) {
    const sheet = out.addPage([width, height]);
    side.forEach((index, slot) => {
      if (index < 0) return;
      const half = width / 2;
      const box = { x: slot === 0 ? gutter / 2 : half + gutter / 2, y: gutter / 2, w: half - gutter, h: height - gutter };
      drawUpright(sheet, embedded[index]!, shownSize(pages[index]!).rotation, box, 'fit');
    });
  }
  const padded = Math.ceil(pages.length / 4) * 4;
  return { pdf: await out.save(), sheets: padded / 4, blanks: padded - pages.length };
}
