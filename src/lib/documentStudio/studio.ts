import { drawAnyText, textWidth } from './text';
import { degrees, EncryptedPDFError, PDFDocument, PDFName, rgb, StandardFonts, type PDFPage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import html2canvas from 'html2canvas';
import { renderAsync } from 'docx-preview';
import type {
  CropBounds,
  ExportResult,
  GeneratedPageOptions,
  OutputSequenceItem,
  PageEditorPreview,
  PageCard,
  RedactionBox,
  SourceItem,
  StudioSettings,
  TextRegion,
} from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const A4_SIZE: [number, number] = [595.28, 841.89];
const LETTER_SIZE: [number, number] = [612, 792];
const THUMBNAIL_WIDTH = 150;

function bytesArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function createId(): string {
  return crypto.randomUUID();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be decoded.'));
    image.src = url;
  });
}

function imageDataUrl(image: HTMLImageElement, maxWidth: number): string {
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

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
  const loadingTask = pdfjsLib.getDocument({
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

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
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

function cropValues(crop: CropBounds): CropBounds {
  const clamp = (value: number) => Math.min(0.45, Math.max(0, value));
  const next = {
    top: clamp(crop.top),
    right: clamp(crop.right),
    bottom: clamp(crop.bottom),
    left: clamp(crop.left),
  };
  if (next.left + next.right > 0.8) next.right = 0.8 - next.left;
  if (next.top + next.bottom > 0.8) next.bottom = 0.8 - next.top;
  return next;
}

function dataUrlBytes(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(',')[1];
  const decoded = atob(encoded);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

function drawRedactionBoxes(
  context: CanvasRenderingContext2D,
  boxes: RedactionBox[],
  width: number,
  height: number,
): void {
  context.fillStyle = '#000000';
  boxes.forEach((box) => {
    context.fillRect(box.x * width, box.y * height, box.width * width, box.height * height);
  });
}

function cropCanvas(
  source: HTMLCanvasElement,
  crop: CropBounds,
  rotation: number,
  redactions: RedactionBox[],
): HTMLCanvasElement {
  const bounds = cropValues(crop);
  const cropX = Math.round(source.width * bounds.left);
  const cropY = Math.round(source.height * bounds.top);
  const cropWidth = Math.max(1, Math.round(source.width * (1 - bounds.left - bounds.right)));
  const cropHeight = Math.max(1, Math.round(source.height * (1 - bounds.top - bounds.bottom)));
  const angle = ((rotation % 360) + 360) % 360;
  const rotated = angle === 90 || angle === 270;
  const canvas = window.document.createElement('canvas');
  canvas.width = rotated ? cropHeight : cropWidth;
  canvas.height = rotated ? cropWidth : cropHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(angle * Math.PI / 180);
  context.drawImage(
    source,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    -cropWidth / 2,
    -cropHeight / 2,
    cropWidth,
    cropHeight,
  );
  context.setTransform(1, 0, 0, 1, 0, 0);
  drawRedactionBoxes(context, redactions, canvas.width, canvas.height);
  return canvas;
}

async function loadPdfPageCanvas(
  source: SourceItem,
  pageNumber: number,
  rotation: number,
  scale: number,
): Promise<{ canvas: HTMLCanvasElement; textRegions: TextRegion[] }> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(source.bytes),
    password: source.pdfPassword,
  });
  let document: pdfjsLib.PDFDocumentProxy | undefined;
  let page: pdfjsLib.PDFPageProxy | undefined;
  try {
    document = await loadingTask.promise;
    page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale, rotation: page.rotate + rotation });
    const canvas = window.document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    await page.render({ canvasContext: context, canvas, viewport }).promise;

    const content = await page.getTextContent();
    const textRegions = content.items.flatMap((entry) => {
      if (!('str' in entry) || !('transform' in entry) || !entry.str.trim()) return [];
      const transform = pdfjsLib.Util.transform(viewport.transform, entry.transform);
      const left = transform[4];
      const baseline = transform[5];
      const lineHeight = Math.hypot(transform[2], transform[3]);
      const width = Math.hypot(transform[0], transform[1]) * entry.width;
      const top = baseline - lineHeight;
      return [{
        text: entry.str.trim(),
        box: {
          x: Math.max(0, left / canvas.width),
          y: Math.max(0, top / canvas.height),
          width: Math.min(width / canvas.width, 1 - Math.max(0, left / canvas.width)),
          height: Math.min(lineHeight / canvas.height, 1 - Math.max(0, top / canvas.height)),
        },
      }];
    }).filter((region) => region.box.width > 0 && region.box.height > 0);
    return { canvas, textRegions };
  } finally {
    page?.cleanup();
    document?.cleanup();
    await loadingTask.destroy();
  }
}

