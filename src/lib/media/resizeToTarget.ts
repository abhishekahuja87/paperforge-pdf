export type ResizeFit = 'crop' | 'stretch' | 'contain';

export interface ResizeToTargetOptions {
  /** Largest allowed output size in bytes. */
  maxBytes: number;
  /** Smallest allowed output size in bytes, for forms that also set a minimum. Optional. */
  minBytes?: number;
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
  /** True when blank comment data was added inside the file to reach the minimum size. The picture is unchanged. */
  padded?: boolean;
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
 * Adds blank comment segments (JPG marker FFFE) right after the start of the file until it is `target` bytes long.
 * Viewers ignore comments, so the picture is unchanged; only the file size grows. Used when a form sets a minimum size
 * that a small, simple picture cannot reach even at the highest quality.
 */
export function padJpeg(bytes: Uint8Array, target: number): Uint8Array {
  if (bytes.length >= target || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const segments: Uint8Array[] = [];
  let missing = target - bytes.length;
  while (missing > 0) {
    // A segment is 2 marker bytes + 2 length bytes + data; the length counts itself and the data (at most 65535).
    const total = Math.min(missing, 65537);
    if (total < 4) { missing = 4; continue; }
    const length = total - 2;
    const segment = new Uint8Array(total);
    segment[0] = 0xff; segment[1] = 0xfe; segment[2] = length >> 8; segment[3] = length & 0xff;
    segment.fill(0x20, 4);
    segments.push(segment);
    missing -= total;
  }
  const padding = segments.reduce((sum, seg) => sum + seg.length, 0);
  const out = new Uint8Array(bytes.length + padding);
  out.set(bytes.subarray(0, 2), 0);
  let at = 2;
  for (const seg of segments) { out.set(seg, at); at += seg.length; }
  out.set(bytes.subarray(2), at);
  return out;
}

/** Brings a JPG up to the minimum size: first the highest quality that still fits the maximum, then blank padding. */
async function meetMinimum(canvas: HTMLCanvasElement, blob: Blob, quality: number, minBytes: number, maxBytes: number): Promise<{ blob: Blob; quality: number; padded: boolean }> {
  if (blob.size >= minBytes) return { blob, quality, padded: false };
  const best = await toJpeg(canvas, 1);
  let current = best.size <= maxBytes && best.size > blob.size ? { blob: best, quality: 1 } : { blob, quality };
  if (current.blob.size >= minBytes) return { ...current, padded: false };
  const target = Math.min(maxBytes, minBytes + 512);
  const bytes = padJpeg(new Uint8Array(await current.blob.arrayBuffer()), target);
  current = { blob: new Blob([bytes as BlobPart], { type: 'image/jpeg' }), quality: current.quality };
  return { ...current, padded: true };
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
        if (result.ok && options.minBytes && options.minBytes < options.maxBytes) {
          const grown = await meetMinimum(canvas, result.blob, result.quality, options.minBytes, options.maxBytes);
          return { blob: grown.blob, width, height, quality: grown.quality, reachedTarget: true, padded: grown.padded };
        }
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
