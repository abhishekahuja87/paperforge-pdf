import type { Mark, Part, Variant } from './courtData';
import { formatLength } from './units';

/** One thing to mark on the ground, in metres from corner A (x along the length, y across the width). */
export type Prim =
  | { kind: 'rect'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'arc'; cx: number; cy: number; r: number; x1: number; y1: number; x2: number; y2: number; sweep: 0 | 1 };

const EPS = 1e-6;
const near = (a: number, b: number) => Math.abs(a - b) < EPS;
const numbers = (text: string): number[] => (text.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);

interface Cmd { c: string; v: number[] }
const commands = (d: string): Cmd[] => Array.from(d.matchAll(/([MLHVAZhvaz])([^MLHVAZhvaz]*)/g), (m) => ({ c: m[1], v: numbers(m[2]) }));

/** Centre of the circle an SVG arc of radius r (no rotation) lies on. */
function arcCentre(x1: number, y1: number, x2: number, y2: number, r: number, large: number, sweep: number): [number, number] {
  const hx = (x1 - x2) / 2;
  const hy = (y1 - y2) / 2;
  const d2 = hx * hx + hy * hy;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, (r * r - d2) / d2));
  return [k * hy + (x1 + x2) / 2, -k * hx + (y1 + y2) / 2];
}

/** Reads the SVG paths the drawings are made from back into rectangles, lines, circles and arcs. */
export function parsePaths(paths: string[]): Prim[] {
  const out: Prim[] = [];
  for (const d of paths) {
    // A path may hold several sub-paths, each starting at an M.
    const subs: Cmd[][] = [];
    for (const cmd of commands(d)) {
      if (cmd.c === 'M') subs.push([cmd]);
      else subs[subs.length - 1]?.push(cmd);
    }
    for (const sub of subs) {
      const shape = sub.map((cmd) => cmd.c).join('');
      const [sx, sy] = sub[0].v;
      if (shape === 'Mhvhz') {
        out.push({ kind: 'rect', x0: sx, y0: sy, x1: sx + sub[1].v[0], y1: sy + sub[2].v[0] });
      } else if (shape === 'Maaz') {
        const r = sub[1].v[0];
        out.push({ kind: 'circle', cx: sx + r, cy: sy, r });
      } else {
        let x = sx;
        let y = sy;
        for (const cmd of sub.slice(1)) {
          if (cmd.c === 'L') {
            out.push({ kind: 'line', x1: x, y1: y, x2: cmd.v[0], y2: cmd.v[1] });
            [x, y] = cmd.v;
          } else if (cmd.c === 'A') {
            const [r, , , large, sweep, ex, ey] = cmd.v;
            const [cx, cy] = arcCentre(x, y, ex, ey, r, large, sweep);
            out.push({ kind: 'arc', cx, cy, r, x1: x, y1: y, x2: ex, y2: ey, sweep: sweep === 1 ? 1 : 0 });
            x = ex; y = ey;
          }
        }
      }
    }
  }
  return out;
}

/** Spots are drawn as tiny circles; the rules set their real size. */
export const isSpot = (prim: Prim): boolean => prim.kind === 'circle' && prim.r <= 0.3;

const isOuter = (prim: Prim, variant: Variant): boolean => {
  const { length: L, width: W } = variant;
  if (variant.round) return prim.kind === 'circle' && near(prim.r, L / 2) && near(prim.cx, L / 2) && near(prim.cy, W / 2);
  return prim.kind === 'rect' && near(prim.x0, 0) && near(prim.y0, 0) && near(prim.x1, L) && near(prim.y1, W);
};

/** A point on an arc, t = 0 at its start and 1 at its end. */
export function arcPoint(prim: Extract<Prim, { kind: 'arc' }>, t: number): [number, number] {
  const tau = 2 * Math.PI;
  const a1 = Math.atan2(prim.y1 - prim.cy, prim.x1 - prim.cx);
  const a2 = Math.atan2(prim.y2 - prim.cy, prim.x2 - prim.cx);
  const turn = prim.sweep === 1 ? (((a2 - a1) % tau) + tau) % tau : -((((a1 - a2) % tau) + tau) % tau);
  const angle = a1 + turn * t;
  return [prim.cx + prim.r * Math.cos(angle), prim.cy + prim.r * Math.sin(angle)];
}

