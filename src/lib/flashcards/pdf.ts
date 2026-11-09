import { drawPage, PX_PER_MM } from './render';
import type { PageSpec } from './layout';
import { pageDims, type FlashSettings } from './types';

const PT = 72 / 25.4;

/** Builds the PDF: each page is drawn at 300 dpi on a canvas (so any language the browser can show works) and placed at full page size. */
export async function buildFlashPdf(pages: PageSpec[], s: FlashSettings, onProgress: (fraction: number) => void): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const { w, h } = pageDims(s);
  const out = await PDFDocument.create();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * PX_PER_MM);
  canvas.height = Math.round(h * PX_PER_MM);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  for (let i = 0; i < pages.length; i += 1) {
    drawPage(ctx, pages[i], s, PX_PER_MM);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not encode a page.');
    const image = await out.embedPng(new Uint8Array(await blob.arrayBuffer()));
    out.addPage([w * PT, h * PT]).drawImage(image, { x: 0, y: 0, width: w * PT, height: h * PT });
    onProgress((i + 1) / pages.length);
    await new Promise((resolve) => { window.setTimeout(resolve, 0); });
  }
  out.setTitle('Flashcards');
  out.setCreator('MyDailyUtils');
  return out.save();
}
