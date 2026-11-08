import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

if (pdfFonts && (pdfFonts as any).pdfMake?.vfs) {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
} else if ((pdfFonts as any).vfs) {
  (pdfMake as any).vfs = (pdfFonts as any).vfs;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface UnlockPdfOptions {
  fileBuffer: ArrayBuffer;
  password?: string;
}

export async function unlockPdf(options: UnlockPdfOptions): Promise<Uint8Array> {
  const { fileBuffer, password = '' } = options;

  const pdfData = new Uint8Array(fileBuffer.slice(0));
  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  // pdf.js asks again after every wrong password, so answering with a password a second time would
  // loop forever. Stop after the first answer and report what went wrong instead.
  let passwordProblem: 'required' | 'invalid' | null = null;
  loadingTask.onPassword = (updatePassword: (pwd: string) => void, reason: number) => {
    if (reason === pdfjsLib.PasswordResponses.NEED_PASSWORD && password) {
      updatePassword(password);
      return;
    }
    passwordProblem = password ? 'invalid' : 'required';
    void loadingTask.destroy();
  };

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    if (passwordProblem === 'required') {
      throw new Error('PASSWORD_REQUIRED: Please enter the password to unlock this PDF.');
    }
    if (passwordProblem === 'invalid') {
      throw new Error('INVALID_PASSWORD: The password you entered is incorrect.');
    }
    throw err;
  }

  const numPages = pdfDoc.numPages;
  if (numPages === 0) {
    pdfDoc.cleanup();
    loadingTask.destroy();
    throw new Error('The uploaded PDF contains no pages.');
  }

  const pageImages: { dataUrl: string; width: number; height: number }[] = [];
  const scale = 2.0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      pdfDoc.cleanup();
      loadingTask.destroy();
      throw new Error('Canvas context could not be initialized.');
    }

    await page.render({
      canvasContext: ctx,
      canvas: canvas,
      viewport,
      intent: 'print',
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    pageImages.push({
      dataUrl,
      width: unscaledViewport.width,
      height: unscaledViewport.height,
    });

    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }

  pdfDoc.cleanup();
  loadingTask.destroy();

  const content = pageImages.map((img, idx) => ({
    image: img.dataUrl,
    width: img.width,
    height: img.height,
    pageBreak: idx < pageImages.length - 1 ? ('after' as const) : undefined,
  }));

  const firstPage = pageImages[0];
  const docDefinition: any = {
    pageSize: { width: firstPage.width, height: firstPage.height },
    pageMargins: [0, 0, 0, 0],
    content,
  };

  return new Promise<Uint8Array>((resolve, reject) => {
    try {
      const pdfGenerator = pdfMake.createPdf(docDefinition);
      const res = pdfGenerator.getBuffer();

      if (res && typeof (res as any).then === 'function') {
        (res as Promise<Uint8Array>)
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      } else {
        (pdfGenerator as any).getBuffer((buf: Uint8Array) => {
          resolve(new Uint8Array(buf));
        });
      }
    } catch (err: any) {
      reject(new Error('Failed to generate unlocked PDF: ' + (err?.message || err)));
    }
  });
}