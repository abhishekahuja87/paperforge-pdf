/** Reading a photo of a filled answer sheet. Pure code on pixel data, no browser needed.
 *  1. Find the four black corner squares (the top-left one is the big one).
 *  2. Work out how the photo is tilted and tipped, so any bubble on the sheet can be found in the photo.
 *  3. Look at each bubble: how much darker is the middle than the paper around it? */
import { MARKERS, type Bubble, type SheetLayout, BUBBLE_R } from './layout';

export interface Pixels { data: Uint8ClampedArray | Uint8Array; width: number; height: number }
export interface Mark { /** Index of the filled option, or -1 when none (or more than one) is filled. */ chosen: number; multiple: boolean; scores: number[] }
export interface Scan {
  found: boolean;
  /** The raw fill score of every bubble (0 empty to 1 solid), so the decision can be changed without reading the photo again. */
  answerScores: number[][];
  rollScores: number[][];
  /** Why the sheet could not be read. */
  reason?: 'markers' | 'shape';
  roll: string;
  answers: Mark[];
  /** Where each bubble is in the photo, for drawing on top of it. */
  answerPoints: Bubble[][];
  rollPoints: Bubble[][];
  corners: Bubble[];
  radius: number;
}
/** How dark the middle of a bubble must be, compared with the paper around it, to count as filled. */
export const SENSITIVITY = { normal: 0.25, light: 0.15, dark: 0.4 } as const;
export type SensitivityId = keyof typeof SENSITIVITY;

interface Blob { x: number; y: number; area: number }

const emptyScan = (reason: Scan['reason'], layout: SheetLayout): Scan => ({ found: false, reason, answerScores: [], rollScores: [], roll: '', answers: layout.answers.map(() => ({ chosen: -1, multiple: false, scores: [] })), answerPoints: [], rollPoints: [], corners: [], radius: 0 });

function grayOf(p: Pixels): Uint8Array {
  const out = new Uint8Array(p.width * p.height), d = p.data;
  for (let i = 0, j = 0; i < out.length; i += 1, j += 4) out[i] = (d[j]! * 77 + d[j + 1]! * 150 + d[j + 2]! * 29) >> 8;
  return out;
}

/** Solid dark squares: blobs whose shape is a filled square or disc (a ring, a letter or a line is not). */
function findBlobs(gray: Uint8Array, w: number, h: number): Blob[] {
  const stride = w + 1, integral = new Uint32Array(stride * (h + 1));
  for (let y = 0; y < h; y += 1) { let row = 0; for (let x = 0; x < w; x += 1) { row += gray[y * w + x]!; integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1]! + row; } }
  const half = Math.max(8, Math.round(w / 24)), dark = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - half), y1 = Math.min(h, y + half + 1);
    for (let x = 0; x < w; x += 1) {
      const g = gray[y * w + x]!; if (g > 150) continue;
      const x0 = Math.max(0, x - half), x1 = Math.min(w, x + half + 1);
      const sum = integral[y1 * stride + x1]! - integral[y0 * stride + x1]! - integral[y1 * stride + x0]! + integral[y0 * stride + x0]!;
      if (g < (sum / ((x1 - x0) * (y1 - y0))) * 0.72) dark[y * w + x] = 1;
    }
  }
  const minArea = w * h * 0.0001, maxArea = w * h * 0.012, blobs: Blob[] = [], stack = new Int32Array(w * h);
  for (let start = 0; start < dark.length; start += 1) {
    if (dark[start] !== 1) continue;
    let top = 0, n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, minX = w, maxX = 0, minY = h, maxY = 0;
    stack[top++] = start; dark[start] = 2;
    while (top > 0) {
      const at = stack[--top]!, y = (at / w) | 0, x = at - y * w;
      n += 1; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x > 0 && dark[at - 1] === 1) { dark[at - 1] = 2; stack[top++] = at - 1; }
      if (x < w - 1 && dark[at + 1] === 1) { dark[at + 1] = 2; stack[top++] = at + 1; }
      if (y > 0 && dark[at - w] === 1) { dark[at - w] = 2; stack[top++] = at - w; }
      if (y < h - 1 && dark[at + w] === 1) { dark[at + w] = 2; stack[top++] = at + w; }
    }
    if (n < minArea || n > maxArea) continue;
    const mx = sx / n, my = sy / n, a = sxx / n - mx * mx, b = syy / n - my * my, c = sxy / n - mx * my;
    const mid = (a + b) / 2, spread = Math.sqrt(Math.max(0, ((a - b) / 2) ** 2 + c * c)), l1 = mid + spread, l2 = mid - spread;
    if (l2 <= 0) continue;
    const roundness = Math.sqrt(l2 / l1), solidity = n / (12 * Math.sqrt(l1 * l2)), box = (maxX - minX + 1) * (maxY - minY + 1);
    if (roundness > 0.7 && solidity > 0.8 && solidity < 1.3 && n > box * 0.42) blobs.push({ x: mx, y: my, area: n });
  }
  return blobs;
}

