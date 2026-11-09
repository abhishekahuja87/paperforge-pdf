export interface LoadedImage { source: CanvasImageSource; width: number; height: number }

/** Longest side kept for a product photo. Plenty for a 1080 px poster, and keeps memory small on phones. */
export const MAX_PHOTO_SIDE = 1400;

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { /* fall back to an image element */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Reads a photo and shrinks it to MAX_PHOTO_SIDE. The result is a fresh canvas, so camera data is not kept. */
export async function loadPhoto(blob: Blob): Promise<LoadedImage> {
  const bitmap = await decode(blob);
  const w = 'naturalWidth' in bitmap ? bitmap.naturalWidth : bitmap.width;
  const h = 'naturalHeight' in bitmap ? bitmap.naturalHeight : bitmap.height;
  const k = Math.min(1, MAX_PHOTO_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * k));
  canvas.height = Math.max(1, Math.round(h * k));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if ('close' in bitmap) bitmap.close();
  return { source: canvas, width: canvas.width, height: canvas.height };
}

export async function loadPhotoFromUrl(url: string): Promise<LoadedImage> {
  const response = await fetch(url);
  return loadPhoto(await response.blob());
}
