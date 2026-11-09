/** Small geometry helpers shared by the paper engine. Lengths are in millimetres. */

export interface Box { x: number; y: number; w: number; h: number }

export const r3 = (value: number) => Math.round(value * 1000) / 1000;

/** Clips a segment to a rectangle (Liang-Barsky), so grid lines never cross the margins. */
export function clipSegment(x1: number, y1: number, x2: number, y2: number, box: Box): [number, number, number, number] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges: [number, number][] = [[-dx, x1 - box.x], [dx, box.x + box.w - x1], [-dy, y1 - box.y], [dy, box.y + box.h - y1]];
  for (const [p, q] of edges) {
    if (p === 0) { if (q < 0) return null; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [r3(x1 + t0 * dx), r3(y1 + t0 * dy), r3(x1 + t1 * dx), r3(y1 + t1 * dy)];
}

/** Whole cells that fit in a length, and the offset that centres them. */
export function fit(length: number, step: number): { count: number; offset: number } {
  const count = Math.max(1, Math.floor(length / step + 1e-6));
  return { count, offset: (length - count * step) / 2 };
}
