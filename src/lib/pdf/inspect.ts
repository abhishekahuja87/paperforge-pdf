import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

export interface PageGeometryInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio: string;
}

export interface PdfInspectionReport {
  fileSize: number;
  pdfHeaderVersion: string;
  pageCount: number;
  isEncrypted: boolean;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  hasXmpMetadata: boolean;
  hasEmbeddedThumbnails: boolean;
  hasJavaScript: boolean;
  hasEmbeddedFiles: boolean;
  pages: PageGeometryInfo[];
}

export async function inspectPdf(fileBuffer: ArrayBuffer): Promise<PdfInspectionReport> {
  const bytes = new Uint8Array(fileBuffer);
  
  // Extract raw header bytes for exact version (e.g., "%PDF-1.7")
  let headerVersion = 'Unknown';
  const headerSlice = new TextDecoder('ascii').decode(bytes.slice(0, 15));
  const versionMatch = headerSlice.match(/%PDF-(\d+\.\d+)/);
  if (versionMatch) {
    headerVersion = `PDF ${versionMatch[1]}`;
  }

  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const catalog = pdfDoc.catalog;

  // Metadata check
  const title = pdfDoc.getTitle() || undefined;
  const author = pdfDoc.getAuthor() || undefined;
  const subject = pdfDoc.getSubject() || undefined;
  const creator = pdfDoc.getCreator() || undefined;
  const producer = pdfDoc.getProducer() || undefined;
  const creationDate = pdfDoc.getCreationDate()?.toISOString() || undefined;
  const modificationDate = pdfDoc.getModificationDate()?.toISOString() || undefined;

  // Structural feature detection
  const hasXmpMetadata = catalog.has(PDFName.of('Metadata'));
  
  let hasEmbeddedThumbnails = false;
  const pagesInfo: PageGeometryInfo[] = [];
  const rawPages = pdfDoc.getPages();

  for (let i = 0; i < rawPages.length; i++) {
    const page = rawPages[i];
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;

    if (page.node.has(PDFName.of('Thumb'))) {
      hasEmbeddedThumbnails = true;
    }

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const roundW = Math.round(width);
    const roundH = Math.round(height);
    const divisor = gcd(roundW, roundH);
    const ratioStr = `${roundW / divisor}:${roundH / divisor}`;

    pagesInfo.push({
      pageNumber: i + 1,
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
      rotation,
      aspectRatio: ratioStr,
    });
  }

  // Names / Script / Attachment detection
  let hasJavaScript = false;
  let hasEmbeddedFiles = false;
  const names = catalog.get(PDFName.of('Names'));
  if (names instanceof PDFDict) {
    if (names.has(PDFName.of('JavaScript'))) hasJavaScript = true;
    if (names.has(PDFName.of('EmbeddedFiles'))) hasEmbeddedFiles = true;
  }
  if (catalog.has(PDFName.of('OpenAction')) || catalog.has(PDFName.of('AA'))) {
    hasJavaScript = true;
  }

  return {
    fileSize: fileBuffer.byteLength,
    pdfHeaderVersion: headerVersion,
    pageCount: rawPages.length,
    isEncrypted: pdfDoc.isEncrypted,
    metadata: {
      title,
      author,
      subject,
      creator,
      producer,
      creationDate,
      modificationDate,
    },
    hasXmpMetadata,
    hasEmbeddedThumbnails,
    hasJavaScript,
    hasEmbeddedFiles,
    pages: pagesInfo,
  };
}