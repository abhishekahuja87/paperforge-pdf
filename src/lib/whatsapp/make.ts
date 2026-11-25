/** Loading the photos from a chat zip and saving the pages as a PDF. Only the PDF code (pdf-lib) is downloaded, and only when a PDF is made. */
import { baseName, type ZipArchive } from './zip';
import { paintPage, type Built, type Photo } from './layout';
import type { ChatMessage } from './parse';

export const MAX_PHOTOS = 200;
const IMAGE = /\.(jpe?g|png|webp|gif)$/i;

/** The photos the chosen messages mention, shrunk to a size that keeps memory low. */
export async function loadPhotos(zip: ZipArchive, messages: ChatMessage[], already: Map<string, Photo>): Promise<Map<string, Photo>> {
  const found = new Map(already);
  const byBase = new Map(zip.names.map((name) => [baseName(name), name]));
  for (const message of messages) {
    if (found.size >= MAX_PHOTOS) break;
    const file = message.file;
    if (!file || found.has(file) || !IMAGE.test(file)) continue;
    const path = byBase.get(file); if (!path) continue;
    const blob = await zip.read(path); if (!blob) continue;
    try {
      const bitmap = await createImageBitmap(blob);
      const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      found.set(file, { source: canvas, width: canvas.width, height: canvas.height });
    } catch { /* a photo the browser cannot read is shown as a note instead */ }
  }
  return found;
}

/** How many pixels wide each page is drawn. */
export const SHARPNESS = { standard: 1240, small: 830 } as const;
export type SharpnessId = keyof typeof SHARPNESS;

/** Draws one page to a canvas at the chosen width. */
export function renderPage(built: Built, index: number, pixels: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scale = pixels / built.width;
  canvas.width = pixels; canvas.height = Math.round(built.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  paintPage(ctx, built, index);
  return canvas;
}

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Every page as one picture each, put into a PDF. Reports how many pages are done. */
export async function makePdf(built: Built, sharpness: SharpnessId, title: string, onProgress: (done: number) => void, isCancelled: () => boolean): Promise<Blob | null> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle(title); doc.setCreator('MyDailyUtils');
  const size: [number, number] = built.look.paper === 'a4' ? [595.28, 841.89] : [612, 792];
  for (let n = 0; n < built.pages.length; n += 1) {
    if (isCancelled()) return null;
    const canvas = renderPage(built, n, SHARPNESS[sharpness]);
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!jpeg) throw new Error('A page could not be drawn.');
    const image = await doc.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
    const page = doc.addPage(size);
    page.drawImage(image, { x: 0, y: 0, width: size[0], height: size[1] });
    canvas.width = 1; canvas.height = 1;
    onProgress(n + 1);
    await pause();
  }
  return new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });
}