export async function renderPageEditorPreview(
  source: SourceItem,
  page: PageCard,
  rotation: number,
  crop: CropBounds,
): Promise<PageEditorPreview> {
  if (source.kind === 'pdf') {
    const rendered = await loadPdfPageCanvas(source, page.originalPageNumber, rotation, 1.8);
    try {
      const preview = cropCanvas(rendered.canvas, crop, 0, []);
      const bounds = cropValues(crop);
      const cropX = bounds.left;
      const cropY = bounds.top;
      const cropWidth = 1 - bounds.left - bounds.right;
      const cropHeight = 1 - bounds.top - bounds.bottom;
      const textRegions = rendered.textRegions.flatMap((region) => {
        const x = (region.box.x - cropX) / cropWidth;
        const y = (region.box.y - cropY) / cropHeight;
        const right = (region.box.x + region.box.width - cropX) / cropWidth;
        const bottom = (region.box.y + region.box.height - cropY) / cropHeight;
        if (right <= 0 || bottom <= 0 || x >= 1 || y >= 1) return [];
        const box = {
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.min(1, right) - Math.max(0, x),
          height: Math.min(1, bottom) - Math.max(0, y),
        };
        return box.width > 0 && box.height > 0 ? [{ text: region.text, box }] : [];
      });
      return {
        image: preview.toDataURL('image/png'),
        width: preview.width,
        height: preview.height,
        textRegions,
      };
    } finally {
      rendered.canvas.width = 0;
      rendered.canvas.height = 0;
    }
  }

  const url = source.kind === 'docx'
    ? page.thumbnailUrl
    : URL.createObjectURL(new Blob([bytesArrayBuffer(source.bytes)], { type: source.kind === 'custom' ? 'image/png' : source.mimeType }));
  try {
    const image = await loadImage(url);
    const canvas = window.document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    context.drawImage(image, 0, 0);
    const preview = cropCanvas(canvas, crop, rotation, []);
    canvas.width = 0;
    canvas.height = 0;
    return {
      image: preview.toDataURL('image/png'),
      width: preview.width,
      height: preview.height,
      textRegions: [],
    };
  } finally {
    if (source.kind !== 'docx') URL.revokeObjectURL(url);
  }
}

export type PageImageFormat = 'png' | 'jpeg' | 'webp';

export async function renderOutputPageImage(
  source: SourceItem,
  item: OutputSequenceItem,
  format: PageImageFormat,
  quality = 0.92,
): Promise<Blob> {
  let canvas: HTMLCanvasElement;
  if (source.kind === 'pdf') {
    const rendered = await loadPdfPageCanvas(source, item.page.originalPageNumber, item.rotation, 2);
    try {
      canvas = cropCanvas(rendered.canvas, item.crop, 0, item.redactions);
    } finally {
      rendered.canvas.width = 0;
      rendered.canvas.height = 0;
    }
  } else {
    const url = source.kind === 'docx'
      ? item.page.thumbnailUrl
      : URL.createObjectURL(new Blob([bytesArrayBuffer(source.bytes)], { type: source.kind === 'custom' ? 'image/png' : source.mimeType }));
    try {
      const image = await loadImage(url);
      const original = window.document.createElement('canvas');
      original.width = image.naturalWidth;
      original.height = image.naturalHeight;
      try {
        const context = original.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
        context.drawImage(image, 0, 0);
        canvas = cropCanvas(original, item.crop, item.rotation, item.redactions);
      } finally {
        original.width = 0;
        original.height = 0;
      }
    } finally {
      if (source.kind !== 'docx') URL.revokeObjectURL(url);
    }
  }

  let encodedCanvas = canvas;
  if (format === 'jpeg') {
    encodedCanvas = window.document.createElement('canvas');
    encodedCanvas.width = canvas.width;
    encodedCanvas.height = canvas.height;
    const context = encodedCanvas.getContext('2d');
    if (!context) {
      canvas.width = 0;
      canvas.height = 0;
      throw new Error('Canvas context is unavailable for JPG export.');
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, encodedCanvas.width, encodedCanvas.height);
    context.drawImage(canvas, 0, 0);
  }
  const mimeType = `image/${format}`;
  try {
    return await new Promise<Blob>((resolve, reject) => {
      encodedCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`This browser could not encode the page as ${format.toUpperCase()}.`));
      }, mimeType, quality);
    });
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (encodedCanvas !== canvas) {
      encodedCanvas.width = 0;
      encodedCanvas.height = 0;
    }
  }
}

