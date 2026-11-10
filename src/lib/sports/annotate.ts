import type { Variant } from './courtData';
import { anchor, arcPoint, isSpot, markDistance, markFor, parsePaths, partFor, setOutPrims, type Prim } from './marking';
import { xml } from './xml';
import { shortLength } from './units';

const num = (value: number): string => Number(value.toFixed(3)).toString();
const FONT = 'Arial, Helvetica, sans-serif';
const GREY = '#94a3b8';
const TEXT = '#64748b';

export interface ChainCaptions { endA: string; endB: string; sideA: string; sideB: string }

/** Names and words written on the drawing, from the locale file. */
export interface LabelNames {
  marks: Record<string, string>;
  parts: Record<string, string>;
  /** "from the end line", "from the net", "from the side line". */
  refs: { end: string; net: string; side: string };
  radius: string;
}

/** The names for the drawing, from the sport's locale text and the shared words. */
export const labelNames = (marks: Record<string, string>, parts: Record<string, string>, ui: Record<string, string>, refs: { net?: string } = {}): LabelNames => ({
  marks, parts, refs: { end: ui.refEnd, net: refs.net ?? ui.refNet, side: ui.refSide }, radius: ui.radiusWord,
});

export interface AnnotateOptions { captions: ChainCaptions; /** Leave out to write only the distances, without names. */ names?: LabelNames }

const fillValues = (template: string, values: number[]): string => template.replace(/\{v(\d)\}/g, (_, i: string) => (values[Number(i) - 1] === undefined ? '' : shortLength(values[Number(i) - 1])));

