/** Reading the text pieces of a PDF with their positions, so rows and columns can be found. */
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/** One piece of text and where it sits on the page. y grows upward, as in the PDF itself. */
export interface Piece { text: string; x: number; y: number; w: number; h: number }
export interface PagePieces { page: number; width: number; pieces: Piece[] }

export const MAX_PAGES = 300;

/** The positioned text of every page. Returns null when stopped. */
export async function readPieces(buffer: ArrayBuffer, password: string | undefined, onProgress: (page: number, total: number) => void, cancelled: () => boolean): Promise<PagePieces[] | null> {
  const task = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)), password, cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/', cMapPacked: true });
  const doc = await task.promise;
  const pages: PagePieces[] = [];
  try {
    const total = Math.min(doc.numPages, MAX_PAGES);
    for (let n = 1; n <= total; n += 1) {
      if (cancelled()) return null;
      const page = await doc.getPage(n), content = await page.getTextContent(), pieces: Piece[] = [];
      for (const raw of content.items) {
        const item = raw as { str?: string; transform?: number[]; width?: number; height?: number };
        if (!item.str || !item.transform || !item.str.trim()) continue;
        const t = item.transform, h = item.height || Math.hypot(t[2]!, t[3]!) || 10;
        pieces.push({ text: item.str.trim(), x: t[4]!, y: t[5]!, w: item.width || item.str.length * h * 0.5, h });
      }
      pages.push({ page: n, width: page.getViewport({ scale: 1 }).width, pieces });
      page.cleanup(); onProgress(n, total);
    }
  } finally { void task.destroy(); }
  return pages;
}
