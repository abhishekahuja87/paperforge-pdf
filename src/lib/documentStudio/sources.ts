import { EncryptedPDFError, PDFDocument } from 'pdf-lib';
import { pdfjsLib } from './pdfjs';
import html2canvas from 'html2canvas';
import { renderAsync } from 'docx-preview';
import type { GeneratedPageOptions, PageCard, SourceItem } from './types';
import { A4_SIZE, THUMBNAIL_WIDTH, bytesArrayBuffer, createId, imageDataUrl, loadImage, wrapText } from './shared';
import { PDFJS_ASSETS } from '../pdf/pdfjsAssets';

async function imagePages(source: SourceItem): Promise<PageCard[]> {
  const url = URL.createObjectURL(new Blob([bytesArrayBuffer(source.bytes)], { type: source.mimeType }));
  try {
    const image = await loadImage(url);
    return [{
      id: createId(),
      sourceId: source.id,
      sourceName: source.fileName,
      sourceKind: source.kind,
      originalPageNumber: 1,
      thumbnailUrl: imageDataUrl(image, THUMBNAIL_WIDTH),
      width: image.naturalWidth,
      height: image.naturalHeight,
    }];
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function pdfPages(source: SourceItem): Promise<PageCard[]> {
  const loadingTask = pdfjsLib.getDocument({ ...PDFJS_ASSETS,
    data: new Uint8Array(source.bytes),
    password: source.pdfPassword,
  });
  let document: pdfjsLib.PDFDocumentProxy | undefined;
  try {
    try {
      document = await loadingTask.promise;
    } catch (reason) {
      if (reason && typeof reason === 'object' && 'name' in reason && reason.name === 'PasswordException') {
        throw new Error(source.pdfPassword ? 'PDF_PASSWORD_INVALID' : 'PDF_PASSWORD_REQUIRED');
      }
      throw reason;
    }
    const pages: PageCard[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      try {
        const unitViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH / unitViewport.width });
        const canvas = window.document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
        await page.render({ canvasContext: context, canvas, viewport }).promise;
        pages.push({
          id: createId(),
          sourceId: source.id,
          sourceName: source.fileName,
          sourceKind: 'pdf',
          originalPageNumber: pageNumber,
          thumbnailUrl: canvas.toDataURL('image/png'),
          width: unitViewport.width,
          height: unitViewport.height,
        });
        canvas.width = 0;
        canvas.height = 0;
      } finally {
        page.cleanup();
      }
    }
    return pages;
  } finally {
    document?.cleanup();
    await loadingTask.destroy();
  }
}

