import { PDFDocument } from 'pdf-lib';
import { parsePageRanges } from './split';

/**
 * Merges multiple PDF File objects into a single PDF Blob.
 * Runs entirely in the client browser with zero server latency or data transfer costs.
 */
export async function mergePdfFiles(files: File[], ranges: string[] = []): Promise<Blob> {
  if (files.length < 2) {
    throw new Error('Please select at least two PDF files to merge.');
  }

  // Create an empty PDF document
  const mergedPdf = await PDFDocument.create();

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex];
    const arrayBuffer = await file.arrayBuffer();
    // Load each PDF from raw bytes
    const pdf = await PDFDocument.load(arrayBuffer);
    
    // Copy all pages from the current PDF into the target document
    const range = (ranges[fileIndex] ?? '').trim();
    const indices = range ? parsePageRanges(range, pdf.getPageCount()) : pdf.getPageIndices();
    if (indices.length === 0) {
      throw new Error(`No pages match "${range}" in ${file.name}. Use page numbers such as 1-3, 5.`);
    }
    const copiedPages = await mergedPdf.copyPages(pdf, indices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  // Serialize to Uint8Array and ensure the underlying buffer matches BlobPart typing
  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
}