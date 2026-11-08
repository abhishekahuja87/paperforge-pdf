import { PDFDocument } from 'pdf-lib';
import { parsePageRanges } from './split';

export type CropUnit = 'pt' | 'mm' | 'in';

export interface CropMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CropPdfOptions {
  fileBuffer: ArrayBuffer;
  margins: CropMargins;
  unit: CropUnit;
  scope: 'all' | 'odd' | 'even' | 'custom';
  rangeString?: string;
}

/**
 * Converts mm or inches into standard PDF points (72 points = 1 inch).
 */
export function convertToPoints(value: number, unit: CropUnit): number {
  if (unit === 'mm') {
    return (value * 72) / 25.4;
  }
  if (unit === 'in') {
    return value * 72;
  }
  return value;
}

/**
 * Recalibrates CropBox and MediaBox boundaries on PDF pages in memory.
 */
export async function cropPdf(options: CropPdfOptions): Promise<Uint8Array> {
  const {
    fileBuffer,
    margins,
    unit,
    scope = 'all',
    rangeString = '',
  } = options;

  const topPt = convertToPoints(margins.top, unit);
  const bottomPt = convertToPoints(margins.bottom, unit);
  const leftPt = convertToPoints(margins.left, unit);
  const rightPt = convertToPoints(margins.right, unit);

  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();

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

  for (let i = 0; i < pages.length; i++) {
    if (!targetIndices.includes(i)) continue;

    const page = pages[i];
    // Work from the page's current visible box (it may not start at 0,0) and from the side each
    // margin lands on after the page's own rotation, so "top" always means the top you see.
    const box = page.getCropBox();
    const width = box.width;
    const height = box.height;
    const angle = ((page.getRotation().angle % 360) + 360) % 360;
    const sides = angle === 90
      ? { left: topPt, top: rightPt, right: bottomPt, bottom: leftPt }
      : angle === 180
        ? { left: rightPt, top: bottomPt, right: leftPt, bottom: topPt }
        : angle === 270
          ? { left: bottomPt, top: leftPt, right: topPt, bottom: rightPt }
          : { left: leftPt, top: topPt, right: rightPt, bottom: bottomPt };

    const newX = box.x + sides.left;
    const newY = box.y + sides.bottom;
    const newWidth = width - sides.left - sides.right;
    const newHeight = height - sides.top - sides.bottom;

    if (newWidth <= 50 || newHeight <= 50) {
      throw new Error(
        `Crop margins are too large for page ${i + 1} (${Math.round(width)}×${Math.round(height)}pt). Must leave at least 50pt.`
      );
    }

    // Set both CropBox and MediaBox to ensure consistent rendering across all PDF viewers
    page.setCropBox(newX, newY, newWidth, newHeight);
    page.setMediaBox(newX, newY, newWidth, newHeight);
  }

  return await pdfDoc.save();
}