async function docxPages(source: SourceItem): Promise<PageCard[]> {
  const frame = window.document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.srcdoc = '<!doctype html><html><head></head><body></body></html>';
  frame.style.position = 'fixed';
  frame.style.left = '-10000px';
  frame.style.top = '0';
  frame.style.width = '900px';
  frame.style.height = '1200px';
  frame.style.border = '0';
  const frameLoaded = new Promise<void>((resolve, reject) => {
    frame.addEventListener('load', () => resolve(), { once: true });
    frame.addEventListener('error', () => reject(new Error('Could not initialize the DOCX preview frame.')), { once: true });
  });
  window.document.body.append(frame);
  await frameLoaded;
  const frameDocument = frame.contentDocument;
  if (!frameDocument?.body) {
    frame.remove();
    throw new Error('Could not initialize the DOCX preview document.');
  }
  const container = frameDocument.createElement('div');
  container.style.position = 'fixed';
  container.style.width = '900px';
  container.style.background = '#fff';
  frameDocument.body.append(container);

  try {
    await renderAsync(new Uint8Array(source.bytes), container, undefined, {
      breakPages: true,
      inWrapper: true,
      renderAltChunks: false,
    });
    const renderedPages = Array.from(container.querySelectorAll<HTMLElement>('.docx'));
    const nodes = renderedPages.length > 0 ? renderedPages : [container];
    const pages: PageCard[] = [];

    for (const [index, node] of nodes.entries()) {
      const canvas = await html2canvas(node, { backgroundColor: '#ffffff', scale: 1 });
      pages.push({
        id: createId(),
        sourceId: source.id,
        sourceName: source.fileName,
        sourceKind: 'docx',
        originalPageNumber: index + 1,
        thumbnailUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
      canvas.width = 0;
      canvas.height = 0;
    }
    return pages;
  } finally {
    frame.remove();
  }
}

export async function createSource(file: File, pdfPassword?: string): Promise<{ source: SourceItem; pages: PageCard[] }> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const kind = file.type === 'application/pdf' || extension === 'pdf'
    ? 'pdf'
    : extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ? 'docx'
      : 'image';
  if (kind === 'image' && !['png', 'jpg', 'jpeg', 'webp'].includes(extension ?? '')) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }

  const source: SourceItem = {
    id: createId(),
    fileName: file.name,
    fileSize: file.size,
    kind,
    mimeType: file.type || (kind === 'pdf'
      ? 'application/pdf'
      : kind === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : extension === 'jpg' || extension === 'jpeg'
          ? 'image/jpeg'
          : `image/${extension}`),
    bytes: new Uint8Array(await file.arrayBuffer()),
    ...(kind === 'pdf' && pdfPassword ? { pdfPassword } : {}),
  };
  const pages = kind === 'pdf'
    ? await pdfPages(source)
    : kind === 'docx'
      ? await docxPages(source)
      : await imagePages(source);
  if (kind === 'pdf') {
    if (pdfPassword) {
      source.isEncrypted = true;
    } else {
      try {
        await PDFDocument.load(source.bytes);
      } catch (reason) {
        if (reason instanceof EncryptedPDFError || (reason instanceof Error && reason.name === 'EncryptedPDFError')) {
          source.isEncrypted = true;
        } else {
          throw reason;
        }
      }
    }
  }
  return { source, pages };
}

export function createCustomPage(options: GeneratedPageOptions): { source: SourceItem; page: PageCard } {
  const [width, height] = A4_SIZE.map((points) => Math.round(points * 96 / 72));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  if (options.border) {
    context.strokeStyle = '#334155';
    context.lineWidth = 2;
    context.strokeRect(70, 70, width - 140, height - 140);
  }
  const contentLeft = 100;
  const contentWidth = width - 200;
  if (options.type === 'cover') {
    context.textAlign = 'center';
    context.fillStyle = '#0f172a';
    context.font = 'bold 48px Arial';
    context.fillText(options.title || 'Untitled', width / 2, height * 0.38, contentWidth);
    context.fillStyle = '#475569';
    context.font = '26px Arial';
    wrapText(context, options.subtitle, contentWidth).forEach((line, index) => {
      context.fillText(line, width / 2, height * 0.38 + 54 + index * 36, contentWidth);
    });
    context.font = '20px Arial';
    context.fillText([options.author, options.date].filter(Boolean).join(' · '), width / 2, height * 0.72);
  } else if (options.type === 'note') {
    context.textAlign = 'left';
    context.fillStyle = '#0f172a';
    context.font = 'bold 34px Arial';
    context.fillText(options.title || 'Note', contentLeft, 150, contentWidth);
    context.fillStyle = '#1e293b';
    context.font = '20px Arial';
    let y = 210;
    const text = options.text.replace(/^#{1,6}\s+/gm, '').replace(/[*_`]/g, '');
    for (const line of wrapText(context, text, contentWidth)) {
      if (y > height - 100) break;
      context.fillText(line, contentLeft, y, contentWidth);
      y += 31;
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  const decoded = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  const source: SourceItem = {
    id: createId(),
    fileName: options.type === 'blank' ? 'Blank spacer' : options.title || (options.type === 'cover' ? 'Cover page' : 'Custom note'),
    fileSize: bytes.length,
    kind: 'custom',
    mimeType: 'image/png',
    bytes,
  };
  const page: PageCard = {
    id: createId(),
    sourceId: source.id,
    sourceName: source.fileName,
    sourceKind: 'custom',
    originalPageNumber: 1,
    thumbnailUrl: dataUrl,
    width,
    height,
  };
  canvas.width = 0;
  canvas.height = 0;
  return { source, page };
}
