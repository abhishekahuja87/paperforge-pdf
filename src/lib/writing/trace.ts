/**
 * Works out how a pen would write a line of text, so the letters can be revealed as if written by hand.
 * The text is drawn once, thinned to a one pixel centre line (Zhang-Suen), and a pen order is walked along that line from the left.
 * Every pixel of the letters is then tied to the nearest centre-line pixel, so the letters are shown exactly where the pen has been.
 * Works with any font and any script the browser can draw, because it only looks at pixels.
 */

/** Size of the text used for tracing. The tracing is scaled to whatever size the video needs. */
export const TRACE_FONT_PX = 110;

export interface LineTrace {
  text: string;
  /** Font stack used, without the size. */
  family: string;
  weight: number;
  /** Size of the tracing canvas, and the width of the text inside it. */
  width: number;
  height: number;
  textWidth: number;
  /** Pen positions in order, in tracing pixels. */
  pathX: Int16Array;
  pathY: Int16Array;
  /** Distance the pen has covered when it reaches each position (a jump to another stroke costs little). */
  cost: Float32Array;
  /** Pixels of the letters grouped by the pen position that reveals them: pixels start[k] .. start[k+1] belong to position k. */
  pix: Int32Array;
  start: Int32Array;
}

export const fontSpec = (weight: number, px: number, family: string) => `${weight} ${px}px ${family}`;

/** Canvas size for a text at a font size, with room for tall and hanging letters. */
export function lineBox(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, px: number) {
  ctx.font = fontSpec(weight, px, family);
  const textWidth = ctx.measureText(text).width;
  const pad = Math.ceil(px * 0.3);
  return { textWidth, width: Math.ceil(textWidth + pad * 2), height: Math.ceil(px * 1.8) };
}

export function drawLineText(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, px: number, width: number, height: number) {
  ctx.font = fontSpec(weight, px, family);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
}

const NEIGHBOURS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

export function traceLine(text: string, weight: number, family: string): LineTrace {
  const probe = document.createElement('canvas').getContext('2d')!;
  const box = lineBox(probe, text, weight, family, TRACE_FONT_PX);
  const W = box.width, H = box.height;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#000'; drawLineText(ctx, text, weight, family, TRACE_FONT_PX, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i += 1) mask[i] = data[i * 4 + 3] > 127 ? 1 : 0;

  // Thinning to a one pixel line.
  const skin = mask.slice();
  const pass = (step: 0 | 1): boolean => {
    const remove: number[] = [];
    for (let y = 1; y < H - 1; y += 1) {
      for (let x = 1; x < W - 1; x += 1) {
        const i = y * W + x;
        if (!skin[i]) continue;
        const p2 = skin[i - W]!, p3 = skin[i - W + 1]!, p4 = skin[i + 1]!, p5 = skin[i + W + 1]!, p6 = skin[i + W]!, p7 = skin[i + W - 1]!, p8 = skin[i - 1]!, p9 = skin[i - W - 1]!;
        const count = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (count < 2 || count > 6) continue;
        const ring = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        let changes = 0;
        for (let k = 0; k < 8; k += 1) if (!ring[k] && ring[k + 1]) changes += 1;
        if (changes !== 1) continue;
        if (step === 0) { if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue; } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue;
        remove.push(i);
      }
    }
    for (const i of remove) skin[i] = 0;
    return remove.length > 0;
  };
  for (let again = true; again;) { const a = pass(0); const b = pass(1); again = a || b; }

  const around = (i: number): number[] => {
    const out: number[] = [];
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (skin[j]) out.push(j);
    }
    return out;
  };

  // Separate strokes (connected pieces of the centre line), left to right.
  const piece = new Int32Array(W * H).fill(-1);
  const pieces: number[][] = [];
  for (let i = 0; i < W * H; i += 1) {
    if (!skin[i] || piece[i] >= 0) continue;
    const stack = [i]; piece[i] = pieces.length; const list: number[] = [];
    while (stack.length) { const p = stack.pop()!; list.push(p); for (const q of around(p)) if (piece[q] < 0) { piece[q] = pieces.length; stack.push(q); } }
    pieces.push(list);
  }
  const leftmost = (list: number[]) => { let m = W; for (const p of list) m = Math.min(m, p % W); return m; };
  pieces.sort((a, b) => leftmost(a) - leftmost(b));

  // Pen order: start at the left-most end of each stroke and keep going as straight as possible.
  const order = new Int32Array(W * H).fill(-1);
  const path: number[] = [];
  for (const list of pieces) {
    const ends = list.filter((p) => around(p).length === 1);
    const pool = ends.length ? ends : list;
    let first = pool[0]!;
    for (const p of pool) if (p % W < first % W || (p % W === first % W && p < first)) first = p;
    const stack: [number, number][] = [[first, -1]];
    while (stack.length) {
      const [p, from] = stack.pop()!;
      if (order[p]! >= 0) continue;
      order[p] = path.length; path.push(p);
      const next = around(p).filter((q) => order[q]! < 0);
      if (!next.length) continue;
      const dx0 = from >= 0 ? (p % W) - (from % W) : 1, dy0 = from >= 0 ? ((p / W) | 0) - ((from / W) | 0) : 0;
      const score = (q: number) => dx0 * ((q % W) - (p % W)) + dy0 * (((q / W) | 0) - ((p / W) | 0));
      next.sort((a, b) => score(a) - score(b));
      for (const q of next) stack.push([q, p]);
    }
  }
  const total = Math.max(1, path.length);

  // Every pixel of the letters takes the pen position of its nearest centre-line pixel.
  const label = new Int32Array(W * H).fill(-1);
  const queue: number[] = [];
  for (let k = 0; k < path.length; k += 1) { label[path[k]!] = k; queue.push(path[k]!); }
  for (let head = 0; head < queue.length; head += 1) {
    const p = queue[head]!; const x = p % W, y = (p / W) | 0;
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (mask[j] && label[j]! < 0) { label[j] = label[p]!; queue.push(j); }
    }
  }
  const counts = new Int32Array(total + 1);
  let inked = 0;
  for (let i = 0; i < W * H; i += 1) if (mask[i]) { if (label[i]! < 0) label[i] = total - 1; counts[label[i]! + 1] += 1; inked += 1; }
  for (let k = 0; k < total; k += 1) counts[k + 1]! += counts[k]!;
  const fill = counts.slice(0, total);
  const pix = new Int32Array(inked);
  for (let i = 0; i < W * H; i += 1) if (mask[i]) { pix[fill[label[i]!]!] = i; fill[label[i]!]! += 1; }

  const pathX = new Int16Array(total), pathY = new Int16Array(total), cost = new Float32Array(total);
  for (let k = 0; k < path.length; k += 1) {
    pathX[k] = path[k]! % W; pathY[k] = (path[k]! / W) | 0;
    if (k > 0) { const jump = Math.hypot(pathX[k]! - pathX[k - 1]!, pathY[k]! - pathY[k - 1]!); cost[k] = cost[k - 1]! + (jump <= 1.5 ? jump : 0.25 * Math.min(jump, 40)); }
  }
  return { text, family, weight, width: W, height: H, textWidth: box.textWidth, pathX, pathY, cost, pix, start: counts };
}
