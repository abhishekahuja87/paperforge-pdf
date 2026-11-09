import { degrees, rgb, type Degrees, type PDFDocument, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * The built-in PDF fonts only cover Western European letters. Text in any other script (Hindi, Arabic, Chinese,
 * Cyrillic and so on) is drawn on a canvas with the browser's own fonts and placed as a sharp image instead, the
 * same way the cover and note pages are made. Text the built-in font can show stays real, selectable text.
 */

const FONT_CSS = (size: number, bold: boolean) => `${bold ? 'bold ' : ''}${size}px system-ui, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif`;
const SCALE = 4;

export function isEncodable(font: PDFFont, text: string): boolean {
  try {
    font.encodeText(text);
    return true;
  } catch {
    return false;
  }
}

let measureContext: CanvasRenderingContext2D | null = null;

/** Width of the text in PDF points at the given size, for text the built-in font can and cannot show. */
export function textWidth(font: PDFFont, text: string, size: number, bold = false): number {
  if (isEncodable(font, text)) return font.widthOfTextAtSize(text, size);
  measureContext ??= document.createElement('canvas').getContext('2d');
  if (!measureContext) return text.length * size * 0.6;
  measureContext.font = FONT_CSS(size, bold);
  return measureContext.measureText(text).width;
}

export interface AnyTextOptions {
  x: number;
  y: number;
  size: number;
  font: PDFFont;
  bold?: boolean;
  /** Red, green and blue from 0 to 1. */
  color: [number, number, number];
  opacity?: number;
  rotate?: Degrees;
}

/** Draws text at its baseline position, as real text when the font allows it and as an image otherwise. */
export async function drawAnyText(output: PDFDocument, page: PDFPage, text: string, o: AnyTextOptions): Promise<void> {
  const [r, g, b] = o.color;
  if (isEncodable(o.font, text)) {
    page.drawText(text, { x: o.x, y: o.y, size: o.size, font: o.font, color: rgb(r, g, b), opacity: o.opacity, rotate: o.rotate });
    return;
  }
  const width = Math.max(1, textWidth(o.font, text, o.size, o.bold));
  const height = o.size * 1.4;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((width + 2) * SCALE);
  canvas.height = Math.ceil(height * SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering is unavailable in this browser.');
  ctx.font = FONT_CSS(o.size * SCALE, Boolean(o.bold));
  ctx.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, o.size * 1.1 * SCALE);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error('Could not draw some of the text.');
  const image = await output.embedPng(new Uint8Array(await blob.arrayBuffer()));
  // The image sits 0.3 x size below the baseline. Rotation turns it about its lower-left corner, so move that corner to match.
  const angle = ((o.rotate?.angle ?? 0) * Math.PI) / 180;
  const drop = o.size * 0.3;
  page.drawImage(image, {
    x: o.x + drop * Math.sin(angle),
    y: o.y - drop * Math.cos(angle),
    width: width + 2,
    height,
    opacity: o.opacity,
    rotate: o.rotate ? degrees(o.rotate.angle) : undefined,
  });
}