/** Notes that belong at the net or in the footer, as finished text. */
export function noteLines(variant: Variant, names: LabelNames, at: 'net' | 'footer'): string[] {
  return (variant.parts ?? []).flatMap((part) => (part.kind === 'note' && part.at === at && names.parts[part.id] ? [fillValues(names.parts[part.id], part.values ?? [])] : []));
}

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
export function annotation(variant: Variant, f: number, edges: { bx0: number; by0: number; bx1: number; by1: number }, options: AnnotateOptions): { markup: string; legend: string[] } {
  const { captions } = options;
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

  const wrapTo = (value: string, chars: number): string[] => {
    const lines: string[] = [];
    let line = '';
    for (const word of value.split(' ')) {
      if (line && line.length + word.length + 1 > chars) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    return lines;
  };
  const labelLayer = (fs: number, names: LabelNames): { markup: string; legend: string[] } => {
  const legend: string[] = [];
  // Names and measurements written beside every line, circle, arc, rectangle and spot. Each label tries a few places
  // and takes the first that does not run over a label already placed.
  const ink = '#334155';
  const eps = 1e-6;
  interface Box { x0: number; y0: number; x1: number; y1: number }
  interface Cand { boxes: Box[]; markup: string }
  let out = '';
  const placed: Box[] = [];
  const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const cost = (c: Cand) => c.boxes.reduce((sum, box) => sum + placed.reduce((s2, other) => s2 + overlap(box, other), 0), 0);
  /** Puts a label in the first place where it runs over nothing. If there is none, a numbered badge goes on the item and the label is listed beside the drawing. */
  const place = (cands: Cand[], fallback?: { name: string; measure: string; at: [number, number] }) => {
    const found = cands.find((cand) => cost(cand) === 0);
    if (found) { placed.push(...found.boxes); out += found.markup; return; }
    if (!fallback) { const first = cands[0]; if (first) { placed.push(...first.boxes); out += first.markup; } return; }
    const entry = fallback.name ? `${fallback.name}: ${fallback.measure}` : fallback.measure;
    const known = legend.findIndex((line) => line.slice(line.indexOf('. ') + 2) === entry);
    const n = known >= 0 ? known + 1 : legend.length + 1;
    if (known < 0) legend.push(`${n}. ${entry}`);
    const [bx, by] = fallback.at;
    placed.push({ x0: bx - fs, x1: bx + fs, y0: by - fs, y1: by + fs });
    out += `<circle cx="${num(bx)}" cy="${num(by)}" r="${num(fs * 0.8)}" fill="${ink}" stroke="#ffffff" stroke-width="${num(thin)}"/><text x="${num(bx)}" y="${num(by + fs * 0.33)}" font-size="${num(fs * 0.95)}" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="${FONT}">${n}</text>`;
  };
  const wide = (value: string, bold = false) => value.length * fs * (bold ? 0.62 : 0.56);
  const body = (x: number, y: number, value: string, anchor: string, bold: boolean, extra = '') =>
    `<text x="${num(x)}" y="${num(y)}" font-size="${num(fs)}" fill="${ink}" ${bold ? 'font-weight="700" ' : ''}text-anchor="${anchor}" font-family="${FONT}" ${halo} ${extra}>${xml(value)}</text>`;
  const refText = (ref: 'end' | 'net' | 'side' | undefined) => names.refs[ref ?? 'end'];
  const radiusLine = (cx: number, cy: number, x: number, y: number) =>
    `<path d="M${num(cx)} ${num(cy)}L${num(x)} ${num(y)}" stroke="${GREY}" stroke-width="${num(thin)}" fill="none"/><circle cx="${num(cx)}" cy="${num(cy)}" r="${num(f * 0.12)}" fill="${GREY}"/>`;

  /** Two rows of horizontal text, the name above the measurement. (x, y) is the middle (or start or end) of the first row's baseline. */
  const rows = (x: number, y: number, name: string, measure: string, anchor: 'start' | 'middle' | 'end'): Cand => {
    const w = Math.max(wide(name, true), wide(measure));
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    return { boxes: [{ x0, x1: x0 + w, y0: y - fs, y1: y + fs * 1.3 }], markup: body(x, y, name, anchor, true) + body(x, y + fs * 1.15, measure, anchor, false) };
  };
  /** The same, written upwards along a vertical line. `side` is which side of x the text sits on. */
  const columns = (x: number, yc: number, name: string, measure: string, side: 'right' | 'left'): Cand => {
    const w = Math.max(wide(name, true), wide(measure));
    const b1 = side === 'right' ? x + fs * 1.15 : x - fs * 1.55;
    const b2 = side === 'right' ? x + fs * 2.35 : x - fs * 0.35;
    const rotate = (b: number) => `transform="rotate(-90 ${num(b)} ${num(yc)})"`;
    const x0 = Math.min(b1, b2) - fs * 1.0;
    return { boxes: [{ x0, x1: Math.max(b1, b2) + fs * 0.3, y0: yc - w / 2, y1: yc + w / 2 }], markup: body(b1, yc, name, 'middle', true, rotate(b1)) + body(b2, yc, measure, 'middle', false, rotate(b2)) };
  };
  const along = (xm: number, y: number, name: string, measure: string, side: 'below' | 'above'): Cand => {
    const w = Math.max(wide(name, true), wide(measure));
    const n1 = side === 'below' ? y + fs * 1.15 : y - fs * 1.55;
    return { boxes: [{ x0: xm - w / 2, x1: xm + w / 2, y0: n1 - fs, y1: n1 + fs * 1.4 }], markup: body(xm, n1, name, 'middle', true) + body(xm, n1 + fs * 1.15, measure, 'middle', false) };
  };

  const items: { order: number; run: () => void }[] = [];
  for (const p of parsePaths(variant.lines)) {
    if (p.kind === 'line') {
      const mark = markFor(p, variant);
      if (!mark) continue;
      const name = names.marks[mark.id] ?? mark.id;
      const measure = `${shortLength(markDistance(mark, p, variant))} ${refText(mark.ref)}`;
      items.push({ order: 3, run: () => lineCandidates(name, measure, p.x1, p.y1, p.x2, p.y2) });
      continue;
    }
    const part = partFor(p, variant);
    if (!part) continue;
    const name = names.parts[part.id] ?? part.id;
    if (p.kind === 'circle' && !isSpot(p)) {
      items.push({ order: 1, run: () => place([3, 1, -1, -3].map((k) => { const a = (k * Math.PI) / 4; const x = p.cx + p.r * Math.cos(a); const y = p.cy + p.r * Math.sin(a); const c = rows((p.cx + x) / 2, (p.cy + y) / 2 - fs * 0.2, name, `${names.radius} ${shortLength(p.r)}`, 'middle'); c.markup = radiusLine(p.cx, p.cy, x, y) + c.markup; return c; }), { name, measure: `${names.radius} ${shortLength(p.r)}`, at: anchor(p) }) });
    } else if (p.kind === 'circle') {
      const end = Math.min(p.cx, L - p.cx);
      const measure = `${shortLength(end)} ${names.refs.end}`;
      items.push({ order: 4, run: () => place([[1, 0.35], [-1, 0.35], [1, -2.2], [-1, -2.2]].map(([dir, dy]) => rows(p.cx + dir * fs * 0.9, p.cy + dy * fs, name, measure, dir > 0 ? 'start' : 'end')), { name, measure, at: anchor(p) }) });
    } else if (p.kind === 'arc' && p.r < f * 2) {
      const dx = L / 2 - p.cx;
      const dy = W / 2 - p.cy;
      const d = Math.hypot(dx, dy) || 1;
      items.push({ order: 2, run: () => place([1.1, 2.2, 3.4].map((k) => rows(p.cx + (dx / d) * (p.r + f * k), p.cy + (dy / d) * (p.r + f * k), name, `${names.radius} ${shortLength(p.r)}`, dx >= 0 ? 'start' : 'end')), { name, measure: `${names.radius} ${shortLength(p.r)}`, at: anchor(p) }) });
    } else if (p.kind === 'arc') {
      items.push({ order: 1, run: () => place([0.3, 0.7, 0.5, 0.15].map((t) => { const [x, y] = arcPoint(p, t); const c = rows((p.cx + x) / 2, (p.cy + y) / 2 - fs * 0.2, name, `${names.radius} ${shortLength(p.r)}`, 'middle'); c.markup = radiusLine(p.cx, p.cy, x, y) + c.markup; return c; }), { name, measure: `${names.radius} ${shortLength(p.r)}`, at: anchor(p) }) });
    } else if (p.kind === 'rect') {
      const w = Math.abs(p.x1 - p.x0);
      const h = Math.abs(p.y1 - p.y0);
      const sized = `${shortLength(w)} x ${shortLength(h)}`;
      const cx = (p.x0 + p.x1) / 2;
      const cands: Cand[] = [];
      if (p.x0 >= 0 && p.x1 <= L) {
        cands.push(rows(cx, p.y0 + fs * 1.8, name, sized, 'middle'), rows(cx, p.y1 - fs * 2.6, name, sized, 'middle'), rows(cx, (p.y0 + p.y1) / 2 - fs * 0.5, name, sized, 'middle'));
      }
      cands.push(rows(Math.max(p.x1, 0) + fs * 0.6, (p.y0 + p.y1) / 2 - fs * 0.4, name, sized, 'start'), rows(Math.min(p.x0, L) - fs * 0.6, (p.y0 + p.y1) / 2 - fs * 0.4, name, sized, 'end'));
      items.push({ order: 0, run: () => place(cands, { name, measure: sized, at: anchor(p) }) });
    }
  }
  function lineCandidates(name: string, measure: string, x1: number, y1: number, x2: number, y2: number): void {
    if (Math.abs(x1 - x2) < eps) {
      const toward: 'right' | 'left' = x1 < L / 2 + eps ? 'right' : 'left';
      const away: 'right' | 'left' = toward === 'right' ? 'left' : 'right';
      const lo = Math.min(y1, y2);
      const hi = Math.max(y1, y2);
      const ys = [0.5, 0.25, 0.75, 0.12, 0.88].map((t) => lo + (hi - lo) * t);
      const single = (side: 'right' | 'left', yc: number): Cand => {
        const c = columns(x1, yc, `${name}: ${measure}`, '', side);
        const b = side === 'right' ? x1 + fs * 1.15 : x1 - fs * 0.35;
        const w = wide(`${name}: ${measure}`, false);
        c.markup = body(b, yc, `${name}: ${measure}`, 'middle', false, `transform="rotate(-90 ${num(b)} ${num(yc)})"`);
        c.boxes = [{ x0: b - fs * 1.0, x1: b + fs * 0.3, y0: yc - w / 2, y1: yc + w / 2 }];
        return c;
      };
      place([...[toward, away].flatMap((side) => ys.map((yc) => columns(x1, yc, name, measure, side))), ...[toward, away].flatMap((side) => ys.map((yc) => single(side, yc)))], { name, measure, at: [x1, (y1 + y2) / 2] });
    } else {
      const lo = Math.min(x1, x2);
      const hi = Math.max(x1, x2);
      const first: 'below' | 'above' = y1 < W / 2 + eps ? 'below' : 'above';
      const second: 'below' | 'above' = first === 'below' ? 'above' : 'below';
      const xs2 = [0.5, 0.25, 0.75, 0.12, 0.88].map((t) => lo + (hi - lo) * t);
      const single = (side: 'below' | 'above', xm: number): Cand => {
        const w = wide(`${name}: ${measure}`);
        const yb = side === 'below' ? y1 + fs * 1.15 : y1 - fs * 0.45;
        return { boxes: [{ x0: xm - w / 2, x1: xm + w / 2, y0: yb - fs, y1: yb + fs * 0.35 }], markup: body(xm, yb, `${name}: ${measure}`, 'middle', false) };
      };
      place([...[first, second].flatMap((side) => xs2.map((xm) => along(xm, y1, name, measure, side))), ...[first, second].flatMap((side) => xs2.map((xm) => single(side, xm)))], { name, measure, at: [(x1 + x2) / 2, y1] });
    }
  }
  // The net is drawn dashed: its name goes beside it.
  for (const mark of variant.marks) {
    for (const d of variant.dashed ?? []) {
      for (const p of parsePaths([d])) {
        if (p.kind !== 'line' || Math.abs(p.x1 - p.x2) > eps || mark.from !== 'end' || Math.abs(p.x1 - mark.m) > eps) continue;
        const name = names.marks[mark.id] ?? mark.id;
        const measure = `${shortLength(Math.min(p.x1, L - p.x1))} ${refText(mark.ref)}`;
        items.push({ order: 3, run: () => lineCandidates(name, measure, p.x1, 0, p.x1, W) });
      }
    }
  }
  items.sort((a, b) => a.order - b.order).forEach((item) => item.run());

  // Heights and other facts about the net, written along it on the other side.
  for (const note of noteLines(variant, names, 'net')) {
    const chars = Math.max(18, Math.floor((W * 0.92) / (fs * 0.56)));
    const lines = wrapTo(note, chars);
    const cands: Cand[] = [];
    for (const side of ['left', 'right'] as const) {
      const base = side === 'left' ? L / 2 - fs * 0.35 : L / 2 + fs * 1.15;
      const markup = lines.map((line, i) => {
        const b = side === 'left' ? base - (lines.length - 1 - i) * fs * 1.2 : base + i * fs * 1.2;
        return body(b, W / 2, line, 'middle', false, `transform="rotate(-90 ${num(b)} ${num(W / 2)})"`);
      }).join('');
      const widest = Math.max(...lines.map((line) => wide(line)));
      cands.push({ boxes: [{ x0: (side === 'left' ? base - lines.length * fs * 1.2 : base - fs), x1: (side === 'left' ? base + fs * 0.3 : base + lines.length * fs * 1.2), y0: W / 2 - widest / 2, y1: W / 2 + widest / 2 }], markup });
    }
    place(cands, { name: '', measure: note, at: [L / 2, W / 2] });
  }
  return { markup: out, legend };
  };
  if (options.names) {
    const layer = labelLayer(f * 0.62, options.names);
    out += layer.markup;
    return { markup: out, legend: layer.legend };
  }
  return { markup: out, legend: [] };
}
