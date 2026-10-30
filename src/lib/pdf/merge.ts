import { PDFDocument } from 'pdf-lib';

/**
 * Merges multiple PDF File objects into a single PDF Blob.
 * Runs entirely in the client browser with zero server latency or data transfer costs.
 */
export async function mergePdfFiles(files: File[]): Promise<Blob> {
  if (files.length < 2) {
    throw new Error('Please select at least two PDF files to merge.');
  }

  // Create an empty PDF document
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    // Load each PDF from raw bytes
    const pdf = await PDFDocument.load(arrayBuffer);
    
    // Copy all pages from the current PDF into the target document
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  // Serialize to Uint8Array and wrap in a downloadable Blob
  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
}