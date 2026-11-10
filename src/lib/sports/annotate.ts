import type { Variant } from './courtData';
import { arcPoint, isSpot, setOutPrims, type Prim } from './marking';
import { xml } from './xml';
import { shortLength } from './units';

const num = (value: number): string => Number(value.toFixed(3)).toString();
const FONT = 'Arial, Helvetica, sans-serif';
const GREY = '#94a3b8';
const TEXT = '#64748b';

export interface ChainCaptions { endA: string; endB: string; sideA: string; sideB: string }

/** Distinct values, sorted, merging any closer than `gap`. */
const distinct = (values: number[], gap: number): number[] => {
  const sorted = [...values].sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of sorted) if (out.length === 0 || v - out[out.length - 1] > gap) out.push(v);
  return out;
};

/** Which distances along and across the court to write on the drawing: every line, rectangle edge, centre and spot. */
export function chainPositions(variant: Variant, prims: Prim[]): { xs: number[]; ys: number[]; centres: [number, number][] } {
  const { length: L, width: W } = variant;
  const xs: number[] = [];
  const ys: number[] = [];
  const centres: [number, number][] = [];
  for (const p of prims) {
    if (p.kind === 'line') {
      if (Math.abs(p.x1 - p.x2) < 1e-6) xs.push(p.x1);
      else if (Math.abs(p.y1 - p.y2) < 1e-6) ys.push(p.y1);
    } else if (p.kind === 'rect') {
      xs.push(p.x0, p.x1);
      ys.push(p.y0, p.y1);
    } else if (p.kind === 'circle') {
      xs.push(p.cx); ys.push(p.cy); centres.push([p.cx, p.cy]);
    } else {
      xs.push(p.cx); ys.push(p.cy); centres.push([p.cx, p.cy]);
    }
  }
  const inside = (v: number, max: number) => v > 1e-6 && v < max - 1e-6;
  const gap = Math.max(L, W) / 400;
  return { xs: distinct(xs.filter((v) => inside(v, L)), gap), ys: distinct(ys.filter((v) => inside(v, W)), gap), centres };
}

/**
 * Light grey measurements for the whole drawing: the distance of every line, rectangle edge, centre and spot from
 * end A (top), end B (bottom), side A (left) and side B (right), plus the radius of every circle and arc and the
 * size of every rectangle. They are grey so they stay in the background when a drawing is crowded.
 */
