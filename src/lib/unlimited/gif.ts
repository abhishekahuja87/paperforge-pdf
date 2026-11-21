/**
 * A small animated GIF writer: one shared 256-colour palette (median cut) for all frames, LZW compression, looping.
 * Written for this site so no library is needed. GIF cannot show more than 256 colours, so photos look slightly flatter.
 */
export interface GifFrame { rgba: Uint8ClampedArray | Uint8Array; delayMs: number }

const BITS = 5;
const SIDE = 1 << BITS;

/** Median-cut palette (up to 256 colours) from the pixels of all frames, sampling at most about 300,000 pixels. */
export function buildPalette(frames: GifFrame[]): Uint8Array {
  const counts = new Uint32Array(SIDE * SIDE * SIDE);
  const total = frames.reduce((sum, frame) => sum + frame.rgba.length / 4, 0);
  const stride = Math.max(1, Math.floor(total / 300000));
  for (const frame of frames) {
    for (let p = 0; p < frame.rgba.length; p += 4 * stride) {
      const key = ((frame.rgba[p]! >> 3) << 10) | ((frame.rgba[p + 1]! >> 3) << 5) | (frame.rgba[p + 2]! >> 3);
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const bins: number[] = [];
  for (let key = 0; key < counts.length; key += 1) if (counts[key]) bins.push(key);
  const channel = (key: number, axis: number) => (axis === 0 ? key >> 10 : axis === 1 ? (key >> 5) & 31 : key & 31);
  let boxes: number[][] = [bins];
  while (boxes.length < 256) {
    let pick = -1; let pickScore = 0;
    boxes.forEach((box, index) => {
      if (box.length < 2) return;
      const weight = box.reduce((sum, key) => sum + counts[key]!, 0);
      if (weight > pickScore) { pickScore = weight; pick = index; }
    });
    if (pick < 0) break;
    const box = boxes[pick]!;
    let axis = 0; let widest = -1;
    for (let a = 0; a < 3; a += 1) {
      let lo = 31; let hi = 0;
      for (const key of box) { const c = channel(key, a); if (c < lo) lo = c; if (c > hi) hi = c; }
      if (hi - lo > widest) { widest = hi - lo; axis = a; }
    }
    box.sort((x, y) => channel(x, axis) - channel(y, axis));
    const half = box.reduce((sum, key) => sum + counts[key]!, 0) / 2;
    let running = 0; let cut = 1;
    for (let i = 0; i < box.length - 1; i += 1) { running += counts[box[i]!]!; cut = i + 1; if (running >= half) break; }
    boxes = [...boxes.slice(0, pick), box.slice(0, cut), box.slice(cut), ...boxes.slice(pick + 1)];
  }
  const palette = new Uint8Array(256 * 3);
  boxes.slice(0, 256).forEach((box, index) => {
    let r = 0; let g = 0; let b = 0; let n = 0;
    for (const key of box) { const w = counts[key]!; r += (key >> 10) * w; g += ((key >> 5) & 31) * w; b += (key & 31) * w; n += w; }
    palette[index * 3] = Math.min(255, Math.round((r / n) * 8 + 4));
    palette[index * 3 + 1] = Math.min(255, Math.round((g / n) * 8 + 4));
    palette[index * 3 + 2] = Math.min(255, Math.round((b / n) * 8 + 4));
  });
  return palette;
}

/** Index of the closest palette colour for each pixel. */
function mapToPalette(rgba: Uint8ClampedArray | Uint8Array, palette: Uint8Array, cache: Int16Array): Uint8Array {
  const out = new Uint8Array(rgba.length / 4);
  for (let p = 0, i = 0; p < rgba.length; p += 4, i += 1) {
    const r = rgba[p]!; const g = rgba[p + 1]!; const b = rgba[p + 2]!;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let found = cache[key]!;
    if (found < 0) {
      let best = 0; let bestDistance = Infinity;
      for (let c = 0; c < 256; c += 1) {
        const dr = r - palette[c * 3]!; const dg = g - palette[c * 3 + 1]!; const db = b - palette[c * 3 + 2]!;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDistance) { bestDistance = d; best = c; }
      }
      cache[key] = best; found = best;
    }
    out[i] = found;
  }
  return out;
}

function lzw(indices: Uint8Array): number[] {
  const minCode = 8; const clear = 1 << minCode; const eoi = clear + 1;
  let codeSize = minCode + 1; let next = eoi + 1;
  const dict = new Map<number, number>();
  const out: number[] = [];
  let cur = 0; let curBits = 0;
  const emit = (code: number) => { cur |= code << curBits; curBits += codeSize; while (curBits >= 8) { out.push(cur & 255); cur >>>= 8; curBits -= 8; } };
  emit(clear);
  let prefix = indices[0]!;
  for (let i = 1; i < indices.length; i += 1) {
    const k = indices[i]!;
    const key = (prefix << 8) | k;
    const found = dict.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    if (next === 4096) { emit(clear); dict.clear(); codeSize = minCode + 1; next = eoi + 1; }
    else { if (next >= (1 << codeSize)) codeSize += 1; dict.set(key, next); next += 1; }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (curBits > 0) out.push(cur & 255);
  return out;
}

/** The finished GIF file. Every frame must be width x height pixels of RGBA. loop 0 = forever. */
export function encodeGif(width: number, height: number, frames: GifFrame[], loop = 0): Uint8Array {
  if (frames.length === 0) throw new Error('Add at least one picture.');
  const palette = buildPalette(frames);
  const cache = new Int16Array(SIDE * SIDE * SIDE).fill(-1);
  const bytes: number[] = [];
  const push = (...values: number[]) => { for (const v of values) bytes.push(v & 255); };
  const word = (v: number) => push(v, v >> 8);
  for (const ch of 'GIF89a') push(ch.charCodeAt(0));
  word(width); word(height); push(0xf7, 0, 0);
  for (let i = 0; i < 768; i += 1) push(palette[i]!);
  if (frames.length > 1) { push(0x21, 0xff, 11); for (const ch of 'NETSCAPE2.0') push(ch.charCodeAt(0)); push(3, 1); word(loop); push(0); }
  for (const frame of frames) {
    push(0x21, 0xf9, 4, 0); word(Math.max(2, Math.round(frame.delayMs / 10))); push(0, 0);
    push(0x2c); word(0); word(0); word(width); word(height); push(0);
    const data = lzw(mapToPalette(frame.rgba, palette, cache));
    push(8);
    for (let i = 0; i < data.length; i += 255) { const chunk = data.slice(i, i + 255); push(chunk.length); for (const v of chunk) bytes.push(v); }
    push(0);
  }
  push(0x3b);
  return Uint8Array.from(bytes);
}
