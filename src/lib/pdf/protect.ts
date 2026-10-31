import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import pdfMake from 'pdfmake/build/pdfmake';

// Configure pdf.js worker using Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ProtectPdfOptions {
  fileBuffer: ArrayBuffer;
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    copying?: boolean;
  };
}

/**
 * Renders pages into high-resolution canvas frames in client RAM,
 * then packages them into an encrypted PDF using pdfmake's native Standard Encryption Handler.
 * 100% in-browser, zero WASM, zero server calls.
 */
export async function protectPdf(options: ProtectPdfOptions): Promise<Uint8Array> {
  const { fileBuffer, userPassword = '', ownerPassword = '', permissions } = options;

  if (!userPassword && !ownerPassword) {
    throw new Error('Please set at least a user password (to open) or an owner password.');
  }

  // 1. Load document via PDF.js in memory
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('The uploaded PDF contains no pages.');
  }

  // 2. Render each page to high-DPI canvas
  const pageImages: { dataUrl: string; width: number; height: number }[] = [];
  const scale = 2.0; // 2x resolution for sharp text and graphics

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    pageImages.push({
      dataUrl,
      width: unscaledViewport.width,
      height: unscaledViewport.height,
    });

    // Release canvas allocations
    canvas.width = 0;
    canvas.height = 0;
  }

  // 3. Build document definition with native standard encryption
  const content: any[] = [];

  pageImages.forEach((img, idx) => {
    content.push({
      image: img.dataUrl,
      width: img.width,
      height: img.height,
      pageBreak: idx < pageImages.length - 1 ? 'after' : undefined,
    });
  });

  const firstPage = pageImages[0];
  const docDefinition: any = {
    pageSize: { width: firstPage.width, height: firstPage.height },
    pageMargins: [0, 0, 0, 0],
    content,
    userPassword: userPassword.trim() || undefined,
    ownerPassword: (ownerPassword.trim() || userPassword.trim()) || undefined,
    permissions: {
      printing: permissions?.printing !== false ? 'highResolution' : false,
      modifying: false,
      copying: permissions?.copying === true,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  };

  // 4. Generate the encrypted buffer
  try {
    const pdfGenerator = pdfMake.createPdf(docDefinition);
    const result = pdfGenerator.getBuffer();

    if (result && typeof (result as any).then === 'function') {
      const buffer = await result;
      return new Uint8Array(buffer);
    }

    return await new Promise<Uint8Array>((resolve, reject) => {
      try {
        (pdfGenerator as any).getBuffer((buffer: Uint8Array) => {
          resolve(new Uint8Array(buffer));
        });
      } catch (cbErr) {
        reject(cbErr);
      }
    });
  } catch (err: any) {
    throw new Error('Failed to generate encrypted PDF: ' + (err?.message || err));
  }
}