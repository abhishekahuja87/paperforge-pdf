/**
 * Removes a plain background from a picture, on the device. It finds the pixels that are close to the background colour and makes them transparent.
 * This is colour matching, not artificial intelligence: it works well for products on white, signatures, logos, scans and a plain wall, and poorly for
 * busy backgrounds or a subject that has the same colour as the background. Pure functions, so they can be checked on their own.
 */

export type Rgb = [number, number, number];
export interface RemoveOptions {
  /** 0 to 100: how different from the background colour a pixel may be and still count as background. */
  tolerance: number;
  /** True removes only background that touches the edge of the picture, so a white shirt or a hole inside the subject stays. */
  edgesOnly: boolean;
  /** Pixels to eat into the subject, to lose a light outline left by the old background. 0 to 3. */
  shrink: number;
  /** Pixels of softening on the cut edge. 0 to 3. */
  smooth: number;
  /** The background colour, or null to find it from the edges. */
  background: Rgb | null;
}

const MAX_DISTANCE = 140;
const distance = (data: Uint8ClampedArray, at: number, bg: Rgb) => Math.hypot(data[at]! - bg[0], data[at + 1]! - bg[1], data[at + 2]! - bg[2]);

/** The most common colour around the edge of the picture. */
export function detectBackground(image: ImageData): Rgb {
  const { data, width, height } = image; const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
  const add = (x: number, y: number) => {
    const at = (y * width + x) * 4; const key = ((data[at]! >> 4) << 8) | ((data[at + 1]! >> 4) << 4) | (data[at + 2]! >> 4);
    const bin = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }; bin.count += 1; bin.r += data[at]!; bin.g += data[at + 1]!; bin.b += data[at + 2]!; bins.set(key, bin);
  };
  const stepX = Math.max(1, Math.floor(width / 400)), stepY = Math.max(1, Math.floor(height / 400));
  for (let x = 0; x < width; x += stepX) { add(x, 0); add(x, height - 1); }
  for (let y = 0; y < height; y += stepY) { add(0, y); add(width - 1, y); }
  let best = { count: 0, r: 255, g: 255, b: 255 };
  bins.forEach((bin) => { if (bin.count > best.count) best = bin; });
  const n = Math.max(1, best.count); return [Math.round(best.r / n), Math.round(best.g / n), Math.round(best.b / n)];
}

/** Returns a copy of the picture with the background made transparent. */
export function removeBackground(image: ImageData, options: RemoveOptions): ImageData {
  const { width, height } = image; const source = image.data; const total = width * height;
  const bg = options.background ?? detectBackground(image); const limit = (options.tolerance / 100) * MAX_DISTANCE;
  const dist = new Float32Array(total); for (let i = 0; i < total; i += 1) dist[i] = distance(source, i * 4, bg);
  const removed = new Uint8Array(total);
  if (options.edgesOnly) {
    const stack = new Int32Array(total); let top = 0;
    const seed = (index: number) => { if (!removed[index] && dist[index]! <= limit) { removed[index] = 1; stack[top++] = index; } };
    for (let x = 0; x < width; x += 1) { seed(x); seed((height - 1) * width + x); }
    for (let y = 0; y < height; y += 1) { seed(y * width); seed(y * width + width - 1); }
    while (top > 0) {
      const index = stack[--top]!; const x = index % width;
      if (x > 0) seed(index - 1); if (x < width - 1) seed(index + 1); if (index >= width) seed(index - width); if (index < total - width) seed(index + width);
    }
  } else for (let i = 0; i < total; i += 1) if (dist[i]! <= limit) removed[i] = 1;

  // Alpha: removed pixels are clear; pixels touching the removed area fade in according to how close their colour is.
  let alpha = new Float32Array(total).fill(1);
  const soft = limit * 0.6 + 1;
  for (let i = 0; i < total; i += 1) {
    if (removed[i]) { alpha[i] = 0; continue; }
    const x = i % width;
    const touches = (x > 0 && removed[i - 1]) || (x < width - 1 && removed[i + 1]) || (i >= width && removed[i - width]) || (i < total - width && removed[i + width]);
    if (touches) alpha[i] = Math.max(0, Math.min(1, (dist[i]! - limit) / soft));
  }
  for (let round = 0; round < options.shrink; round += 1) {
    const next = new Float32Array(alpha);
    for (let i = 0; i < total; i += 1) {
      const x = i % width; let low = alpha[i]!;
      if (x > 0) low = Math.min(low, alpha[i - 1]!); if (x < width - 1) low = Math.min(low, alpha[i + 1]!); if (i >= width) low = Math.min(low, alpha[i - width]!); if (i < total - width) low = Math.min(low, alpha[i + width]!);
      next[i] = low;
    }
    alpha = next;
  }
  if (options.smooth > 0) {
    const radius = options.smooth; const pass = new Float32Array(total); const out = new Float32Array(total); const size = radius * 2 + 1;
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) { let sum = 0; for (let k = -radius; k <= radius; k += 1) sum += alpha[y * width + Math.max(0, Math.min(width - 1, x + k))]!; pass[y * width + x] = sum / size; }
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) { let sum = 0; for (let k = -radius; k <= radius; k += 1) sum += pass[Math.max(0, Math.min(height - 1, y + k)) * width + x]!; out[y * width + x] = sum / size; }
    alpha = out;
  }

  const result = new ImageData(width, height); const data = result.data;
  for (let i = 0; i < total; i += 1) {
    const a = alpha[i]!; const at = i * 4;
    if (a >= 0.999) { data[at] = source[at]!; data[at + 1] = source[at + 1]!; data[at + 2] = source[at + 2]!; data[at + 3] = 255; continue; }
    if (a <= 0.001) { data[at + 3] = 0; continue; }
    // Take the old background's colour out of the soft edge, so it does not leave a coloured outline.
    for (let c = 0; c < 3; c += 1) data[at + c] = Math.max(0, Math.min(255, Math.round((source[at + c]! - (1 - a) * bg[c]!) / a)));
    data[at + 3] = Math.round(a * 255);
  }
  return result;
}