/** Where a number can sit on the drawing so it points at this item. */
export function anchor(prim: Prim): [number, number] {
  switch (prim.kind) {
    case 'rect': return [(prim.x0 + prim.x1) / 2, prim.y0];
    case 'line': return [(prim.x1 + prim.x2) / 2, (prim.y1 + prim.y2) / 2];
    case 'circle': return prim.r <= 0.3 ? [prim.cx + 0.9, prim.cy - 0.9] : [prim.cx, prim.cy - prim.r];
    case 'arc': return arcPoint(prim, 0.5);
  }
}

/** The named line this item is, if it is one: it matches a mark at that distance from either end or side. */
export function markFor(prim: Prim, variant: Variant): Mark | null {
  if (prim.kind !== 'line') return null;
  const { length: L, width: W } = variant;
  const vertical = near(prim.x1, prim.x2);
  const horizontal = near(prim.y1, prim.y2);
  for (const mark of variant.marks) {
    if (mark.from === 'end' && vertical && (near(prim.x1, mark.m) || near(prim.x1, L - mark.m))) return mark;
    if (mark.from === 'side' && horizontal && (near(prim.y1, mark.m) || near(prim.y1, W - mark.m))) return mark;
  }
  return null;
}

/** The named circle, arc, rectangle or spot this item is, if any. */
export function partFor(prim: Prim, variant: Variant): Part | null {
  const { length: L } = variant;
  for (const part of variant.parts ?? []) {
    if ((part.kind === 'circle' || part.kind === 'arc') && (prim.kind === part.kind) && !isSpot(prim) && near(prim.r, part.r)) return part;
    if (part.kind === 'rect' && prim.kind === 'rect') {
      const w = Math.abs(prim.x1 - prim.x0);
      const h = Math.abs(prim.y1 - prim.y0);
      if ((near(w, part.w) && near(h, part.h)) || (near(w, part.h) && near(h, part.w))) return part;
    }
    if (part.kind === 'spot' && prim.kind === 'circle' && isSpot(prim) && (near(prim.cx, part.x) || near(prim.cx, L - part.x))) return part;
  }
  return null;
}

/** How far a named line is from what it is measured from. */
export function markDistance(mark: Mark, prim: Extract<Prim, { kind: 'line' }>, variant: Variant): number {
  const { length: L, width: W } = variant;
  if (near(prim.x1, prim.x2)) return mark.ref === 'net' ? Math.abs(prim.x1 - L / 2) : Math.min(prim.x1, L - prim.x1);
  return mark.ref === 'net' ? Math.abs(prim.y1 - W / 2) : Math.min(prim.y1, W - prim.y1);
}

/** Words for the set-out guide, from the locale file. {name} placeholders are filled in here. */
export interface MarkingText {
  heading: string; intro: string; prepTitle: string; prep: string[]; outerTitle: string; outerRect: string; outerRound: string;
  titleAcross: string; titleAlong: string; titleOther: string; titleRect: string; titleSpot: string; titleCircle: string; titleArc: string; titleNet: string;
  acrossPos: string; acrossExt: string; alongPos: string; alongExt: string; otherLine: string; rectBody1: string; rectBody2: string; spotBody: string;
  circleBody1: string; circleBody2: string; arcBody1: string; arcBody2: string; netBody: string; checkTitle: string; check: string[];
  endA: string; endB: string; outsideA: string; outsideB: string; setOutDiagram: string;
}

export interface Step { n: number; title: string; lines: string[]; prim?: Prim }

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');

/** Every line, circle, arc and spot of the court in a sensible order, with exact positions. */
export function setOutPrims(variant: Variant): Prim[] {
  const prims = parsePaths(variant.lines).filter((prim) => !isOuter(prim, variant));
  const key = (p: Prim): [number, number, number] => {
    const order = p.kind === 'rect' ? 0 : p.kind === 'line' ? 1 : p.kind === 'circle' ? (isSpot(p) ? 4 : 2) : 3;
    const x = p.kind === 'rect' ? p.x0 : p.kind === 'line' ? Math.min(p.x1, p.x2) : p.kind === 'circle' ? p.cx : Math.min(p.x1, p.x2);
    const y = p.kind === 'rect' ? p.y0 : p.kind === 'line' ? Math.min(p.y1, p.y2) : p.kind === 'circle' ? p.cy : Math.min(p.y1, p.y2);
    return [order, x, y];
  };
  return prims.sort((a, b) => { const ka = key(a); const kb = key(b); return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2]; });
}

