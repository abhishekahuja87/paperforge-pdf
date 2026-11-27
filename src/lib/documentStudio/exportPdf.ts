import { drawAnyText, textWidth } from './text';
import { degrees, PDFDocument, PDFName, rgb, StandardFonts, type PDFPage } from 'pdf-lib';
import type { CropBounds, ExportResult, OutputSequenceItem, PageCard, RedactionBox, SourceItem, StudioSettings } from './types';
import { A4_SIZE, LETTER_SIZE, bytesArrayBuffer, cropValues, dataUrlBytes, loadImage } from './shared';
import { cropCanvas, loadPdfPageCanvas } from './preview';

async function renderRedactedPdf(
  source: SourceItem,
  page: PageCard,
  crop: CropBounds,
  rotation: number,
  redactions: RedactionBox[],
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const rendered = await loadPdfPageCanvas(source, page.originalPageNumber, rotation, 2);
  try {
    const canvas = cropCanvas(rendered.canvas, crop, 0, redactions);
    return { bytes: dataUrlBytes(canvas.toDataURL('image/png')), width: canvas.width, height: canvas.height };
  } finally {
    rendered.canvas.width = 0;
    rendered.canvas.height = 0;
  }
}

async function prepareRaster(
  source: SourceItem,
  page: PageCard,
  crop: CropBounds,
  rotation: number,
  redactions: RedactionBox[],
  compression: StudioSettings['compression'],
): Promise<{ bytes: Uint8Array; format: 'png' | 'jpg'; naturalWidth: number; naturalHeight: number }> {
  const url = source.kind === 'docx'
    ? page.thumbnailUrl
    : URL.createObjectURL(new Blob([bytesArrayBuffer(source.bytes)], { type: source.kind === 'custom' ? 'image/png' : source.mimeType }));
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    context.drawImage(image, 0, 0);
    const transformed = cropCanvas(canvas, crop, rotation, redactions);
    canvas.width = 0;
    canvas.height = 0;
    const transformedContext = transformed.getContext('2d');
    if (!transformedContext) throw new Error('Canvas rendering is unavailable in this browser.');
    const lossy = compression !== 'quality';
    if (lossy) {
      transformedContext.globalCompositeOperation = 'destination-over';
      transformedContext.fillStyle = '#ffffff';
      transformedContext.fillRect(0, 0, transformed.width, transformed.height);
      transformedContext.globalCompositeOperation = 'source-over';
    }
    const quality = compression === 'target-500kb' ? 0.58 : compression === 'target-2mb' ? 0.72 : 0.86;
    const dataUrl = lossy ? transformed.toDataURL('image/jpeg', quality) : transformed.toDataURL('image/png');
    const result = {
      bytes: dataUrlBytes(dataUrl),
      format: lossy ? 'jpg' as const : 'png' as const,
      naturalWidth: transformed.width,
      naturalHeight: transformed.height,
    };
    transformed.width = 0;
    transformed.height = 0;
    return result;
  } finally {
    if (source.kind !== 'docx') URL.revokeObjectURL(url);
  }
}

function getTargetPageSize(
  standard: StudioSettings['pageStandard'],
  width: number,
  height: number,
): [number, number] {
  if (standard === 'a4') return A4_SIZE;
  if (standard === 'letter') return LETTER_SIZE;
  return [width, height];
}

function drawRedactions(
  page: PDFPage,
  boxes: OutputSequenceItem['redactions'],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  for (const box of boxes) {
    page.drawRectangle({
      x: x + box.x * width,
      y: y + (1 - box.y - box.height) * height,
      width: box.width * width,
      height: box.height * height,
      color: rgb(0, 0, 0),
    });
  }
}