async function renderRedactedPdf(
  source: SourceItem,
  page: PageCard,
  crop: CropBounds,
  rotation: number,
  redactions: RedactionBox[],
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const rendered = await loadPdfPageCanvas(source, page.originalPageNumber, rotation, 2);
  try {
    const canvas = cropCanvas(rendered.canvas, crop, 0, redactions);
    return { bytes: dataUrlBytes(canvas.toDataURL('image/png')), width: canvas.width, height: canvas.height };
  } finally {
    rendered.canvas.width = 0;
    rendered.canvas.height = 0;
  }
}

async function prepareRaster(
  source: SourceItem,
  page: PageCard,
  crop: CropBounds,
  rotation: number,
  redactions: RedactionBox[],
  compression: StudioSettings['compression'],
): Promise<{ bytes: Uint8Array; format: 'png' | 'jpg'; naturalWidth: number; naturalHeight: number }> {
  const url = source.kind === 'docx'
    ? page.thumbnailUrl
    : URL.createObjectURL(new Blob([bytesArrayBuffer(source.bytes)], { type: source.kind === 'custom' ? 'image/png' : source.mimeType }));
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    context.drawImage(image, 0, 0);
    const transformed = cropCanvas(canvas, crop, rotation, redactions);
    canvas.width = 0;
    canvas.height = 0;
    const transformedContext = transformed.getContext('2d');
    if (!transformedContext) throw new Error('Canvas rendering is unavailable in this browser.');
    const lossy = compression !== 'quality';
    if (lossy) {
      transformedContext.globalCompositeOperation = 'destination-over';
      transformedContext.fillStyle = '#ffffff';
      transformedContext.fillRect(0, 0, transformed.width, transformed.height);
      transformedContext.globalCompositeOperation = 'source-over';
    }
    const quality = compression === 'target-500kb' ? 0.58 : compression === 'target-2mb' ? 0.72 : 0.86;
    const dataUrl = lossy ? transformed.toDataURL('image/jpeg', quality) : transformed.toDataURL('image/png');
    const result = {
      bytes: dataUrlBytes(dataUrl),
      format: lossy ? 'jpg' as const : 'png' as const,
      naturalWidth: transformed.width,
      naturalHeight: transformed.height,
    };
    transformed.width = 0;
    transformed.height = 0;
    return result;
  } finally {
    if (source.kind !== 'docx') URL.revokeObjectURL(url);
  }
}

function getTargetPageSize(
  standard: StudioSettings['pageStandard'],
  width: number,
  height: number,
): [number, number] {
  if (standard === 'a4') return A4_SIZE;
  if (standard === 'letter') return LETTER_SIZE;
  return [width, height];
}

function drawRedactions(
  page: PDFPage,
  boxes: OutputSequenceItem['redactions'],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  for (const box of boxes) {
    page.drawRectangle({
      x: x + box.x * width,
      y: y + (1 - box.y - box.height) * height,
      width: box.width * width,
      height: box.height * height,
      color: rgb(0, 0, 0),
    });
  }
}

