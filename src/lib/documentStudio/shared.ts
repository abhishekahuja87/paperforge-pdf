import type { CropBounds } from './types';

export const A4_SIZE: [number, number] = [595.28, 841.89];

export const LETTER_SIZE: [number, number] = [612, 792];

export const THUMBNAIL_WIDTH = 150;

export function bytesArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function createId(): string {
  return crypto.randomUUID();
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be decoded.'));
    image.src = url;
  });
}

export function imageDataUrl(image: HTMLImageElement, maxWidth: number): string {
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

export function dataUrlBytes(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(',')[1];
  const decoded = atob(encoded);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

export function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

export function cropValues(crop: CropBounds): CropBounds {
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
