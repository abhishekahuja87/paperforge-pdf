import { PDFDocument, PDFName } from 'pdf-lib';

export type CompressionLevel = 'basic' | 'strong';

export interface CompressPdfOptions {
  fileBuffer: ArrayBuffer;
  level: CompressionLevel;
}

export interface CompressPdfResult {
  pdfBytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  reductionPercentage: number;
}

/**
 * Optimizes and reduces PDF file size directly in client browser memory.
 */
export async function compressPdf(options: CompressPdfOptions): Promise<CompressPdfResult> {
  const { fileBuffer, level } = options;
  const originalSize = fileBuffer.byteLength;

  // Load document without loading unnecessary objects
  const pdfDoc = await PDFDocument.load(fileBuffer, {
    ignoreEncryption: true,
  });

  // Strip redundant metadata
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');

  if (level === 'strong') {
    // Remove Document-level XMP Metadata stream if present
    const catalog = pdfDoc.catalog;
    const metadataRef = catalog.get(PDFName.of('Metadata'));
    if (metadataRef) {
      catalog.delete(PDFName.of('Metadata'));
    }

    // Strip PieceInfo (third-party editing metadata e.g. Illustrator, Photoshop, InDesign)
    if (catalog.get(PDFName.of('PieceInfo'))) {
      catalog.delete(PDFName.of('PieceInfo'));
    }

    // Strip embedded Page-level thumbnail images
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      if (page.node.get(PDFName.of('Thumb'))) {
        page.node.delete(PDFName.of('Thumb'));
      }
      if (page.node.get(PDFName.of('PieceInfo'))) {
        page.node.delete(PDFName.of('PieceInfo'));
      }
    }
  }

  // Save with maximum object-stream consolidation and compact references
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  const compressedSize = pdfBytes.byteLength;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const reductionPercentage =
    originalSize > 0 ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100)) : 0;

  return {
    pdfBytes,
    originalSize,
    compressedSize,
    savedBytes,
    reductionPercentage,
  };
}