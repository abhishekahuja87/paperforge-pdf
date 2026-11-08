import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { parsePageRanges } from './split';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export type PageNumberFormat = 'number-only' | 'page-x-of-y' | 'slash' | 'hyphen';

export type NumberingFont = 'helvetica' | 'helvetica-bold' | 'courier';

export interface AddPageNumbersOptions {
  fileBuffer: ArrayBuffer;
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontChoice: NumberingFont;
  fontSize: number;
  margin: number;
  startNumber: number;
  skipFirstPage: boolean;
  scope: 'all' | 'custom';
  rangeString?: string;
}

/**
 * Stamps page numbers directly onto target PDF pages in client memory.
 */
export async function addPageNumbersToPdf(options: AddPageNumbersOptions): Promise<Uint8Array> {
  const {
    fileBuffer,
    position,
    format,
    fontChoice,
    fontSize = 10,
    margin = 30,
    startNumber = 1,
    skipFirstPage = false,
    scope = 'all',
    rangeString = '',
  } = options;

  const pdfDoc = await PDFDocument.load(fileBuffer);
  const totalPages = pdfDoc.getPageCount();

  const fontMap = {
    'helvetica': StandardFonts.Helvetica,
    'helvetica-bold': StandardFonts.HelveticaBold,
    'courier': StandardFonts.Courier,
  };
  const font = await pdfDoc.embedFont(fontMap[fontChoice]);

  let targetIndices: number[] = [];
  if (scope === 'all') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  } else {
    targetIndices = parsePageRanges(rangeString, totalPages);
  }

  const pages = pdfDoc.getPages();
  let currentNumber = startNumber;
  // When only some pages are numbered, each label follows the page's position in the file.
  const followsPosition = scope === 'custom';

  for (let i = 0; i < pages.length; i++) {
    if (i === 0 && skipFirstPage) {
      continue;
    }

    if (!targetIndices.includes(i)) {
      continue;
    }

    const page = pages[i];
    const { width, height } = page.getSize();

    if (followsPosition) currentNumber = startNumber + i;

    // Format label string
    let label = `${currentNumber}`;
    if (format === 'page-x-of-y') {
      label = `Page ${currentNumber} of ${totalPages}`;
    } else if (format === 'slash') {
      label = `${currentNumber} / ${totalPages}`;
    } else if (format === 'hyphen') {
      label = `- ${currentNumber} -`;
    }

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    // Compute coordinate placement
    let x = (width - textWidth) / 2;
    let y = margin;

    if (position === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (position === 'bottom-center') {
      x = (width - textWidth) / 2;
      y = margin;
    } else if (position === 'bottom-right') {
      x = width - textWidth - margin;
      y = margin;
    } else if (position === 'top-left') {
      x = margin;
      y = height - margin - textHeight;
    } else if (position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - margin - textHeight;
    } else if (position === 'top-right') {
      x = width - textWidth - margin;
      y = height - margin - textHeight;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.23, 0.28),
    });

    currentNumber++;
  }

  return await pdfDoc.save();
}