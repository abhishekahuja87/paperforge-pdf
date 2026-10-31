import { PDFDocument, rgb } from 'pdf-lib';

export type NUpLayout = '2-up' | '4-up';
export type NUpPaperSize = 'a4-portrait' | 'a4-landscape' | 'letter-portrait' | 'letter-landscape';

export interface NUpOptions {
  fileBuffer: ArrayBuffer;
  layout: NUpLayout;
  paperSize: NUpPaperSize;
  margin?: number; // points
  spacing?: number; // gutter points
  drawBorders?: boolean;
}

const PAGE_DIMENSIONS: Record<NUpPaperSize, [number, number]> = {
  'a4-portrait': [595.28, 841.89],
  'a4-landscape': [841.89, 595.28],
  'letter-portrait': [612.0, 792.0],
  'letter-landscape': [792.0, 612.0],
};

/**
 * Compiles multiple logical pages onto single master sheets in client memory.
 */
export async function createNUpPdf(options: NUpOptions): Promise<Uint8Array> {
  const {
    fileBuffer,
    layout,
    paperSize,
    margin = 20,
    spacing = 15,
    drawBorders = true,
  } = options;

  const srcDoc = await PDFDocument.load(fileBuffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF contains no pages.');
  }

  const outDoc = await PDFDocument.create();
  const [sheetW, sheetH] = PAGE_DIMENSIONS[paperSize];

  const pagesPerSheet = layout === '2-up' ? 2 : 4;
  const cols = layout === '2-up' ? (paperSize.includes('landscape') ? 2 : 1) : 2;
  const rows = layout === '2-up' ? (paperSize.includes('landscape') ? 1 : 2) : 2;

  const availableW = sheetW - margin * 2 - (cols - 1) * spacing;
  const availableH = sheetH - margin * 2 - (rows - 1) * spacing;

  const cellW = availableW / cols;
  const cellH = availableH / rows;

  for (let i = 0; i < totalPages; i += pagesPerSheet) {
    const sheet = outDoc.addPage([sheetW, sheetH]);

    for (let slot = 0; slot < pagesPerSheet; slot++) {
      const pageIndex = i + slot;
      if (pageIndex >= totalPages) break;

      const colIdx = slot % cols;
      const rowIdx = Math.floor(slot / cols);

      const [embeddedPage] = await outDoc.embedPdf(srcDoc, [pageIndex]);
      const { width: origW, height: origH } = embeddedPage;

      const scale = Math.min(cellW / origW, cellH / origH);
      const drawW = origW * scale;
      const drawH = origH * scale;

      const cellX = margin + colIdx * (cellW + spacing);
      const cellY = sheetH - margin - (rowIdx + 1) * cellH - rowIdx * spacing;

      const posX = cellX + (cellW - drawW) / 2;
      const posY = cellY + (cellH - drawH) / 2;

      sheet.drawPage(embeddedPage, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH,
      });

      if (drawBorders) {
        sheet.drawRectangle({
          x: posX,
          y: posY,
          width: drawW,
          height: drawH,
          borderColor: rgb(0.8, 0.82, 0.86),
          borderWidth: 0.5,
        });
      }
    }
  }

  return await outDoc.save();
}