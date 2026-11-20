/** Small browser helpers shared by the photo, signature and scanner tools. Everything stays on the device. */

/** Reads a picture the person chose, turned upright the way the camera meant it. */
export async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a picture file (JPG, PNG or WebP).');
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { return createImageBitmap(file); }
}

export const makeCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};

export const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not make the picture. Try a smaller one.'))), type, quality));

export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** The part of a source picture that fills a box of the given shape (like CSS object-fit: cover), with zoom of 1 or more and an offset from -1 to 1 on each axis. */
export function coverRect(sw: number, sh: number, dw: number, dh: number, zoom = 1, ox = 0, oy = 0): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(dw / sw, dh / sh) * Math.max(1, zoom);
  const vw = Math.min(sw, dw / scale);
  const vh = Math.min(sh, dh / scale);
  const sx = (sw - vw) / 2 + (ox * (sw - vw)) / 2;
  const sy = (sh - vh) / 2 + (oy * (sh - vh)) / 2;
  return { sx: Math.max(0, Math.min(sw - vw, sx)), sy: Math.max(0, Math.min(sh - vh, sy)), sw: vw, sh: vh };
}

/** Crops see-through margins off a canvas and returns it as a PNG data address with its width over height, or null when nothing is drawn. */
export function trimToPng(canvas: HTMLCanvasElement, pad = 6): { src: string; ratio: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width; let minY = height; let maxX = -1; let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3]! > 8) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
  }
  if (maxX < 0) return null;
  const x0 = Math.max(0, minX - pad); const y0 = Math.max(0, minY - pad);
  const w = Math.min(width, maxX + pad + 1) - x0; const h = Math.min(height, maxY + pad + 1) - y0;
  const out = makeCanvas(w, h);
  out.getContext('2d')?.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
  return { src: out.toDataURL('image/png'), ratio: w / h };
}

/** Makes near-white pixels see-through, for a signature written on paper and photographed. */
export async function whiteToTransparent(src: string, cutoff = 225): Promise<{ src: string; ratio: number }> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = makeCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot edit the picture.');
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    if (lum >= cutoff) d[i + 3] = 0; else if (lum > cutoff - 40) d[i + 3] = Math.round(((cutoff - lum) / 40) * 255);
  }
  ctx.putImageData(image, 0, 0);
  return trimToPng(canvas) ?? { src, ratio: img.naturalWidth / img.naturalHeight };
}
