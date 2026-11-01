export type BrowserImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ImageProcessingOptions {
  format: BrowserImageFormat;
  quality: number;
  maxDimension?: number;
  backgroundColor?: string;
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
}

export async function processBrowserImage(file: File, options: ImageProcessingOptions): Promise<ProcessedImage> {
  let bitmap: ImageBitmap;
  let canvas: HTMLCanvasElement | undefined;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be decoded by the browser. Try a PNG, JPG, or WebP image.');
  }

  try {
    const maxDimension = options.maxDimension && options.maxDimension > 0
      ? options.maxDimension
      : Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const processingCanvas = document.createElement('canvas');
    canvas = processingCanvas;
    processingCanvas.width = width;
    processingCanvas.height = height;
    const context = processingCanvas.getContext('2d');
    if (!context) throw new Error('Canvas processing is unavailable in this browser.');

    if (options.format === 'image/jpeg') {
      context.fillStyle = options.backgroundColor || '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      processingCanvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error(`This browser could not encode the image as ${options.format.replace('image/', '').toUpperCase()}.`));
          } else if (result.type !== options.format) {
            reject(new Error(`${options.format.replace('image/', '').toUpperCase()} encoding is not supported by this browser.`));
          } else {
            resolve(result);
          }
        },
        options.format,
        options.format === 'image/png' ? undefined : options.quality,
      );
    });
    return { blob, width, height };
  } finally {
    bitmap.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