export function annotation(variant: Variant, f: number, edges: { bx0: number; by0: number; bx1: number; by1: number }, captions: ChainCaptions): string {
  const { length: L, width: W } = variant;
  const prims = setOutPrims(variant);
  const { xs, ys, centres } = chainPositions(variant, prims);
  const fs = f * 0.7;
  const thin = f * 0.05;
  const off = f * 0.8;
  const topY = edges.by0 - off;
  const botY = edges.by1 + off;
  const leftX = edges.bx0 - off;
  const rightX = edges.bx1 + off;
  const text = (x: number, y: number, content: string, extra = '') => `<text x="${num(x)}" y="${num(y)}" font-size="${num(fs)}" fill="${TEXT}" font-family="${FONT}" ${extra}>${xml(content)}</text>`;
  const halo = `stroke="#ffffff" stroke-width="${num(fs * 0.35)}" paint-order="stroke" stroke-linejoin="round"`;
  let out = `<g fill="none" stroke="${GREY}" stroke-width="${num(thin)}">`;

  // Guides from every centre and spot to the top and left edges, so its position can be read off the chains.
  for (const [cx, cy] of centres) out += `<path d="M${num(cx)} ${num(cy)}V0M${num(cx)} ${num(cy)}H0" stroke-dasharray="${num(f * 0.18)} ${num(f * 0.3)}"/>`;
  // Tick lines for the distances along the court (top and bottom) and across it (left and right).
  for (const x of xs) out += `<path d="M${num(x)} ${num(topY)}V0M${num(x)} ${num(W)}V${num(botY)}"/>`;
  for (const y of ys) out += `<path d="M${num(leftX)} ${num(y)}H0M${num(L)} ${num(y)}H${num(rightX)}"/>`;
  out += `<path d="M0 ${num(topY)}H${num(L)}M0 ${num(botY)}H${num(L)}M${num(leftX)} 0V${num(W)}M${num(rightX)} 0V${num(W)}"/>`;
  out += '</g>';

  const rot = (x: number, y: number, deg: number) => `transform="rotate(${deg} ${num(x)} ${num(y)})"`;
  for (const x of xs) {
    out += text(x + fs * 0.35, topY - off * 0.6, shortLength(x), `${rot(x + fs * 0.35, topY - off * 0.6, -90)}`);
    out += text(x + fs * 0.35, botY + off * 0.6, shortLength(L - x), `${rot(x + fs * 0.35, botY + off * 0.6, 90)}`);
  }
  for (const y of ys) {
    out += text(leftX - off * 0.6, y + fs * 0.35, shortLength(y), 'text-anchor="end"');
    out += text(rightX + off * 0.6, y + fs * 0.35, shortLength(W - y));
  }
  // Which chain is which, in the four corners outside the court.
  out += text(edges.bx0 - off, topY - fs * 0.2, captions.endA, 'text-anchor="end" font-weight="700"');
  out += text(edges.bx1 + off, topY - fs * 0.2, captions.sideB, 'font-weight="700"');
  out += text(edges.bx0 - off, botY + fs * 1.0, captions.sideA, 'text-anchor="end" font-weight="700"');
  out += text(edges.bx1 + off, botY + fs * 1.0, captions.endB, 'font-weight="700"');

  // Sizes of rectangles and radii of circles and arcs, written on the drawing.
  const radius = (cx: number, cy: number, r: number, x: number, y: number) => {
    const mx = (cx + x) / 2;
    const my = (cy + y) / 2;
    return `<path d="M${num(cx)} ${num(cy)}L${num(x)} ${num(y)}" stroke="${GREY}" stroke-width="${num(thin)}" fill="none"/><circle cx="${num(cx)}" cy="${num(cy)}" r="${num(f * 0.12)}" fill="${GREY}"/>${text(mx, my - fs * 0.25, `R ${shortLength(r)}`, `text-anchor="middle" ${halo}`)}`;
  };
  for (const p of prims) {
    if (p.kind === 'rect' && p.x1 - p.x0 > f * 3 && p.y1 - p.y0 > f * 3 && p.x0 >= 0 && p.x1 <= L) {
      out += text((p.x0 + p.x1) / 2, p.y0 + fs * 2.6, `${shortLength(p.x1 - p.x0)} x ${shortLength(p.y1 - p.y0)}`, `text-anchor="middle" ${halo}`);
    } else if (p.kind === 'circle' && !isSpot(p)) {
      const a = (3 * Math.PI) / 4;
      out += radius(p.cx, p.cy, p.r, p.cx + p.r * Math.cos(a), p.cy + p.r * Math.sin(a));
    } else if (p.kind === 'arc' && p.r < f * 2) {
      // Too small to label on the line (a corner arc): write the radius just inside the court, beside it.
      const dx = L / 2 - p.cx;
      const dy = W / 2 - p.cy;
      const d = Math.hypot(dx, dy) || 1;
      const x = p.cx + (dx / d) * (p.r + f * 1.4);
      const y = p.cy + (dy / d) * (p.r + f * 1.4);
      out += text(x, y + fs * 0.3, `R ${shortLength(p.r)}`, `text-anchor="${dx >= 0 ? 'start' : 'end'}" ${halo}`);
    } else if (p.kind === 'arc') {
      const [x, y] = arcPoint(p, 0.3);
      out += radius(p.cx, p.cy, p.r, x, y);
    }
  }
  return out;
}
