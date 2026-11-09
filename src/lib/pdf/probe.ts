import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PdfProbe {
  encrypted: boolean;
  pages?: number;
  /** Characters of selectable text on the first pages. */
  textChars?: number;
}

/** Reads the page count and whether the first pages hold selectable text, without rendering anything. */
export async function probePdf(fileBuffer: ArrayBuffer, pagesToSample = 3): Promise<PdfProbe> {
  let needsPassword = false;
  const task = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer.slice(0)), cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/', cMapPacked: true });
  task.onPassword = () => {
    needsPassword = true;
    void task.destroy();
  };
  try {
    const doc = await task.promise;
    try {
      let textChars = 0;
      for (let number = 1; number <= Math.min(doc.numPages, pagesToSample); number += 1) {
        const page = await doc.getPage(number);
        const content = await page.getTextContent();
        textChars += content.items.reduce((sum, item) => sum + ((item as { str?: string }).str ?? '').trim().length, 0);
        page.cleanup();
      }
      return { encrypted: false, pages: doc.numPages, textChars };
    } finally {
      doc.cleanup();
      void task.destroy();
    }
  } catch (error) {
    if (needsPassword) return { encrypted: true };
    throw error;
  }
}
