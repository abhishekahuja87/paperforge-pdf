import { PDFDocument, degrees } from 'pdf-lib';
import { parsePageRanges } from './split';

export type RotationScope = 'all' | 'custom' | 'odd' | 'even';
export type RotationAngle = 90 | 180 | 270;

export interface RotatePdfOptions {
  fileBuffer: ArrayBuffer;
  angle: RotationAngle;
  scope: RotationScope;
  rangeString?: string;
}

/**
 * Rotates pages in a PDF document by 90, 180, or 270 degrees.
 * Modifies the page's existing rotation incrementally.
 */
export async function rotatePdf(options: RotatePdfOptions): Promise<Uint8Array> {
  const { fileBuffer, angle, scope, rangeString = '' } = options;

  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();

  let targetIndices: number[] = [];

  if (scope === 'all') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  } else if (scope === 'odd') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 0);
  } else if (scope === 'even') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 !== 0);
  } else if (scope === 'custom') {
    targetIndices = parsePageRanges(rangeString, totalPages);
  }

  const pages = pdfDoc.getPages();

  for (const idx of targetIndices) {
    if (idx >= 0 && idx < totalPages) {
      const page = pages[idx];
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + angle) % 360;
      page.setRotation(degrees(newRotation));
    }
  }

  return await pdfDoc.save();
}