export async function exportMasterPdf(
  sequence: OutputSequenceItem[],
  sources: Map<string, SourceItem>,
  settings: StudioSettings,
): Promise<ExportResult> {
  if (sequence.length === 0) throw new Error('Select at least one page before exporting.');
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);
  const boldFont = await output.embedFont(StandardFonts.HelveticaBold);
  const pdfSources = new Map<string, PDFDocument>();
  const margin = settings.marginMm * 72 / 25.4;
  output.setTitle(settings.documentTitle || 'Master Document');
  if (settings.documentAuthor) output.setAuthor(settings.documentAuthor);
  if (settings.documentSubject) output.setSubject(settings.documentSubject);
  if (settings.documentKeywords.trim()) {
    output.setKeywords(settings.documentKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean));
  }

  for (const item of sequence) {
    const source = sources.get(item.page.sourceId);
    if (!source) throw new Error(`The source for "${item.page.sourceName}" is no longer available.`);

    let raster: Awaited<ReturnType<typeof prepareRaster>> | undefined;
    let embeddedPage: Awaited<ReturnType<typeof output.embedPdf>>[number] | undefined;
    let nativePage: PDFPage | undefined;
    if (source.kind === 'pdf' && (source.isEncrypted || item.redactions.length > 0)) {
      const redacted = await renderRedactedPdf(source, item.page, item.crop, item.rotation, item.redactions);
      raster = {
        bytes: redacted.bytes,
        format: 'png',
        naturalWidth: redacted.width,
        naturalHeight: redacted.height,
      };
    } else if (source.kind === 'pdf') {
      let sourcePdf = pdfSources.get(source.id);
      if (!sourcePdf) {
        sourcePdf = await PDFDocument.load(source.bytes);
        pdfSources.set(source.id, sourcePdf);
      }
      const sourcePage = sourcePdf.getPage(item.page.originalPageNumber - 1);
      const crop = cropValues(item.crop);
      const originalCropBox = sourcePage.getCropBox();
      if (crop.top || crop.right || crop.bottom || crop.left) {
        sourcePage.setCropBox(
          originalCropBox.x + crop.left * originalCropBox.width,
          originalCropBox.y + crop.bottom * originalCropBox.height,
          originalCropBox.width * (1 - crop.left - crop.right),
          originalCropBox.height * (1 - crop.top - crop.bottom),
        );
      }
      if (settings.pageStandard === 'preserve' && settings.marginMm === 0) {
        [nativePage] = await output.copyPages(sourcePdf, [item.page.originalPageNumber - 1]);
        const rotation = (nativePage.getRotation().angle + item.rotation + 360) % 360;
        if (rotation !== nativePage.getRotation().angle) nativePage.setRotation(degrees(rotation));
      } else {
        [embeddedPage] = await output.embedPdf(sourcePdf, [item.page.originalPageNumber - 1]);
      }
      if (crop.top || crop.right || crop.bottom || crop.left) {
        sourcePage.setCropBox(
          originalCropBox.x,
          originalCropBox.y,
          originalCropBox.width,
          originalCropBox.height,
        );
      }
    } else {
      raster = await prepareRaster(source, item.page, item.crop, item.rotation, item.redactions, settings.compression);
    }

    const nativeCropBox = nativePage?.getCropBox();
    const naturalWidth = nativeCropBox?.width ?? embeddedPage?.width ?? raster!.naturalWidth * 0.75;
    const naturalHeight = nativeCropBox?.height ?? embeddedPage?.height ?? raster!.naturalHeight * 0.75;
    const [pageWidth, pageHeight] = getTargetPageSize(
      settings.pageStandard,
      naturalWidth,
      naturalHeight,
    );
    const page = nativePage ?? output.addPage([pageWidth, pageHeight]);
    if (nativePage) output.addPage(nativePage);

    const contentX = nativeCropBox?.x ?? margin;
    const contentY = nativeCropBox?.y ?? margin;
    const contentWidth = nativeCropBox?.width ?? Math.max(1, pageWidth - margin * 2);
    const contentHeight = nativeCropBox?.height ?? Math.max(1, pageHeight - margin * 2);
    const isImage = source.kind === 'image';
    const rotation = ((item.rotation % 360) + 360) % 360;
    const drawRotation = raster ? 0 : rotation;
    const rotated = drawRotation === 90 || drawRotation === 270;
    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (nativePage) {
      drawWidth = naturalWidth;
      drawHeight = naturalHeight;
    } else if (isImage && item.fitMode === 'original') {
      drawWidth = naturalWidth;
      drawHeight = naturalHeight;
    } else {
      const sourceWidth = rotated ? naturalHeight : naturalWidth;
      const sourceHeight = rotated ? naturalWidth : naturalHeight;
      const scale = isImage && item.fitMode === 'fill'
        ? Math.max(contentWidth / sourceWidth, contentHeight / sourceHeight)
        : Math.min(contentWidth / sourceWidth, contentHeight / sourceHeight);
      drawWidth = naturalWidth * scale;
      drawHeight = naturalHeight * scale;
    }
    drawX = contentX + (contentWidth - (rotated ? drawHeight : drawWidth)) / 2;
    drawY = contentY + (contentHeight - (rotated ? drawWidth : drawHeight)) / 2;

    if (nativePage) {
      drawWidth = 0;
      drawHeight = 0;
      drawX = 0;
      drawY = 0;
    } else if (embeddedPage) {
      page.drawPage(embeddedPage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
        rotate: degrees(drawRotation),
      });
    } else {
      const embeddedImage = raster!.format === 'jpg'
        ? await output.embedJpg(raster!.bytes)
        : await output.embedPng(raster!.bytes);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
        rotate: degrees(drawRotation),
      });
    }
    if (isImage && item.fitMode === 'fill') {
      const white = rgb(1, 1, 1);
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: contentY, color: white });
      page.drawRectangle({ x: 0, y: contentY + contentHeight, width: pageWidth, height: Math.max(0, pageHeight - contentY - contentHeight), color: white });
      page.drawRectangle({ x: 0, y: contentY, width: contentX, height: contentHeight, color: white });
      page.drawRectangle({ x: contentX + contentWidth, y: contentY, width: Math.max(0, pageWidth - contentX - contentWidth), height: contentHeight, color: white });
    }
    if (!raster) drawRedactions(page, item.redactions, contentX, contentY, contentWidth, contentHeight);
  }

  const contentsEntries = sequence
    .map((item, index) => ({ item, pageIndex: index, title: item.contentsTitle?.trim() }))
    .filter((entry): entry is { item: OutputSequenceItem; pageIndex: number; title: string } => Boolean(entry.title));
  let contentsPageCount = 0;
  if (contentsEntries.length > 0) {
    const [pageWidth, pageHeight] = getTargetPageSize(settings.pageStandard, ...A4_SIZE);
    const rowHeight = 34;
    const firstRowY = pageHeight - 154;
    const rowsPerPage = Math.max(1, Math.floor((firstRowY - 62) / rowHeight));
    contentsPageCount = Math.ceil(contentsEntries.length / rowsPerPage);
    const pages = Array.from({ length: contentsPageCount }, (_, index) => output.insertPage(index, [pageWidth, pageHeight]));

    pages.forEach((contentsPage) => {
      contentsPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.99, 0.992, 1) });
      contentsPage.drawRectangle({
        x: 36,
        y: pageHeight - 122,
        width: pageWidth - 72,
        height: 70,
        color: rgb(0.93, 0.95, 1),
      });
      contentsPage.drawRectangle({
        x: 36,
        y: pageHeight - 122,
        width: 5,
        height: 70,
        color: rgb(0.27, 0.32, 0.85),
      });
    });

    for (const [index, entry] of contentsEntries.entries()) {
      const contentsPageIndex = Math.floor(index / rowsPerPage);
      const rowIndex = index % rowsPerPage;
      const contentsPage = pages[contentsPageIndex];
      const y = firstRowY - rowIndex * rowHeight;
      const titleSize = 11;
      const pageLabel = String(entry.pageIndex + contentsPageCount + 1).padStart(2, '0');
      const pageLabelWidth = font.widthOfTextAtSize(pageLabel, titleSize);
      const titleWidth = Math.max(1, pageWidth - 142 - pageLabelWidth);
      const title = textWidth(font, entry.title, titleSize) <= titleWidth
        ? entry.title
        : (() => {
          let truncated = entry.title;
          while (truncated.length > 1 && textWidth(font, `${truncated}...`, titleSize) > titleWidth) {
            truncated = truncated.slice(0, -1);
          }
          return `${truncated}...`;
        })();
      await drawAnyText(output, contentsPage, title, { x: 62, y, size: titleSize, font, color: [0.12, 0.16, 0.23] });
      const rowLineY = y - 10;
      contentsPage.drawLine({
        start: { x: 56, y: rowLineY },
        end: { x: pageWidth - 56, y: rowLineY },
        thickness: 0.55,
        color: rgb(0.88, 0.9, 0.94),
      });
      contentsPage.drawRectangle({
        x: pageWidth - 84,
        y: y - 5,
        width: 30,
        height: 20,
        color: rgb(0.91, 0.95, 1),
      });
      contentsPage.drawText(pageLabel, {
        x: pageWidth - 69 - pageLabelWidth / 2,
        y,
        size: titleSize,
        font,
        color: rgb(0.19, 0.27, 0.68),
      });
      const annotation = output.context.register(output.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [50, y - 10, pageWidth - 50, y + 18],
        Border: [0, 0, 0],
        Dest: [output.getPage(entry.pageIndex + contentsPageCount).ref, PDFName.of('Fit')],
      }));
      contentsPage.node.addAnnot(annotation);
    }

    pages.forEach((contentsPage, index) => {
      contentsPage.drawText('YOUR DOCUMENT, AT A GLANCE', {
        x: 54,
        y: pageHeight - 76,
        size: 8,
        font: boldFont,
        color: rgb(0.31, 0.36, 0.72),
      });
      contentsPage.drawText(index === 0 ? 'Contents' : 'Contents (continued)', {
        x: 54,
        y: pageHeight - 101,
        size: 21,
        font: boldFont,
        color: rgb(0.06, 0.09, 0.16),
      });
      contentsPage.drawText(index === 0 ? 'Select a heading to jump to that page.' : 'More sections in this document.', {
        x: 54,
        y: pageHeight - 116,
        size: 9,
        font,
        color: rgb(0.34, 0.38, 0.48),
      });
    });
  }

  const pages = output.getPages();
  for (const [index, page] of pages.entries()) {
    const { width: pageWidth, height: pageHeight } = page.getSize();
    if (settings.watermarkText.trim()) {
      await drawAnyText(output, page, settings.watermarkText.trim(), {
        x: pageWidth * 0.12,
        y: pageHeight * 0.43,
        size: Math.min(pageWidth, pageHeight) * 0.1,
        font: boldFont,
        bold: true,
        color: [0.42, 0.45, 0.5],
        opacity: settings.watermarkOpacity / 100,
        rotate: degrees(settings.watermarkAngle),
      });
    }
    if (settings.numberPosition === 'none' || (settings.skipFirstPage && index === contentsPageCount)) continue;
    const label = settings.numberFormat
      .replaceAll('{page}', String(index + 1))
      .replaceAll('{total}', String(pages.length));
    const size = 10;
    const labelWidth = textWidth(font, label, size);
    const x = settings.numberPosition === 'bottom-center'
      ? (pageWidth - labelWidth) / 2
      : pageWidth - margin - labelWidth;
    const y = settings.numberPosition === 'top-right'
      ? pageHeight - margin - size
      : Math.max(12, margin / 2);
    await drawAnyText(output, page, label, { x, y, size, font, color: [0.35, 0.38, 0.42] });
  }

  const bytes = await output.save({ useObjectStreams: true });
  const targetBytes = settings.compression === 'target-2mb'
    ? 2 * 1024 * 1024
    : settings.compression === 'target-500kb'
      ? 500 * 1024
      : null;
  return { bytes, targetBytes, targetMet: targetBytes === null || bytes.byteLength <= targetBytes };
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  outputFileName: 'master-document',
  documentTitle: '',
  documentAuthor: '',
  documentSubject: '',
  documentKeywords: '',
  pageStandard: 'a4',
  numberPosition: 'bottom-center',
  numberFormat: 'Page {page} of {total}',
  skipFirstPage: false,
  marginMm: 0,
  watermarkText: '',
  watermarkOpacity: 25,
  watermarkAngle: -35,
  compression: 'quality',
  protectOutput: false,
  outputUserPassword: '',
  outputOwnerPassword: '',
  allowOutputPrinting: true,
  allowOutputCopying: false,
};
