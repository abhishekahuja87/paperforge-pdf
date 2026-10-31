import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const thumbnails: PageThumbnailItem[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // 0.45 scale generates fast, crisp previews while keeping memory consumption low
    const viewport = page.getViewport({ scale: 0.45 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({
        canvasContext: ctx,
        canvas: canvas,
        viewport,
      }).promise;
    }

    thumbnails.push({
      id: `page-${pageNum}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      originalPageIndex: pageNum - 1,
      rotation: 0,
      thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
    });

    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  pdfDoc.cleanup();
  loadingTask.destroy();

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
  const targetPdf = await PDFDocument.create();

  // Copy pages in the exact order present in the thumbnail list
  const indices = pages.map((p) => p.originalPageIndex);
  const copiedPages = await targetPdf.copyPages(sourcePdf, indices);

  copiedPages.forEach((page, idx) => {
    const additionalRotation = pages[idx].rotation % 360;
    if (additionalRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + additionalRotation) % 360));
    }
    targetPdf.addPage(page);
  });

  return await targetPdf.save({ useObjectStreams: false });
}