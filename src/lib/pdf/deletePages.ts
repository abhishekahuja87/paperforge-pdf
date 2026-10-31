import { PDFDocument } from 'pdf-lib';
import { parsePageRanges } from './split';

export interface DeletePagesOptions {
  fileBuffer: ArrayBuffer;
  pagesToRemove: string; // e.g. "1, 3, 5-7"
}

/**
 * Removes designated pages from a PDF document in client RAM.
 */
export async function deletePdfPages(options: DeletePagesOptions): Promise<Uint8Array> {
  const { fileBuffer, pagesToRemove } = options;

  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();

  const indicesToRemove = parsePageRanges(pagesToRemove, totalPages);

  if (indicesToRemove.length === 0) {
    throw new Error('No valid pages designated for removal.');
  }

  if (indicesToRemove.length >= totalPages) {
    throw new Error('Cannot delete all pages. The document must retain at least one page.');
  }

  // Delete in reverse order so remaining page indices do not shift
  const sortedDesc = [...indicesToRemove].sort((a, b) => b - a);
  for (const pageIndex of sortedDesc) {
    pdfDoc.removePage(pageIndex);
  }

  return await pdfDoc.save();
}