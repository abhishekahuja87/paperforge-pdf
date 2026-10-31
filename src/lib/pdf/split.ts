import { PDFDocument } from 'pdf-lib';

export interface SplitResult {
  fileName: string;
  blob: Blob;
  pageCount: number;
}

/**
 * Parses user input like "1-3, 5, 7-10" into a 0-indexed array of page numbers.
 */
export function parsePageRanges(rangeString: string, maxPages: number): number[] {
  const clean = rangeString.replace(/\s+/g, '');
  if (!clean) return [];

  const pages = new Set<number>();
  const parts = clean.split(',');

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) continue;

      const lower = Math.max(1, Math.min(start, end));
      const upper = Math.min(maxPages, Math.max(start, end));

      for (let p = lower; p <= upper; p++) {
        pages.add(p - 1); // 0-indexed
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Extracts specified pages from an uploaded PDF and compiles them into a new document.
 */
export async function extractPages(
  fileBuffer: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(fileBuffer);
  const outDoc = await PDFDocument.create();

  const copiedPages = await outDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach((p) => outDoc.addPage(p));

  return await outDoc.save();
}

/**
 * Inspects a PDF to determine its total page count.
 */
export async function getPdfPageCount(fileBuffer: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(fileBuffer);
  return doc.getPageCount();
}