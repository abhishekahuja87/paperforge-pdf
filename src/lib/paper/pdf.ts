import type { PDFFont, PDFPage } from 'pdf-lib';
import { buildSheet, hasBackSide, type Item, type Sheet, type Side } from './geometry';
import type { PaperSettings } from './types';

const PT = 72 / 25.4;

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '');
  return [parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255];
};

/** Standard PDF fonts cannot show every character, so anything unsupported becomes "?". */
const safeText = (font: PDFFont, text: string): string =>
  Array.from(text).map((ch) => { try { font.encodeText(ch); return ch; } catch { return '?'; } }).join('');

export interface Fonts { regular: PDFFont; bold: PDFFont }

export function drawItems(page: PDFPage, items: Item[], height: number, fonts: Fonts, lib: typeof import('pdf-lib')): void {
  const { rgb } = lib;
  const color = (hex: string) => { const [r, g, b] = hexToRgb(hex); return rgb(r, g, b); };
  for (const item of items) {
    if (item.t === 'line') {
      page.drawLine({ start: { x: item.x1 * PT, y: (height - item.y1) * PT }, end: { x: item.x2 * PT, y: (height - item.y2) * PT }, thickness: item.w * PT, color: color(item.c), dashArray: item.dash ? item.dash.map((v) => v * PT) : undefined });
    } else if (item.t === 'dot') {
      page.drawCircle({ x: item.x * PT, y: (height - item.y) * PT, size: item.r * PT, color: color(item.c) });
    } else if (item.t === 'ring') {
      page.drawCircle({ x: item.x * PT, y: (height - item.y) * PT, size: item.r * PT, borderColor: color(item.c), borderWidth: item.w * PT });
    } else {
      const font = item.bold ? fonts.bold : fonts.regular;
      const text = safeText(font, item.text);
      const width = font.widthOfTextAtSize(text, item.size);
      const x = item.x * PT - (item.anchor === 'middle' ? width / 2 : item.anchor === 'end' ? width : 0);
      page.drawText(text, { x, y: (height - item.y) * PT, size: item.size, font, color: color(item.c) });
    }
  }
}

/** Builds the whole bundle as a vector PDF. Identical pages are drawn once and reused, so 50 pages stay small. */
export async function buildPaperPdf(settings: PaperSettings): Promise<Uint8Array> {
  const lib = await import('pdf-lib');
  const { PDFDocument, StandardFonts } = lib;
  const out = await PDFDocument.create();
  const fonts: Fonts = { regular: await out.embedFont(StandardFonts.Helvetica), bold: await out.embedFont(StandardFonts.HelveticaBold) };
  const sheets: Record<Side, Sheet> = { front: buildSheet(settings, 'front'), back: buildSheet(settings, hasBackSide(settings) ? 'back' : 'front') };
  const widthPt = sheets.front.width * PT;
  const heightPt = sheets.front.height * PT;

  const templates: Partial<Record<Side, Awaited<ReturnType<typeof out.embedPdf>>[number]>> = {};
  if (settings.pages > 1) {
    for (const side of (hasBackSide(settings) ? ['front', 'back'] : ['front']) as Side[]) {
      const tpl = await PDFDocument.create();
      const tplFonts: Fonts = { regular: await tpl.embedFont(StandardFonts.Helvetica), bold: await tpl.embedFont(StandardFonts.HelveticaBold) };
      const tplPage = tpl.addPage([widthPt, heightPt]);
      drawItems(tplPage, sheets[side].fixed, sheets[side].height, tplFonts, lib);
      [templates[side]] = await out.embedPdf(tpl, [0]);
    }
  }

  for (let index = 0; index < settings.pages; index += 1) {
    const side: Side = hasBackSide(settings) && index % 2 === 1 ? 'back' : 'front';
    const sheet = sheets[side];
    const page = out.addPage([widthPt, heightPt]);
    const template = templates[side];
    if (template) page.drawPage(template, { x: 0, y: 0 });
    else drawItems(page, sheet.fixed, sheet.height, fonts, lib);
    if (sheet.pageNumber) {
      const n = sheet.pageNumber;
      drawItems(page, [{ t: 'text', x: n.x, y: n.y, size: n.size, text: `Page ${settings.startPage + index}`, c: n.c, anchor: n.anchor }], sheet.height, fonts, lib);
    }
  }
  out.setTitle('Printable paper');
  out.setCreator('MyDailyUtils');
  return out.save();
}

/** Builds a PDF with one page per sheet, for layouts where every page differs (calendars, planners). */
export async function buildPdfFromSheets(sheets: Sheet[], title: string): Promise<Uint8Array> {
  const lib = await import('pdf-lib');
  const { PDFDocument, StandardFonts } = lib;
  const out = await PDFDocument.create();
  const fonts: Fonts = { regular: await out.embedFont(StandardFonts.Helvetica), bold: await out.embedFont(StandardFonts.HelveticaBold) };
  for (const sheet of sheets) {
    const page = out.addPage([sheet.width * PT, sheet.height * PT]);
    drawItems(page, sheet.fixed, sheet.height, fonts, lib);
  }
  out.setTitle(title);
  out.setCreator('MyDailyUtils');
  return out.save();
}