const cross = (o: Bubble, a: Bubble, b: Bubble) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const dist = (a: Bubble, b: Bubble) => Math.hypot(a.x - b.x, a.y - b.y);

/** The four squares in sheet order (top-left big one first, then clockwise), or null. */
function pickCorners(blobs: Blob[], w: number, h: number): Blob[] | null {
  const pool = [...blobs].sort((p, q) => q.area - p.area).slice(0, 14);
  let best: Blob[] | null = null, bestArea = w * h * 0.08;
  for (let a = 0; a < pool.length; a += 1) for (let b = a + 1; b < pool.length; b += 1) for (let c = b + 1; c < pool.length; c += 1) for (let d = c + 1; d < pool.length; d += 1) {
    const four = [pool[a]!, pool[b]!, pool[c]!, pool[d]!], cx = four.reduce((s, p) => s + p.x, 0) / 4, cy = four.reduce((s, p) => s + p.y, 0) / 4;
    const ring = [...four].sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
    const signs = ring.map((p, i) => Math.sign(cross(p, ring[(i + 1) % 4]!, ring[(i + 2) % 4]!)));
    if (signs.some((s) => s !== signs[0] || s === 0)) continue;
    const bigIndex = ring.reduce((best2, p, i) => (p.area > ring[best2]!.area ? i : best2), 0), ordered = [0, 1, 2, 3].map((i) => ring[(bigIndex + i) % 4]!);
    const others = ordered.slice(1).map((p) => p.area), mean = others.reduce((s, v) => s + v, 0) / 3;
    if (others.some((v) => v > mean * 1.6 || v < mean / 1.6) || ordered[0]!.area < mean * 1.4 || ordered[0]!.area > mean * 4.5) continue;
    const top = dist(ordered[0]!, ordered[1]!), left = dist(ordered[0]!, ordered[3]!), bottom = dist(ordered[3]!, ordered[2]!), right = dist(ordered[1]!, ordered[2]!);
    const wide = (top + bottom) / 2, tall = (left + right) / 2, shape = wide / tall;
    if (shape < 0.5 || shape > 0.9) continue;
    const area = Math.abs(cross(ordered[0]!, ordered[1]!, ordered[2]!)) / 2 + Math.abs(cross(ordered[0]!, ordered[2]!, ordered[3]!)) / 2;
    if (area > bestArea) { best = ordered; bestArea = area; }
  }
  return best;
}

/** The 3 x 3 matrix that carries a point on the sheet (in mm) to the same point in the photo. */
export function homography(from: Bubble[], to: Bubble[]): number[] | null {
  const m: number[][] = [];
  from.forEach((p, i) => { const q = to[i]!; m.push([p.x, p.y, 1, 0, 0, 0, -q.x * p.x, -q.x * p.y, q.x], [0, 0, 0, p.x, p.y, 1, -q.y * p.x, -q.y * p.y, q.y]); });
  for (let col = 0; col < 8; col += 1) {
    let pivot = col; for (let r = col + 1; r < 8; r += 1) if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    if (Math.abs(m[pivot]![col]!) < 1e-10) return null;
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let r = 0; r < 8; r += 1) { if (r === col) continue; const f = m[r]![col]! / m[col]![col]!; for (let k = col; k < 9; k += 1) m[r]![k]! -= f * m[col]![k]!; }
  }
  return [...Array.from({ length: 8 }, (_, i) => m[i]![8]! / m[i]![i]!), 1];
}
export const project = (h: number[], x: number, y: number): Bubble => { const d = h[6]! * x + h[7]! * y + h[8]!; return { x: (h[0]! * x + h[1]! * y + h[2]!) / d, y: (h[3]! * x + h[4]! * y + h[5]!) / d }; };

