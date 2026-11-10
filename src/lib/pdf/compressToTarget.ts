import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { safeRenderScale } from './renderScale';
import { compressPdf } from './compress';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/** Render sizes tried from sharpest to smallest (1 = 72 dpi). */
export const TARGET_SCALES = [2, 1.5, 1.2, 1, 0.8, 0.6, 0.45];
/** JPEG qualities tried from best to smallest. */
export const TARGET_QUALITIES = [0.85, 0.7, 0.55, 0.4, 0.3];
/** Room left for the PDF structure around the page images. */
const OVERHEAD_BYTES_PER_PAGE = 600;
const OVERHEAD_BYTES_BASE = 1500;

export interface TargetCompressResult {
  pdfBytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  targetSize: number;
  /** True when the file is at or under the target size. */
  met: boolean;
  /** "text" keeps selectable text (lossless only); "pictures" turned each page into an image. */
  method: 'text' | 'pictures';
  /** Approximate resolution of the page pictures, in dots per inch. Zero for the lossless method. */
  dpi: number;
  /** JPEG quality used for the page pictures, 1 to 100. Zero for the lossless method. */
  quality: number;
}

export interface TargetCompressOptions {
  fileBuffer: ArrayBuffer;
  targetBytes: number;
  onProgress?: (message: string) => void;
}

/** Choose the sharpest setting whose total size fits: pure maths, kept apart so it can be tested. */
export function pickSetting(
  sizes: number[][],
  qualities: number[],
  pageCount: number,
  targetBytes: number,
): { qualityIndex: number; total: number } | null {
  const overhead = OVERHEAD_BYTES_BASE + OVERHEAD_BYTES_PER_PAGE * pageCount;
  for (let q = 0; q < qualities.length; q += 1) {
    const total = sizes.reduce((sum, page) => sum + page[q], 0) + overhead;
    if (total <= targetBytes) return { qualityIndex: q, total };
  }
  return null;
}

async function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('This browser could not encode the page picture.');
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Makes a PDF as sharp as possible while staying under a size.
 * 1. Tries the lossless clean-up first, which keeps text selectable.
 * 2. If that is still too big, turns each page into a JPEG picture, trying larger sizes and better
 *    quality first, and keeps the first combination that fits. If nothing fits, returns the smallest
 *    result with met set to false so the page can say how close it got.
 */
export async function compressToTarget(options: TargetCompressOptions): Promise<TargetCompressResult> {
  const { fileBuffer, targetBytes, onProgress } = options;
  const originalSize = fileBuffer.byteLength;
  if (!(targetBytes > 0)) throw new Error('Enter a size greater than zero.');

  onProgress?.('Trying a lossless clean-up first...');
  const lossless = await compressPdf({ fileBuffer, level: 'strong' });
  if (lossless.compressedSize <= targetBytes) {
    return {
      pdfBytes: lossless.pdfBytes, originalSize, compressedSize: lossless.compressedSize,
      targetSize: targetBytes, met: true, method: 'text', dpi: 0, quality: 0,
    };
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });
  const pdf = await loadingTask.promise;
  try {
    const pageCount = pdf.numPages;
    const pagePoints: { width: number; height: number }[] = [];
    for (let n = 1; n <= pageCount; n += 1) {
      const page = await pdf.getPage(n);
      const view = page.getViewport({ scale: 1 });
      pagePoints.push({ width: view.width, height: view.height });
      page.cleanup();
    }

    let smallest: { scaleIndex: number; images: Uint8Array[]; total: number; qualityIndex: number } | null = null;

    for (let s = 0; s < TARGET_SCALES.length; s += 1) {
      onProgress?.(`Rendering pages at about ${Math.round(TARGET_SCALES[s] * 72)} dpi...`);
      // images[quality][page]
      const images: Uint8Array[][] = TARGET_QUALITIES.map(() => []);
      for (let n = 1; n <= pageCount; n += 1) {
        const page = await pdf.getPage(n);
        const viewport = page.getViewport({ scale: safeRenderScale(page, TARGET_SCALES[s]) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context could not be initialized.');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, canvas, viewport, intent: 'print' }).promise;
        for (let q = 0; q < TARGET_QUALITIES.length; q += 1) {
          images[q].push(await encodeJpeg(canvas, TARGET_QUALITIES[q]));
        }
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }

      const sizes = Array.from({ length: pageCount }, (_, p) => TARGET_QUALITIES.map((_q, q) => images[q][p].byteLength));
      const fit = pickSetting(sizes, TARGET_QUALITIES, pageCount, targetBytes);
      const lastQ = TARGET_QUALITIES.length - 1;
      const lastTotal = sizes.reduce((sum, page) => sum + page[lastQ], 0)
        + OVERHEAD_BYTES_BASE + OVERHEAD_BYTES_PER_PAGE * pageCount;
      const chosenQ = fit ? fit.qualityIndex : lastQ;
      const total = fit ? fit.total : lastTotal;
      if (!smallest || total < smallest.total) {
        smallest = { scaleIndex: s, images: images[chosenQ], total, qualityIndex: chosenQ };
      }
      if (fit) {
        smallest = { scaleIndex: s, images: images[chosenQ], total, qualityIndex: chosenQ };
        break;
      }
    }

    if (!smallest) throw new Error('The PDF has no pages to compress.');
    onProgress?.('Building the PDF...');
    const out = await PDFDocument.create();
    for (let p = 0; p < pageCount; p += 1) {
      const jpg = await out.embedJpg(smallest.images[p]);
      const page = out.addPage([pagePoints[p].width, pagePoints[p].height]);
      page.drawImage(jpg, { x: 0, y: 0, width: pagePoints[p].width, height: pagePoints[p].height });
    }
    const pdfBytes = await out.save({ useObjectStreams: true });
    if (pdfBytes.byteLength > targetBytes && lossless.compressedSize <= pdfBytes.byteLength) {
      // Pictures did not get under the size and are no smaller than the clean-up: keep the text version.
      return {
        pdfBytes: lossless.pdfBytes, originalSize, compressedSize: lossless.compressedSize,
        targetSize: targetBytes, met: false, method: 'text', dpi: 0, quality: 0,
      };
    }
    return {
      pdfBytes, originalSize, compressedSize: pdfBytes.byteLength, targetSize: targetBytes,
      met: pdfBytes.byteLength <= targetBytes, method: 'pictures',
      dpi: Math.round(TARGET_SCALES[smallest.scaleIndex] * 72),
      quality: Math.round(TARGET_QUALITIES[smallest.qualityIndex] * 100),
    };
  } finally {
    pdf.cleanup();
    void loadingTask.destroy();
  }
}
