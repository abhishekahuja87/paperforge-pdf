import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFJS_ASSETS } from './pdfjsAssets';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PageThumbnailItem {
  id: string;
  originalPageIndex: number; // 0-based index
  rotation: number; // 0, 90, 180, 270 degrees
  thumbnailUrl: string;
}

/**
 * Loads a PDF and generates lightweight thumbnail previews for each page.
 */
export async function loadPdfThumbnails(fileBuffer: ArrayBuffer): Promise<PageThumbnailItem[]> {
  const loadingTask = pdfjsLib.getDocument({ ...PDFJS_ASSETS,
    data: new Uint8Array(fileBuffer.slice(0)),
  });

  const thumbnails: PageThumbnailItem[] = [];
  let pdfDoc: pdfjsLib.PDFDocumentProxy | undefined;
  try {
    pdfDoc = await loadingTask.promise;
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = document.createElement('canvas');
      try {
        // 0.45 scale generates fast, crisp previews while keeping memory consumption low
        const viewport = page.getViewport({ scale: 0.45 });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas rendering is unavailable in this browser, so page previews cannot be made.');
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        thumbnails.push({
          id: `page-${pageNum}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          originalPageIndex: pageNum - 1,
          rotation: 0,
          thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
        });
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
    }
  } finally {
    // Always release the document and its worker, including when a page fails to render.
    pdfDoc?.cleanup();
    void loadingTask.destroy();
  }
  return thumbnails;
}

/**
 * Creates and exports a new PDF using the custom page order and rotations.
 */
export async function exportOrganizedPdf(
  originalBuffer: ArrayBuffer,
  pages: PageThumbnailItem[]
): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error('At least one page must remain to generate a PDF.');
  }

  const sourcePdf = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
  if (sourcePdf.isEncrypted) {
    throw new Error('This PDF is password-protected. Remove the password with the Unlock PDF tool first.');
  }
  const targetPdf = await PDFDocument.create();

  // Copy pages in the exact order present in the thumbnail list. A page index of -1 is an added blank page, the size of
  // the page before it (or A4 when it comes first). The same index can appear twice when a page was duplicated.
  const real = pages.filter((p) => p.originalPageIndex >= 0).map((p) => p.originalPageIndex);
  const copiedPages = real.length > 0 ? await targetPdf.copyPages(sourcePdf, real) : [];
  let copiedAt = 0;
  let lastSize: [number, number] = [595.28, 841.89];

  pages.forEach((item) => {
    if (item.originalPageIndex < 0) {
      const blank = targetPdf.addPage(lastSize);
      if (item.rotation % 360) blank.setRotation(degrees(item.rotation % 360));
      return;
    }
    const page = copiedPages[copiedAt++]!;
    const additionalRotation = item.rotation % 360;
    if (additionalRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + additionalRotation) % 360));
    }
    const { width, height } = page.getSize();
    lastSize = [width, height];
    targetPdf.addPage(page);
  });

  return await targetPdf.save({ useObjectStreams: false });
}