/** How filled a bubble is, from 0 (empty) to about 1 (solid dark): the middle compared with the paper just outside the circle. */
function fillScore(gray: Uint8Array, w: number, h: number, at: Bubble, r: number): number {
  const sample = (x: number, y: number) => gray[Math.min(h - 1, Math.max(0, Math.round(y))) * w + Math.min(w - 1, Math.max(0, Math.round(x)))]!;
  let sum = 0, n = 0; const inner = r * 0.6, step = Math.max(1, inner / 4);
  for (let dy = -inner; dy <= inner; dy += step) for (let dx = -inner; dx <= inner; dx += step) if (dx * dx + dy * dy <= inner * inner) { sum += sample(at.x + dx, at.y + dy); n += 1; }
  const around: number[] = []; for (let k = 0; k < 8; k += 1) { const t = (k / 8) * Math.PI * 2; around.push(sample(at.x + Math.cos(t) * r * 1.75, at.y + Math.sin(t) * r * 1.75)); }
  around.sort((a, b) => a - b); const paper = Math.max(40, (around[3]! + around[4]!) / 2);
  return Math.max(0, Math.min(1, 1 - sum / Math.max(1, n) / paper));
}

/** Which option is filled, from the scores of one question. Nothing counts as filled below the sensitivity level, and two filled options count as a double mark. */
export function decide(scores: number[], sensitivity: SensitivityId): Mark {
  const need = SENSITIVITY[sensitivity], order = scores.map((_, i) => i).sort((a, b) => scores[b]! - scores[a]!), best = scores[order[0]!] ?? 0, second = scores[order[1]!] ?? 0;
  if (best < need) return { chosen: -1, multiple: false, scores };
  if (second >= need && second >= best * 0.6) return { chosen: -1, multiple: true, scores };
  return { chosen: order[0]!, multiple: false, scores };
}
/** The roll number from the digit scores. A column with no mark, or two, shows as a question mark. */
export const rollFrom = (scores: number[][], sensitivity: SensitivityId): string => scores.map((column) => { const m = decide(column, sensitivity); return m.chosen >= 0 ? String(m.chosen) : '?'; }).join('');

/** Read one photo of a sheet with this shape. */
export function scanSheet(pixels: Pixels, layout: SheetLayout, sensitivity: SensitivityId = 'normal'): Scan {
  const { width: w, height: h } = pixels, gray = grayOf(pixels), corners = pickCorners(findBlobs(gray, w, h), w, h);
  if (!corners) return emptyScan('markers', layout);
  const matrix = homography(MARKERS.map((m) => ({ x: m.x, y: m.y })), corners.map((c) => ({ x: c.x, y: c.y })));
  if (!matrix) return emptyScan('shape', layout);
  const pxPerMm = (dist(corners[0]!, corners[1]!) / (MARKERS[1]!.x - MARKERS[0]!.x) + dist(corners[0]!, corners[3]!) / (MARKERS[3]!.y - MARKERS[0]!.y)) / 2, r = BUBBLE_R * pxPerMm;
  const place = (b: Bubble) => project(matrix, b.x, b.y);
  const answerPoints = layout.answers.map((row) => row.map(place)), rollPoints = layout.rollDigits.map((column) => column.map(place));
  const answerScores = answerPoints.map((row) => row.map((p) => fillScore(gray, w, h, p, r))), rollScores = rollPoints.map((column) => column.map((p) => fillScore(gray, w, h, p, r)));
  return { found: true, answerScores, rollScores, roll: rollFrom(rollScores, sensitivity), answers: answerScores.map((row) => decide(row, sensitivity)), answerPoints, rollPoints, corners: corners.map((c) => ({ x: c.x, y: c.y })), radius: r };
}
