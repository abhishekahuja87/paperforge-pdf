import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
}

export async function extractTextFromPdf(fileBuffer: ArrayBuffer): Promise<ExtractedPageText[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const extractedPages: ExtractedPageText[] = [];

  try {
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const textItems = textContent.items
      .map((item) => {
        const piece = item as { str?: string; hasEOL?: boolean };
        return `${piece.str ?? ''}${piece.hasEOL ? '\n' : ' '}`;
      })
      .join('')
      .replace(/[ \t]+\n/g, '\n');

    extractedPages.push({
      pageNumber: pageNum,
      text: textItems.trim(),
    });

    page.cleanup();
  }

  return extractedPages;
  } finally {
    pdfDoc.cleanup();
    void loadingTask.destroy();
  }
}