/** The marking steps: the outer shape, then each item with its position from both ends or sides, then the final checks. */
export function markingSteps(variant: Variant, text: MarkingText, markName: (id: string) => string, netPositions: number[]): Step[] {
  const { length: L, width: W } = variant;
  const f = formatLength;
  const along = (v: number) => (v < -EPS ? fill(text.outsideA, { v: f(-v) }) : v > L + EPS ? fill(text.outsideB, { v: f(v - L) }) : f(v));
  const across = (v: number) => (v < -EPS ? fill(text.outsideA, { v: f(-v) }) : v > W + EPS ? fill(text.outsideB, { v: f(v - W) }) : f(v));
  const named = (prim: Prim): string | null => {
    const mark = markFor(prim, variant);
    if (mark) return markName(mark.id);
    const part = partFor(prim, variant);
    return part ? markName(part.id) : null;
  };

  const steps: Step[] = [];
  const diag = Math.hypot(L, W);
  steps.push({
    n: 1, title: text.outerTitle,
    lines: [variant.round ? fill(text.outerRound, { radius: f(L / 2), diameter: f(L) }) : fill(text.outerRect, { length: f(L), width: f(W), diag: f(diag) })],
  });

  for (const prim of setOutPrims(variant)) {
    const n = steps.length + 1;
    if (prim.kind === 'line') {
      const label = named(prim);
      const length = Math.hypot(prim.x2 - prim.x1, prim.y2 - prim.y1);
      if (near(prim.x1, prim.x2)) {
        steps.push({ n, prim, title: label ? `${label} (${text.titleAcross.toLowerCase()})` : text.titleAcross, lines: [fill(text.acrossPos, { x: f(prim.x1), xb: f(L - prim.x1) }), fill(text.acrossExt, { y1: across(Math.min(prim.y1, prim.y2)), y2: across(Math.max(prim.y1, prim.y2)), len: f(length) })] });
      } else if (near(prim.y1, prim.y2)) {
        steps.push({ n, prim, title: label ? `${label} (${text.titleAlong.toLowerCase()})` : text.titleAlong, lines: [fill(text.alongPos, { y: f(prim.y1), yb: f(W - prim.y1) }), fill(text.alongExt, { x1: along(Math.min(prim.x1, prim.x2)), x2: along(Math.max(prim.x1, prim.x2)), len: f(length) })] });
      } else {
        steps.push({ n, prim, title: text.titleOther, lines: [fill(text.otherLine, { x1: f(prim.x1), y1: f(prim.y1), x2: f(prim.x2), y2: f(prim.y2), len: f(length) })] });
      }
    } else if (prim.kind === 'rect') {
      const w = prim.x1 - prim.x0;
      const h = prim.y1 - prim.y0;
      const rectName = named(prim);
      steps.push({ n, prim, title: rectName ? `${rectName} (${text.titleRect.toLowerCase()})` : text.titleRect, lines: [fill(text.rectBody1, { x0: along(prim.x0), x1: along(prim.x1), y0: across(prim.y0), y1: across(prim.y1) }), fill(text.rectBody2, { w: f(w), h: f(h), diag: f(Math.hypot(w, h)) })] });
    } else if (prim.kind === 'circle') {
      const circleName = named(prim);
      if (isSpot(prim)) steps.push({ n, prim, title: circleName ? `${circleName} (${text.titleSpot.toLowerCase()})` : text.titleSpot, lines: [fill(text.spotBody, { x: f(prim.cx), y: f(prim.cy) })] });
      else steps.push({ n, prim, title: circleName ? `${circleName} (${text.titleCircle.toLowerCase()})` : text.titleCircle, lines: [fill(text.circleBody1, { x: f(prim.cx), y: f(prim.cy) }), fill(text.circleBody2, { r: f(prim.r) })] });
    } else {
      const arcName = named(prim);
      steps.push({ n, prim, title: arcName ? `${arcName} (${text.titleArc.toLowerCase()})` : text.titleArc, lines: [fill(text.arcBody1, { cx: f(prim.cx), cy: f(prim.cy), r: f(prim.r) }), fill(text.arcBody2, { x1: f(prim.x1), y1: f(prim.y1), x2: f(prim.x2), y2: f(prim.y2) })] });
    }
  }
  for (const x of netPositions) {
    steps.push({ n: steps.length + 1, title: text.titleNet, lines: [fill(text.netBody, { x: f(x), xb: f(L - x) })] });
  }
  return steps;
}

/** Positions of the nets (the dashed lines), from end A. */
export const netPositions = (variant: Variant): number[] => parsePaths(variant.dashed ?? []).filter((p): p is Extract<Prim, { kind: 'line' }> => p.kind === 'line' && near(p.x1, p.x2)).map((p) => p.x1);

