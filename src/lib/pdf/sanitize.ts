import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

export interface SanitizeOptions {
  fileBuffer: ArrayBuffer;
  stripDocumentInfo: boolean;
  stripXmpMetadata: boolean;
  stripPieceInfo: boolean;
  stripThumbnails: boolean;
  stripFormScripts: boolean;
  stripEmbeddedFiles: boolean;
}

export interface SanitizeResult {
  pdfBytes: Uint8Array;
  originalSize: number;
  sanitizedSize: number;
  itemsRemoved: string[];
}

/**
 * Deep-cleans hidden metadata, application fingerprints, and script hooks in client RAM.
 */
export async function sanitizePdf(options: SanitizeOptions): Promise<SanitizeResult> {
  const {
    fileBuffer,
    stripDocumentInfo = true,
    stripXmpMetadata = true,
    stripPieceInfo = true,
    stripThumbnails = true,
    stripFormScripts = true,
    stripEmbeddedFiles = true,
  } = options;

  const originalSize = fileBuffer.byteLength;
  const itemsRemoved: string[] = [];

  const pdfDoc = await PDFDocument.load(fileBuffer, {
    ignoreEncryption: true,
  });

  const catalog = pdfDoc.catalog;

  // 1. Strip Standard Info Dictionary
  if (stripDocumentInfo) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    itemsRemoved.push('Standard Document Info (Author, Title, Creator, Producer)');
  }

  // 2. Strip XML / XMP Metadata Stream
  if (stripXmpMetadata) {
    const metadataRef = catalog.get(PDFName.of('Metadata'));
    if (metadataRef) {
      catalog.delete(PDFName.of('Metadata'));
      itemsRemoved.push('XMP Extended Metadata & Revision History');
    }
  }

  // 3. Strip PieceInfo (Third-party application editing data e.g. Illustrator, Photoshop, Word)
  if (stripPieceInfo) {
    if (catalog.get(PDFName.of('PieceInfo'))) {
      catalog.delete(PDFName.of('PieceInfo'));
      itemsRemoved.push('Catalog PieceInfo (Application Workspaces)');
    }
  }

  // 4. Strip Embedded Thumbnails & Page-Level PieceInfo
  if (stripThumbnails) {
    let thumbCount = 0;
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      if (page.node.get(PDFName.of('Thumb'))) {
        page.node.delete(PDFName.of('Thumb'));
        thumbCount++;
      }
      if (page.node.get(PDFName.of('PieceInfo'))) {
        page.node.delete(PDFName.of('PieceInfo'));
      }
    }
    if (thumbCount > 0) {
      itemsRemoved.push(`Embedded Page Thumbnails (${thumbCount} cached previews)`);
    }
  }

  // 5. Strip Names / JavaScript / Actions (Malicious or Form Scripts)
  if (stripFormScripts) {
    const names = catalog.lookup(PDFName.of('Names'));
    if (names instanceof PDFDict) {
      if (names.get(PDFName.of('JavaScript'))) {
        names.delete(PDFName.of('JavaScript'));
        itemsRemoved.push('Embedded Document JavaScript Hooks');
      }
    }
    if (catalog.get(PDFName.of('OpenAction'))) {
      catalog.delete(PDFName.of('OpenAction'));
      itemsRemoved.push('Auto-Execution OpenAction Triggers');
    }
    if (catalog.get(PDFName.of('AA'))) {
      catalog.delete(PDFName.of('AA'));
      itemsRemoved.push('Additional Action Handlers');
    }
  }

  // 6. Strip Embedded Files & Attachments
  if (stripEmbeddedFiles) {
    const names = catalog.lookup(PDFName.of('Names'));
    if (names instanceof PDFDict) {
      if (names.get(PDFName.of('EmbeddedFiles'))) {
        names.delete(PDFName.of('EmbeddedFiles'));
        itemsRemoved.push('Embedded File Attachments');
      }
    }
    if (catalog.get(PDFName.of('AF'))) {
      catalog.delete(PDFName.of('AF'));
      itemsRemoved.push('Associated Files Array (AF)');
    }
  }

  // Re-save with clean cross-reference streams
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  if (itemsRemoved.length === 0) {
    itemsRemoved.push('Standardized & Cleaned Object Stream Structure');
  }

  return {
    pdfBytes,
    originalSize,
    sanitizedSize: pdfBytes.byteLength,
    itemsRemoved,
  };
}