export async function exportMasterPdf(
  sequence: OutputSequenceItem[],
  sources: Map<string, SourceItem>,
  settings: StudioSettings,
): Promise<ExportResult> {
  if (sequence.length === 0) throw new Error('Select at least one page before exporting.');
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);
  const boldFont = await output.embedFont(StandardFonts.HelveticaBold);
  const pdfSources = new Map<string, PDFDocument>();
  const margin = settings.marginMm * 72 / 25.4;
  output.setTitle(settings.documentTitle || 'Master Document');
  if (settings.documentAuthor) output.setAuthor(settings.documentAuthor);
  if (settings.documentSubject) output.setSubject(settings.documentSubject);
  if (settings.documentKeywords.trim()) {
    output.setKeywords(settings.documentKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean));
  }

  for (const item of sequence) {
    const source = sources.get(item.page.sourceId);
    if (!source) throw new Error(`The source for "${item.page.sourceName}" is no longer available.`);

    let raster: Awaited<ReturnType<typeof prepareRaster>> | undefined;
    let embeddedPage: Awaited<ReturnType<typeof output.embedPdf>>[number] | undefined;
    let nativePage: PDFPage | undefined;
    if (source.kind === 'pdf' && (source.isEncrypted || item.redactions.length > 0)) {
      const redacted = await renderRedactedPdf(source, item.page, item.crop, item.rotation, item.redactions);
      raster = {
        bytes: redacted.bytes,
        format: 'png',
        naturalWidth: redacted.width,
        naturalHeight: redacted.height,
      };
    } else if (source.kind === 'pdf') {
      let sourcePdf = pdfSources.get(source.id);
      if (!sourcePdf) {
        sourcePdf = await PDFDocument.load(source.bytes);
        pdfSources.set(source.id, sourcePdf);
      }
      const sourcePage = sourcePdf.getPage(item.page.originalPageNumber - 1);
      const crop = cropValues(item.crop);
      const originalCropBox = sourcePage.getCropBox();
      if (crop.top || crop.right || crop.bottom || crop.left) {
        sourcePage.setCropBox(
          originalCropBox.x + crop.left * originalCropBox.width,
          originalCropBox.y + crop.bottom * originalCropBox.height,
          originalCropBox.width * (1 - crop.left - crop.right),
          originalCropBox.height * (1 - crop.top - crop.bottom),
        );
      }
      if (settings.pageStandard === 'preserve' && settings.marginMm === 0) {
        [nativePage] = await output.copyPages(sourcePdf, [item.page.originalPageNumber - 1]);
        const rotation = (nativePage.getRotation().angle + item.rotation + 360) % 360;
        if (rotation !== nativePage.getRotation().angle) nativePage.setRotation(degrees(rotation));
      } else {
        [embeddedPage] = await output.embedPdf(sourcePdf, [item.page.originalPageNumber - 1]);
      }
      if (crop.top || crop.right || crop.bottom || crop.left) {
        sourcePage.setCropBox(
          originalCropBox.x,
          originalCropBox.y,
          originalCropBox.width,
          originalCropBox.height,
        );
      }
    } else {
      raster = await prepareRaster(source, item.page, item.crop, item.rotation, item.redactions, settings.compression);
    }

    const nativeCropBox = nativePage?.getCropBox();
    const naturalWidth = nativeCropBox?.width ?? embeddedPage?.width ?? raster!.naturalWidth * 0.75;
    const naturalHeight = nativeCropBox?.height ?? embeddedPage?.height ?? raster!.naturalHeight * 0.75;
    const [pageWidth, pageHeight] = getTargetPageSize(
      settings.pageStandard,
      naturalWidth,
      naturalHeight,
    );
    const page = nativePage ?? output.addPage([pageWidth, pageHeight]);
    if (nativePage) output.addPage(nativePage);

    const contentX = nativeCropBox?.x ?? margin;
    const contentY = nativeCropBox?.y ?? margin;
    const contentWidth = nativeCropBox?.width ?? Math.max(1, pageWidth - margin * 2);
    const contentHeight = nativeCropBox?.height ?? Math.max(1, pageHeight - margin * 2);
    const isImage = source.kind === 'image';
    const rotation = ((item.rotation % 360) + 360) % 360;
    const drawRotation = raster ? 0 : rotation;
    const rotated = drawRotation === 90 || drawRotation === 270;
    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (nativePage) {
      drawWidth = naturalWidth;
      drawHeight = naturalHeight;
    } else if (isImage && item.fitMode === 'original') {
      drawWidth = naturalWidth;
      drawHeight = naturalHeight;
    } else {
      const sourceWidth = rotated ? naturalHeight : naturalWidth;
      const sourceHeight = rotated ? naturalWidth : naturalHeight;
      const scale = isImage && item.fitMode === 'fill'
        ? Math.max(contentWidth / sourceWidth, contentHeight / sourceHeight)
        : Math.min(contentWidth / sourceWidth, contentHeight / sourceHeight);
      drawWidth = naturalWidth * scale;
      drawHeight = naturalHeight * scale;
    }
    drawX = contentX + (contentWidth - (rotated ? drawHeight : drawWidth)) / 2;
    drawY = contentY + (contentHeight - (rotated ? drawWidth : drawHeight)) / 2;

    if (nativePage) {
      drawWidth = 0;
      drawHeight = 0;
      drawX = 0;
      drawY = 0;
    } else if (embeddedPage) {
      page.drawPage(embeddedPage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
        rotate: degrees(drawRotation),
      });
    } else {
      const embeddedImage = raster!.format === 'jpg'
        ? await output.embedJpg(raster!.bytes)
        : await output.embedPng(raster!.bytes);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
        rotate: degrees(drawRotation),
      });
    }
    if (isImage && item.fitMode === 'fill') {
      const white = rgb(1, 1, 1);
      page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: contentY, color: white });
      page.drawRectangle({ x: 0, y: contentY + contentHeight, width: pageWidth, height: Math.max(0, pageHeight - contentY - contentHeight), color: white });
      page.drawRectangle({ x: 0, y: contentY, width: contentX, height: contentHeight, color: white });
      page.drawRectangle({ x: contentX + contentWidth, y: contentY, width: Math.max(0, pageWidth - contentX - contentWidth), height: contentHeight, color: white });
    }
    if (!raster) drawRedactions(page, item.redactions, contentX, contentY, contentWidth, contentHeight);
  }

  const contentsEntries = sequence
    .map((item, index) => ({ item, pageIndex: index, title: item.contentsTitle?.trim() }))
    .filter((entry): entry is { item: OutputSequenceItem; pageIndex: number; title: string } => Boolean(entry.title));
  let contentsPageCount = 0;
  if (contentsEntries.length > 0) {
    const [pageWidth, pageHeight] = getTargetPageSize(settings.pageStandard, ...A4_SIZE);
    const rowHeight = 34;
    const firstRowY = pageHeight - 154;
    const rowsPerPage = Math.max(1, Math.floor((firstRowY - 62) / rowHeight));
    contentsPageCount = Math.ceil(contentsEntries.length / rowsPerPage);
    const pages = Array.from({ length: contentsPageCount }, (_, index) => output.insertPage(index, [pageWidth, pageHeight]));

    pages.forEach((contentsPage) => {
      contentsPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.99, 0.992, 1) });
      contentsPage.drawRectangle({
        x: 36,
        y: pageHeight - 122,
        width: pageWidth - 72,
        height: 70,
        color: rgb(0.93, 0.95, 1),
      });
      contentsPage.drawRectangle({
        x: 36,
        y: pageHeight - 122,
        width: 5,
        height: 70,
        color: rgb(0.27, 0.32, 0.85),
      });
    });

    for (const [index, entry] of contentsEntries.entries()) {
      const contentsPageIndex = Math.floor(index / rowsPerPage);
      const rowIndex = index % rowsPerPage;
      const contentsPage = pages[contentsPageIndex];
      const y = firstRowY - rowIndex * rowHeight;
      const titleSize = 11;
      const pageLabel = String(entry.pageIndex + contentsPageCount + 1).padStart(2, '0');
      const pageLabelWidth = font.widthOfTextAtSize(pageLabel, titleSize);
      const titleWidth = Math.max(1, pageWidth - 142 - pageLabelWidth);
      const title = textWidth(font, entry.title, titleSize) <= titleWidth
        ? entry.title
        : (() => {
          let truncated = entry.title;
          while (truncated.length > 1 && textWidth(font, `${truncated}...`, titleSize) > titleWidth) {
            truncated = truncated.slice(0, -1);
          }
          return `${truncated}...`;
        })();
      await drawAnyText(output, contentsPage, title, { x: 62, y, size: titleSize, font, color: [0.12, 0.16, 0.23] });
      const rowLineY = y - 10;
      contentsPage.drawLine({
        start: { x: 56, y: rowLineY },
        end: { x: pageWidth - 56, y: rowLineY },
        thickness: 0.55,
        color: rgb(0.88, 0.9, 0.94),
      });
      contentsPage.drawRectangle({
        x: pageWidth - 84,
        y: y - 5,
        width: 30,
        height: 20,
        color: rgb(0.91, 0.95, 1),
      });
      contentsPage.drawText(pageLabel, {
        x: pageWidth - 69 - pageLabelWidth / 2,
        y,
        size: titleSize,
        font,
        color: rgb(0.19, 0.27, 0.68),
      });
      const annotation = output.context.register(output.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [50, y - 10, pageWidth - 50, y + 18],
        Border: [0, 0, 0],
        Dest: [output.getPage(entry.pageIndex + contentsPageCount).ref, PDFName.of('Fit')],
      }));
      contentsPage.node.addAnnot(annotation);
    }

    pages.forEach((contentsPage, index) => {
      contentsPage.drawText('YOUR DOCUMENT, AT A GLANCE', {
        x: 54,
        y: pageHeight - 76,
        size: 8,
        font: boldFont,
        color: rgb(0.31, 0.36, 0.72),
      });
      contentsPage.drawText(index === 0 ? 'Contents' : 'Contents (continued)', {
        x: 54,
        y: pageHeight - 101,
        size: 21,
        font: boldFont,
        color: rgb(0.06, 0.09, 0.16),
      });
      contentsPage.drawText(index === 0 ? 'Select a heading to jump to that page.' : 'More sections in this document.', {
        x: 54,
        y: pageHeight - 116,
        size: 9,
        font,
        color: rgb(0.34, 0.38, 0.48),
      });
    });
  }

  const pages = output.getPages();
  for (const [index, page] of pages.entries()) {
    const { width: pageWidth, height: pageHeight } = page.getSize();
    if (settings.watermarkText.trim()) {
      await drawAnyText(output, page, settings.watermarkText.trim(), {
        x: pageWidth * 0.12,
        y: pageHeight * 0.43,
        size: Math.min(pageWidth, pageHeight) * 0.1,
        font: boldFont,
        bold: true,
        color: [0.42, 0.45, 0.5],
        opacity: settings.watermarkOpacity / 100,
        rotate: degrees(settings.watermarkAngle),
      });
    }
    if (settings.numberPosition === 'none' || (settings.skipFirstPage && index === contentsPageCount)) continue;
    const label = settings.numberFormat
      .replaceAll('{page}', String(index + 1))
      .replaceAll('{total}', String(pages.length));
    const size = 10;
    const labelWidth = textWidth(font, label, size);
    const x = settings.numberPosition === 'bottom-center'
      ? (pageWidth - labelWidth) / 2
      : pageWidth - margin - labelWidth;
    const y = settings.numberPosition === 'top-right'
      ? pageHeight - margin - size
      : Math.max(12, margin / 2);
    await drawAnyText(output, page, label, { x, y, size, font, color: [0.35, 0.38, 0.42] });
  }

  const bytes = await output.save({ useObjectStreams: true });
  const targetBytes = settings.compression === 'target-2mb'
    ? 2 * 1024 * 1024
    : settings.compression === 'target-500kb'
      ? 500 * 1024
      : null;
  return { bytes, targetBytes, targetMet: targetBytes === null || bytes.byteLength <= targetBytes };
}
