import { pdfjsLib } from './pdfjs';
import type { CropBounds, OutputSequenceItem, PageEditorPreview, PageCard, RedactionBox, SourceItem, TextRegion } from './types';
import { bytesArrayBuffer, cropValues, loadImage } from './shared';
import { PDFJS_ASSETS } from '../pdf/pdfjsAssets';

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

export function cropCanvas(
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

export async function loadPdfPageCanvas(
  source: SourceItem,
  pageNumber: number,
  rotation: number,
  scale: number,
): Promise<{ canvas: HTMLCanvasElement; textRegions: TextRegion[] }> {
  const loadingTask = pdfjsLib.getDocument({ ...PDFJS_ASSETS,
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
