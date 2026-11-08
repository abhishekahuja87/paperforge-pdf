import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { parsePageRanges } from './split';

export type WatermarkFont = 'helvetica' | 'helvetica-bold' | 'courier';

export interface WatermarkOptions {
  fileBuffer: ArrayBuffer;
  text: string;
  fontSize: number;
  rotationAngle: number;
  opacity: number; // 0.05 to 1.0
  colorHex: string;
  fontChoice: WatermarkFont;
  scope: 'all' | 'odd' | 'even' | 'custom';
  rangeString?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (isNaN(bigint) || clean.length !== 6) {
    return { r: 0.5, g: 0.5, b: 0.5 };
  }
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

export async function addWatermarkToPdf(options: WatermarkOptions): Promise<Uint8Array> {
  const {
    fileBuffer,
    text,
    fontSize = 48,
    rotationAngle = 45,
    opacity = 0.25,
    colorHex = '#ef4444',
    fontChoice = 'helvetica-bold',
    scope = 'all',
    rangeString = '',
  } = options;

  if (!text.trim()) {
    throw new Error('Watermark text cannot be empty.');
  }

  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();

  const fontMap = {
    'helvetica': StandardFonts.Helvetica,
    'helvetica-bold': StandardFonts.HelveticaBold,
    'courier': StandardFonts.Courier,
  };
  const font = await pdfDoc.embedFont(fontMap[fontChoice]);

  // Determine targeted page indices
  let targetIndices: number[] = [];
  if (scope === 'all') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  } else if (scope === 'odd') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 0);
  } else if (scope === 'even') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 !== 0);
  } else {
    targetIndices = parsePageRanges(rangeString, totalPages);
  }

  const pages = pdfDoc.getPages();
  const { r, g, b } = hexToRgb(colorHex);
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  for (let i = 0; i < pages.length; i++) {
    if (!targetIndices.includes(i)) continue;

    const page = pages[i];
    const { width, height } = page.getSize();

    // Center point of page
    const centerX = width / 2;
    const centerY = height / 2;

    const rad = (rotationAngle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Offset coordinates so the text is centered on rotation axis
    const drawX = centerX - (textWidth / 2) * cos + (textHeight / 2) * sin;
    const drawY = centerY - (textWidth / 2) * sin - (textHeight / 2) * cos;

    page.drawText(text, {
      x: drawX,
      y: drawY,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      rotate: degrees(rotationAngle),
      opacity: Math.max(0.05, Math.min(1.0, opacity)),
    });
  }

  return await pdfDoc.save();
}