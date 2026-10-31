import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PageImageResult {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export async function convertPdfToImages(
  fileBuffer: ArrayBuffer,
  scale = 2.0,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<PageImageResult[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const results: PageImageResult[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context could not be initialized.');

    await page.render({
      canvasContext: ctx,
      canvas: canvas,
      viewport,
      intent: 'print',
    }).promise;

    const dataUrl = canvas.toDataURL(format, 0.95);

    results.push({
      pageNumber: pageNum,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
    });

    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  pdfDoc.cleanup();
  loadingTask.destroy();

  return results;
}