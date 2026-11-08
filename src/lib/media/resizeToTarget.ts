export type ResizeFit = 'crop' | 'stretch' | 'contain';

export interface ResizeToTargetOptions {
  /** Largest allowed output size in bytes. */
  maxBytes: number;
  /** Exact output size in pixels. Omit to keep the original proportions (the picture may then be scaled down to fit). */
  exact?: { width: number; height: number; fit: ResizeFit };
  /** Fill colour for transparent areas and for "contain" borders. JPG has no transparency. */
  background?: string;
}

export interface ResizeToTargetResult {
  blob: Blob;
  width: number;
  height: number;
  /** JPG quality that was used, from 0 to 1. */
  quality: number;
  /** False when even the lowest quality (and smallest allowed size) stayed above the limit. */
  reachedTarget: boolean;
}

const MIN_QUALITY = 0.05;
const MAX_QUALITY = 0.95;
const MIN_SIDE = 48;
const SEARCH_STEPS = 8;
const SCALE_STEP = 0.85;
const MAX_SCALE_ATTEMPTS = 30;

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('This browser could not encode the image as JPG.'));
        else if (blob.type !== 'image/jpeg') reject(new Error('JPG encoding is not supported by this browser.'));
        else resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

function drawBitmap(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  fit: ResizeFit,
  background: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas processing is unavailable in this browser.');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  if (fit === 'crop') {
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    context.drawImage(
      bitmap,
      (bitmap.width - sourceWidth) / 2,
      (bitmap.height - sourceHeight) / 2,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height,
    );
  } else if (fit === 'contain') {
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  } else {
    context.drawImage(bitmap, 0, 0, width, height);
  }
  return canvas;
}

/** Finds the highest JPG quality that keeps the file at or under maxBytes. */
async function encodeUnderLimit(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<{ blob: Blob; quality: number; ok: boolean }> {
  const high = await toJpeg(canvas, MAX_QUALITY);
  if (high.size <= maxBytes) return { blob: high, quality: MAX_QUALITY, ok: true };

  const low = await toJpeg(canvas, MIN_QUALITY);
  if (low.size > maxBytes) return { blob: low, quality: MIN_QUALITY, ok: false };

  let best = low;
  let bestQuality = MIN_QUALITY;
  let lower = MIN_QUALITY;
  let upper = MAX_QUALITY;
  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const middle = (lower + upper) / 2;
    const blob = await toJpeg(canvas, middle);
    if (blob.size <= maxBytes) {
      best = blob;
      bestQuality = middle;
      lower = middle;
    } else {
      upper = middle;
    }
  }
  return { blob: best, quality: bestQuality, ok: true };
}

/**
 * Re-encodes an image as a JPG that is no larger than maxBytes, optionally at an exact pixel size.
 * Without an exact size, the picture is scaled down in steps when quality alone cannot reach the limit.
 */
export async function resizeImageToTarget(file: File, options: ResizeToTargetOptions): Promise<ResizeToTargetResult> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be decoded by the browser. Try a PNG, JPG, or WebP image.');
  }

  const background = options.background ?? '#ffffff';
  let canvas: HTMLCanvasElement | undefined;
  const release = () => {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
      canvas = undefined;
    }
  };

  try {
    let scale = 1;
    for (let attempt = 0; attempt < MAX_SCALE_ATTEMPTS; attempt += 1) {
      const width = options.exact ? options.exact.width : Math.max(1, Math.round(bitmap.width * scale));
      const height = options.exact ? options.exact.height : Math.max(1, Math.round(bitmap.height * scale));
      release();
      canvas = drawBitmap(bitmap, width, height, options.exact?.fit ?? 'stretch', background);

      const result = await encodeUnderLimit(canvas, options.maxBytes);
      const canShrink = !options.exact && Math.min(width, height) * SCALE_STEP >= MIN_SIDE;
      if (result.ok || !canShrink) {
        return { blob: result.blob, width, height, quality: result.quality, reachedTarget: result.ok };
      }
      scale *= SCALE_STEP;
    }
    throw new Error('The image could not be reduced to the requested size.');
  } finally {
    bitmap.close();
    release();
  }
}
