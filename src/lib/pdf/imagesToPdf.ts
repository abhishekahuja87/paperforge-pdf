import { PDFDocument } from 'pdf-lib';

export type PageLayoutOption = 'fit' | 'a4-portrait' | 'a4-landscape' | 'letter-portrait';

export interface ImageFileEntry {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export interface ImagesToPdfOptions {
  images: ImageFileEntry[];
  pageLayout: PageLayoutOption;
  margin?: number; // points (e.g. 20)
}

/** Reads the EXIF orientation flag (1 = upright) from a JPEG; returns 1 when there is none. */
function readJpegOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1];
    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && offset + 10 < bytes.length && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      if (ifd + 2 > bytes.length) return 1;
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i += 1) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > bytes.length) return 1;
        if (view.getUint16(entry, little) === 0x0112) return view.getUint16(entry + 8, little);
      }
      return 1;
    }
    if (marker === 0xda) return 1;
    offset += 2 + length;
  }
  return 1;
}

/** Draws the photo with its rotation flag applied and returns it as JPEG bytes (null if the browser cannot). */
async function redrawUpright(file: File): Promise<Uint8Array | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    canvas.width = 0;
    canvas.height = 0;
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/**
 * Converts a raw image file (PNG, JPG, WebP) to an embedded byte buffer compatible with pdf-lib.
 * WebP is auto-converted to PNG via an offscreen canvas in client RAM.
 */
async function processImageBytes(file: File): Promise<{ bytes: Uint8Array; format: 'png' | 'jpg' }> {
  if (file.type === 'image/jpeg' || file.name.match(/\.(jpe?g)$/i)) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    // Phone photos are often stored sideways with a rotation flag. Embedding the raw file would ignore
    // the flag, so those photos are redrawn upright first.
    if (readJpegOrientation(bytes) > 1) {
      const upright = await redrawUpright(file);
      if (upright) return { bytes: upright, format: 'jpg' };
    }
    return { bytes, format: 'jpg' };
  }

  if (file.type === 'image/png' || file.name.match(/\.png$/i)) {
    const arrayBuffer = await file.arrayBuffer();
    return { bytes: new Uint8Array(arrayBuffer), format: 'png' };
  }

  // Handle WebP or other browser-supported image formats via Canvas conversion
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context initialization failed'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image to PNG canvas blob'));
          return;
        }
        blob.arrayBuffer().then((buf) => {
          resolve({ bytes: new Uint8Array(buf), format: 'png' });
        });
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Compiles a list of image files into a cohesive PDF document.
 */
export async function convertImagesToPdf(options: ImagesToPdfOptions): Promise<Uint8Array> {
  const { images, pageLayout, margin = 20 } = options;

  if (images.length === 0) {
    throw new Error('At least one image is required to build a PDF.');
  }

  const pdfDoc = await PDFDocument.create();

  // Page dimensions in PDF points (72 points = 1 inch)
  const DIMENSIONS: Record<Exclude<PageLayoutOption, 'fit'>, [number, number]> = {
    'a4-portrait': [595.28, 841.89],
    'a4-landscape': [841.89, 595.28],
    'letter-portrait': [612.0, 792.0],
  };

  for (const entry of images) {
    const { bytes, format } = await processImageBytes(entry.file);
    const embeddedImage = format === 'jpg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    if (pageLayout === 'fit') {
      // Page size matches exact pixel dimensions of the image
      const page = pdfDoc.addPage([imgWidth, imgHeight]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });
    } else {
      // Standard paper dimension with auto-fit scale and centering
      const [pageW, pageH] = DIMENSIONS[pageLayout];
      const page = pdfDoc.addPage([pageW, pageH]);

      const availableW = pageW - margin * 2;
      const availableH = pageH - margin * 2;

      const scale = Math.min(availableW / imgWidth, availableH / imgHeight, 1);
      const drawW = imgWidth * scale;
      const drawH = imgHeight * scale;

      const posX = margin + (availableW - drawW) / 2;
      const posY = margin + (availableH - drawH) / 2;

      page.drawImage(embeddedImage, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH,
      });
    }
  }

  return await pdfDoc.save();
}