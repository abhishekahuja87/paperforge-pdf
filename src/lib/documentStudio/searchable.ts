import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker, OEM, PSM } from 'tesseract.js';

export async function makeSearchable(
  bytes: Uint8Array,
  onProgress: (page: number, total: number) => void,
  signal: AbortSignal,
): Promise<Uint8Array> {
  const assetBase = new URL(`${import.meta.env.BASE_URL}ocr-assets/`, document.baseURI);
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: new URL('worker.min.js', assetBase).href,
    corePath: assetBase.href,
    langPath: assetBase.href.replace(/\/$/, ''),
    cacheMethod: 'none',
    workerBlobURL: false,
  });
  const task = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const source = await task.promise;
    const result = await PDFDocument.load(bytes);
    for (let index = 0; index < source.numPages; index += 1) {
      signal.throwIfAborted();
      onProgress(index + 1, source.numPages);
      const page = await source.getPage(index + 1);
      const canvas = document.createElement('canvas');
      try {
        const unit = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 4000 / Math.max(unit.width, unit.height));
        const viewport = page.getViewport({ scale });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable.');
        await page.render({ canvas, canvasContext: context, viewport, background: 'white' }).promise;
        const { data } = await worker.recognize(canvas, { pdfTextOnly: true }, { pdf: true });
        signal.throwIfAborted();
        if (!data.pdf) throw new Error('OCR did not produce a text layer.');
        const [textPage] = await result.embedPdf(new Uint8Array(data.pdf));
        const target = result.getPage(index);
        target.drawPage(textPage, {
          x: 0,
          y: 0,
          width: target.getWidth(),
          height: target.getHeight(),
        });
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
    }
    return await result.save();
  } finally {
    try {
      await task.destroy();
    } finally {
      await worker.terminate();
    }
  }
}
