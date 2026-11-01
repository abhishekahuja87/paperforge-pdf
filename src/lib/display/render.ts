import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';
import type { DisplaySlide, DisplaySourceKind } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_RENDER_WIDTH = 1600;
const JPEG_QUALITY = 0.88;

function createSlide(
  sourceName: string,
  sourceKind: DisplaySourceKind,
  pageNumber: number,
  imageDataUrl: string,
): DisplaySlide {
  return {
    id: crypto.randomUUID(),
    title: `${sourceName} · ${pageNumber}`,
    sourceName,
    sourceKind,
    pageNumber,
    imageDataUrl,
    durationSeconds: null,
    caption: '',
    included: true,
  };
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

async function renderPdf(file: File): Promise<DisplaySlide[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let document: pdfjsLib.PDFDocumentProxy | undefined;
  try {
    try {
      document = await loadingTask.promise;
    } catch (reason) {
      if (reason && typeof reason === 'object' && 'name' in reason && reason.name === 'PasswordException') {
        throw new Error('This PDF is password-protected. Unlock it before adding it to a show.');
      }
      throw reason;
    }

    const slides: DisplaySlide[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1.6, MAX_RENDER_WIDTH / baseViewport.width) });
        const canvas = window.document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, canvas, viewport }).promise;
        slides.push(createSlide(file.name, 'pdf', pageNumber, canvasToDataUrl(canvas)));
      } finally {
        page.cleanup();
      }
    }
    return slides;
  } finally {
    document?.cleanup();
    await loadingTask.destroy();
  }
}

async function renderDocx(file: File): Promise<DisplaySlide[]> {
  const frame = window.document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.title = 'Temporary local DOCX rendering frame';
  frame.srcdoc = '<!doctype html><html><head></head><body></body></html>';
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '900px',
    height: '1200px',
    border: '0',
  });
  const frameLoaded = new Promise<void>((resolve, reject) => {
    frame.addEventListener('load', () => resolve(), { once: true });
    frame.addEventListener('error', () => reject(new Error('Could not initialize the local Word preview.')), { once: true });
  });
  window.document.body.append(frame);
  try {
    await frameLoaded;
    const frameDocument = frame.contentDocument;
    if (!frameDocument?.body) throw new Error('Could not initialize the local Word preview.');
    const container = frameDocument.createElement('div');
    container.style.width = '900px';
    container.style.background = '#ffffff';
    frameDocument.body.append(container);
    await renderAsync(new Uint8Array(await file.arrayBuffer()), container, undefined, {
      breakPages: true,
      inWrapper: true,
      renderAltChunks: false,
    });

    const renderedPages = Array.from(container.querySelectorAll<HTMLElement>('.docx'));
    const nodes = renderedPages.length > 0 ? renderedPages : [container];
    const slides: DisplaySlide[] = [];
    for (const [index, node] of nodes.entries()) {
      const canvas = await html2canvas(node, { backgroundColor: '#ffffff', scale: 1 });
      slides.push(createSlide(file.name, 'docx', index + 1, canvasToDataUrl(canvas)));
    }
    return slides;
  } finally {
    frame.remove();
  }
}

async function renderImage(file: File): Promise<DisplaySlide[]> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image format is not supported by the current browser, or the file could not be decoded.');
  }

  try {
    const scale = Math.min(1, MAX_RENDER_WIDTH / bitmap.width);
    const canvas = window.document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return [createSlide(file.name, 'image', 1, canvasToDataUrl(canvas))];
  } finally {
    bitmap.close();
  }
}

export async function renderDisplayFile(file: File): Promise<DisplaySlide[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (file.type === 'application/pdf' || extension === 'pdf') return renderPdf(file);
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || extension === 'docx'
  ) return renderDocx(file);
  if (file.type.startsWith('image/') || !file.type) return renderImage(file);
  throw new Error('Choose a PDF, DOCX Word document, or an image supported by your browser.');
}
