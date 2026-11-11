/** PDF output for visiting cards: one card at its exact size, or an A4 sheet of ten with cutting marks. */

const MM = 72 / 25.4;
/** 3.5 x 2 inches, the common card size in the US and a close fit for 90 x 50 mm elsewhere. */
export const CARD_MM = { w: 88.9, h: 50.8 };
const A4 = { w: 210, h: 297 };
const COLS = 2;
const ROWS = 5;

export type CardPdfMode = 'single' | 'sheet';

export async function buildCardPdf(png: Uint8Array, mode: CardPdfMode): Promise<Uint8Array> {
  const lib = await import('pdf-lib');
  const doc = await lib.PDFDocument.create();
  const image = await doc.embedPng(png);

  if (mode === 'single') {
    const page = doc.addPage([CARD_MM.w * MM, CARD_MM.h * MM]);
    page.drawImage(image, { x: 0, y: 0, width: CARD_MM.w * MM, height: CARD_MM.h * MM });
    return doc.save();
  }

  const page = doc.addPage([A4.w * MM, A4.h * MM]);
  const left = (A4.w - COLS * CARD_MM.w) / 2;
  const top = (A4.h - ROWS * CARD_MM.h) / 2;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const x = left + col * CARD_MM.w;
      const yFromTop = top + row * CARD_MM.h;
      page.drawImage(image, { x: x * MM, y: (A4.h - yFromTop - CARD_MM.h) * MM, width: CARD_MM.w * MM, height: CARD_MM.h * MM });
    }
  }
  // Small cutting marks in the margins, so the sheet can be trimmed with a ruler or a guillotine.
  const grey = lib.rgb(0.55, 0.55, 0.55);
  const mark = 4;
  const gap = 1.5;
  for (let col = 0; col <= COLS; col += 1) {
    const x = (left + col * CARD_MM.w) * MM;
    page.drawLine({ start: { x, y: (A4.h - top + gap) * MM }, end: { x, y: (A4.h - top + gap + mark) * MM }, thickness: 0.4, color: grey });
    page.drawLine({ start: { x, y: (A4.h - top - ROWS * CARD_MM.h - gap) * MM }, end: { x, y: (A4.h - top - ROWS * CARD_MM.h - gap - mark) * MM }, thickness: 0.4, color: grey });
  }
  for (let row = 0; row <= ROWS; row += 1) {
    const y = (A4.h - top - row * CARD_MM.h) * MM;
    page.drawLine({ start: { x: (left - gap) * MM, y }, end: { x: (left - gap - mark) * MM, y }, thickness: 0.4, color: grey });
    page.drawLine({ start: { x: (left + COLS * CARD_MM.w + gap) * MM, y }, end: { x: (left + COLS * CARD_MM.w + gap + mark) * MM, y }, thickness: 0.4, color: grey });
  }
  return doc.save();
}
