import { PDFDocument, degrees } from 'pdf-lib';
import { drawUpright, embedAll, PAGE_SIZES, shownSize, type PageSizeId } from './pageSize';

export interface BookletLayout {
  /** Put the blank pages before the last page, so the last page stays on the back cover. */
  backCover?: boolean;
  /** Sheets of paper in each folded set (signature). 0 makes one booklet from every sheet. */
  sheetsPerSet?: number;
}

export interface BookletPlan {
  /** Each set is a list of printed sides: front, back, front, back ... Each side holds two page numbers; -1 is a blank. */
  sets: [number, number][][];
  sheets: number;
  blanks: number;
}

/**
 * Page order for a folded booklet. Pages are padded with blanks to a multiple of 4 (at the end, or before the last page
 * when `backCover` is on). A long booklet can be split into sets of a few sheets, each folded on its own and stacked in
 * order, which is how thick books are bound: one fold of 30 sheets will not lie flat. Every printed side holds two pages,
 * ready to print on both sides, flipping on the short edge.
 */
export function bookletPlan(pageCount: number, rightToLeft = false, layout: BookletLayout = {}): BookletPlan {
  const total = Math.ceil(pageCount / 4) * 4;
  const blanks = total - pageCount;
  const pages = Array.from({ length: pageCount }, (_, index) => index);
  const order = layout.backCover && blanks > 0 && pageCount >= 2
    ? [...pages.slice(0, -1), ...Array<number>(blanks).fill(-1), pageCount - 1]
    : [...pages, ...Array<number>(blanks).fill(-1)];
  const perSet = layout.sheetsPerSet && layout.sheetsPerSet > 0 ? layout.sheetsPerSet * 4 : Math.max(4, total);
  const sets: [number, number][][] = [];
  for (let start = 0; start < order.length; start += perSet) {
    const chunk = order.slice(start, start + perSet);
    const sides: [number, number][] = [];
    for (let sheet = 0; sheet < chunk.length / 4; sheet += 1) {
      const front: [number, number] = [chunk[chunk.length - 1 - 2 * sheet]!, chunk[2 * sheet]!];
      const back: [number, number] = [chunk[2 * sheet + 1]!, chunk[chunk.length - 2 - 2 * sheet]!];
      sides.push(rightToLeft ? [front[1], front[0]] : front, rightToLeft ? [back[1], back[0]] : back);
    }
    sets.push(sides);
  }
  return { sets, sheets: total / 4, blanks };
}

/** Every printed side in print order, one booklet with blanks at the end. Kept for callers that need the simple order. */
export function bookletSides(pageCount: number, rightToLeft = false): [number, number][] {
  return bookletPlan(pageCount, rightToLeft).sets.flat();
}

export interface BookletOptions extends BookletLayout {
  paper: PageSizeId;
  rightToLeft: boolean;
  gutter: number;
  /** For printers that print one side only: all fronts first, then all backs, to print in two runs. */
  manualDuplex?: boolean;
  /** Manual two-sided printing: put the backs in reverse order (for printers that stack pages face up). */
  reverseBacks?: boolean;
  /** Manual two-sided printing: turn every back upside down (when the second run comes out upside down). */
  rotateBacks?: boolean;
}

export interface BookletResult { pdf: Uint8Array; sheets: number; blanks: number; sets: number }

/** Lays two pages on each landscape sheet in booklet order. Returns the PDF and how many sheets of paper it needs. */
export async function makeBooklet(bytes: ArrayBuffer, options: BookletOptions): Promise<BookletResult> {
  const source = await PDFDocument.load(bytes, { updateMetadata: false });
  const out = await PDFDocument.create();
  const pages = source.getPages();
  const embedded = await embedAll(out, pages);
  const paper = PAGE_SIZES[options.paper];
  const width = paper.h; const height = paper.w;
  const plan = bookletPlan(pages.length, options.rightToLeft, options);
  const sides = plan.sets.flat();
  const fronts = sides.filter((_, index) => index % 2 === 0);
  const backs = sides.filter((_, index) => index % 2 === 1);
  const ordered: { side: [number, number]; back: boolean }[] = options.manualDuplex
    ? [...fronts.map((side) => ({ side, back: false })), ...(options.reverseBacks ? [...backs].reverse() : backs).map((side) => ({ side, back: true }))]
    : sides.map((side, index) => ({ side, back: index % 2 === 1 }));
  const gutter = Math.max(0, options.gutter);
  for (const { side, back } of ordered) {
    const sheet = out.addPage([width, height]);
    side.forEach((index, slot) => {
      const content = index < 0 ? null : embedded[index];
      if (!content) return;
      const half = width / 2;
      const box = { x: slot === 0 ? gutter / 2 : half + gutter / 2, y: gutter / 2, w: half - gutter, h: height - gutter };
      drawUpright(sheet, content, shownSize(pages[index]!).rotation, box, 'fit');
    });
    if (options.manualDuplex && back && options.rotateBacks) sheet.setRotation(degrees(180));
  }
  return { pdf: await out.save(), sheets: plan.sheets, blanks: plan.blanks, sets: plan.sets.length };
}
