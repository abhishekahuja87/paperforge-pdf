import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { buildSheet, hasBackSide, type FontId, type Item, type Sheet, type Side } from './geometry';
import type { PaperSettings } from './types';

const PT = 72 / 25.4;

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '');
  return [parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255];
};

/** Standard PDF fonts cannot show every character, so anything unsupported becomes "?". */
const safeText = (font: PDFFont, text: string): string =>
  Array.from(text).map((ch) => { try { font.encodeText(ch); return ch; } catch { return '?'; } }).join('');

/** Sans is always there; serif and typewriter are added when the document is built with embedFonts. */
export interface Fonts { regular: PDFFont; bold: PDFFont; serif?: PDFFont; serifBold?: PDFFont; mono?: PDFFont; monoBold?: PDFFont }

export async function embedFonts(doc: import('pdf-lib').PDFDocument, lib: typeof import('pdf-lib')): Promise<Fonts> {
  const { StandardFonts } = lib;
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold),
    serif: await doc.embedFont(StandardFonts.TimesRoman), serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    mono: await doc.embedFont(StandardFonts.Courier), monoBold: await doc.embedFont(StandardFonts.CourierBold),
  };
}

const pickFont = (fonts: Fonts, face: FontId | undefined, bold: boolean): PDFFont => {
  if (face === 'serif' && fonts.serif && fonts.serifBold) return bold ? fonts.serifBold : fonts.serif;
  if (face === 'mono' && fonts.mono && fonts.monoBold) return bold ? fonts.monoBold : fonts.mono;
  return bold ? fonts.bold : fonts.regular;
};

export function drawItems(page: PDFPage, items: Item[], height: number, fonts: Fonts, lib: typeof import('pdf-lib'), images?: Map<string, PDFImage>): void {
  const { rgb } = lib;
  const color = (hex: string) => { const [r, g, b] = hexToRgb(hex); return rgb(r, g, b); };
  for (const item of items) {
    if (item.t === 'rect') {
      page.drawRectangle({ x: item.x * PT, y: (height - item.y - item.h) * PT, width: item.w * PT, height: item.h * PT, color: color(item.c) });
    } else if (item.t === 'image') {
      const picture = images?.get(item.src);
      if (picture) page.drawImage(picture, { x: item.x * PT, y: (height - item.y - item.h) * PT, width: item.w * PT, height: item.h * PT });
    } else if (item.t === 'line') {
      page.drawLine({ start: { x: item.x1 * PT, y: (height - item.y1) * PT }, end: { x: item.x2 * PT, y: (height - item.y2) * PT }, thickness: item.w * PT, color: color(item.c), dashArray: item.dash ? item.dash.map((v) => v * PT) : undefined });
    } else if (item.t === 'dot') {
      page.drawCircle({ x: item.x * PT, y: (height - item.y) * PT, size: item.r * PT, color: color(item.c) });
    } else if (item.t === 'ring') {
      page.drawCircle({ x: item.x * PT, y: (height - item.y) * PT, size: item.r * PT, borderColor: color(item.c), borderWidth: item.w * PT });
    } else {
      const font = pickFont(fonts, item.font, Boolean(item.bold));
      const text = safeText(font, item.text);
      const width = font.widthOfTextAtSize(text, item.size);
      const x = item.x * PT - (item.anchor === 'middle' ? width / 2 : item.anchor === 'end' ? width : 0);
      page.drawText(text, { x, y: (height - item.y) * PT, size: item.size, font, color: color(item.c) });
    }
  }
}

/** Embeds each different picture once. Pictures are PNG data addresses made by the logo picker. */
export async function embedImages(doc: import('pdf-lib').PDFDocument, sheets: Sheet[]): Promise<Map<string, PDFImage>> {
  const map = new Map<string, PDFImage>();
  for (const sheet of sheets) {
    for (const item of sheet.fixed) {
      if (item.t !== 'image' || map.has(item.src)) continue;
      try {
        const base64 = item.src.slice(item.src.indexOf(',') + 1);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        map.set(item.src, await doc.embedPng(bytes));
      } catch { /* a picture that cannot be read is left out */ }
    }
  }
  return map;
}

/** Builds the whole bundle as a vector PDF. Identical pages are drawn once and reused, so 50 pages stay small. */
export async function buildPaperPdf(settings: PaperSettings): Promise<Uint8Array> {
  const lib = await import('pdf-lib');
  const { PDFDocument } = lib;
  const out = await PDFDocument.create();
  const fonts = await embedFonts(out, lib);
  const sheets: Record<Side, Sheet> = { front: buildSheet(settings, 'front'), back: buildSheet(settings, hasBackSide(settings) ? 'back' : 'front') };
  const widthPt = sheets.front.width * PT;
  const heightPt = sheets.front.height * PT;

  const templates: Partial<Record<Side, Awaited<ReturnType<typeof out.embedPdf>>[number]>> = {};
  if (settings.pages > 1) {
    for (const side of (hasBackSide(settings) ? ['front', 'back'] : ['front']) as Side[]) {
      const tpl = await PDFDocument.create();
      const tplFonts = await embedFonts(tpl, lib);
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
  const { PDFDocument } = lib;
  const out = await PDFDocument.create();
  const fonts = await embedFonts(out, lib);
  const images = await embedImages(out, sheets);
  for (const sheet of sheets) {
    const page = out.addPage([sheet.width * PT, sheet.height * PT]);
    drawItems(page, sheet.fixed, sheet.height, fonts, lib, images);
  }
  out.setTitle(title);
  out.setCreator('MyDailyUtils');
  return out.save();
}
