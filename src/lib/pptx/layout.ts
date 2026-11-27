/** Works out where everything goes on a slide, so the preview and the .pptx use the same positions and sizes. */
import { EMU_PT, SLIDE_H, SLIDE_W, type Slide, type Theme } from './model';

export interface TPara { text: string; size: number; bold?: boolean; color: string; bullet?: boolean; bulletColor?: string; align?: 'l' | 'ctr'; after?: number }
export type Shape =
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string }
  | { t: 'ellipse'; x: number; y: number; w: number; h: number; fill: string }
  | { t: 'text'; x: number; y: number; w: number; h: number; paras: TPara[]; anchor: 't' | 'ctr' | 'b'; title?: boolean }
  | { t: 'table'; x: number; y: number; w: number; cols: number[]; rowH: number; size: number; rows: { text: string; fill: string; color: string; bold?: boolean }[][]; line: string };
export interface Laid { bg: string; shapes: Shape[] }

const IN = 914400;
const M = Math.round(0.7 * IN);
const BODY_W = SLIDE_W - 2 * M;
const BODY_Y = Math.round(1.75 * IN);
const BODY_H = SLIDE_H - BODY_Y - Math.round(0.6 * IN);
const pt = (emu: number) => emu / EMU_PT;

/** Lines a text needs at a size in a box of this width in points. Average letter width is about half the size. */
const linesFor = (text: string, size: number, widthPt: number) => {
  const per = Math.max(4, Math.floor(widthPt / (size * 0.52)));
  return text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / per)), 0);
};
/** The largest size, from max down to min, at which the bullets fit in the box. */
function fitSize(items: string[], widthEmu: number, heightEmu: number, max: number, min: number, indentPt = 22): number {
  for (let s = max; s > min; s -= 2) {
    const after = s * 0.45;
    const h = items.reduce((n, t) => n + linesFor(t, s, pt(widthEmu) - indentPt) * s * 1.2 + after, 0);
    if (h <= pt(heightEmu)) return s;
  }
  return min;
}
const clip = (s: string) => s.trim();

const rect = (x: number, y: number, w: number, h: number, fill: string): Shape => ({ t: 'rect', x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), fill });
const dot = (x: number, y: number, d: number, fill: string): Shape => ({ t: 'ellipse', x: Math.round(x), y: Math.round(y), w: Math.round(d), h: Math.round(d), fill });

/** Decoration drawn behind the text on a content slide. */
function deco(t: Theme): Shape[] {
  if (t.deco === 'corner') return [dot(SLIDE_W - 0.95 * IN, SLIDE_H - 0.95 * IN, 1.6 * IN, t.accent2), dot(SLIDE_W - 1.7 * IN, SLIDE_H - 0.5 * IN, 0.7 * IN, t.accent)];
  if (t.deco === 'stripes') return [rect(0, SLIDE_H - 0.16 * IN, SLIDE_W, 0.16 * IN, t.accent), rect(0, SLIDE_H - 0.16 * IN, 2.2 * IN, 0.16 * IN, t.accent2)];
  if (t.deco === 'circles') return [dot(SLIDE_W - 1.1 * IN, -0.5 * IN, 1.6 * IN, t.accent2), dot(SLIDE_W - 0.45 * IN, 0.45 * IN, 0.7 * IN, t.accent)];
  return [];
}
/** Decoration on a title, section or closing slide, in the colours that show on its background. */
function heroDeco(t: Theme): Shape[] {
  const on = t.hero === 'solid' || t.hero === 'frame' ? t.accent2 : t.accent2;
  if (t.deco === 'corner') return [dot(SLIDE_W - 2.6 * IN, SLIDE_H - 2.6 * IN, 4 * IN, on), dot(SLIDE_W - 1.2 * IN, 0.4 * IN, 0.8 * IN, on)];
  if (t.deco === 'stripes') return [rect(0, SLIDE_H - 0.3 * IN, SLIDE_W, 0.3 * IN, on)];
  if (t.deco === 'circles') return [dot(SLIDE_W - 3 * IN, -1.2 * IN, 4 * IN, on), dot(-0.8 * IN, SLIDE_H - 1.6 * IN, 2.4 * IN, on)];
  return [];
}

function heading(slide: Slide, t: Theme): Shape[] {
  const len = slide.title.length;
  const size = len > 80 ? 24 : len > 50 ? 28 : 34;
  const title = (color: string, x = M, w = BODY_W): Shape => ({ t: 'text', x, y: Math.round(0.4 * IN), w, h: Math.round(1.2 * IN), anchor: 'ctr', title: true, paras: [{ text: clip(slide.title) || ' ', size, bold: true, color }] });
  if (t.head === 'band') return [...deco(t), rect(0, 0, SLIDE_W, 1.55 * IN, t.accent), rect(0, 1.55 * IN, SLIDE_W, 0.07 * IN, t.accent2), title(t.accentText)];
  if (t.head === 'line') return [...deco(t), title(t.accent), rect(M, 1.62 * IN, BODY_W, 0.03 * IN, t.line), rect(M, 1.6 * IN, 1.4 * IN, 0.07 * IN, t.accent2)];
  if (t.head === 'dot') return [...deco(t), dot(M, 0.78 * IN, 0.4 * IN, t.accent2), dot(M + 0.22 * IN, 0.92 * IN, 0.22 * IN, t.accent), title(t.text, M + 0.7 * IN, BODY_W - 0.7 * IN)];
  return [...deco(t), rect(0, 0.55 * IN, 0.22 * IN, 0.9 * IN, t.accent), title(t.text)];
}

function hero(slide: Slide, t: Theme, titleSize: number, align: 'l' | 'ctr'): Laid {
  const subs = (slide.sub ?? '').split('\n').map(clip).filter(Boolean);
  const len = slide.title.length;
  const size = len > 70 ? titleSize - 12 : len > 40 ? titleSize - 6 : titleSize;
  const onAccent = t.hero === 'solid';
  const split = t.hero === 'split' && align === 'l';
  const titleColor = onAccent ? t.accentText : t.accent, subColor = onAccent ? t.accentText : t.text, lineColor = onAccent ? t.accentText : t.accent2;
  const left = split ? Math.round(5.3 * IN) : M, width = split ? SLIDE_W - left - M : BODY_W;
  const shapes: Shape[] = [];
  if (t.hero === 'split') shapes.push(rect(0, 0, split ? 4.6 * IN : SLIDE_W, SLIDE_H, t.accent), rect(split ? 4.6 * IN : 0, 0, split ? 0.14 * IN : 0, SLIDE_H, t.accent2));
  if (t.hero === 'frame') shapes.push(rect(0.35 * IN, 0.35 * IN, SLIDE_W - 0.7 * IN, SLIDE_H - 0.7 * IN, t.bg), rect(0.35 * IN, 0.35 * IN, SLIDE_W - 0.7 * IN, 0.1 * IN, t.accent2));
  if (t.hero === 'light') shapes.push(rect(0, 0, 0.3 * IN, SLIDE_H, t.accent), rect(0.3 * IN, 0, 0.1 * IN, SLIDE_H, t.accent2));
  const decoShapes = t.hero === 'split' && !split ? [] : heroDeco(t);
  const body: Shape[] = [
    { t: 'text', x: left, y: Math.round(1.5 * IN), w: width, h: Math.round(2.4 * IN), anchor: 'b', title: true, paras: [{ text: clip(slide.title) || ' ', size, bold: true, color: titleColor, align }] },
    rect(align === 'ctr' ? (SLIDE_W - 1.6 * IN) / 2 : left, 4.05 * IN, 1.6 * IN, 0.06 * IN, lineColor),
  ];
  if (subs.length) body.push({ t: 'text', x: left, y: Math.round(4.3 * IN), w: width, h: Math.round(2 * IN), anchor: 't', paras: subs.map((s, i) => ({ text: s, size: i === 0 ? 22 : 16, color: subColor, align, after: 6 })) });
  const bg = onAccent || (t.hero === 'frame') ? t.accent : t.bg;
  return { bg, shapes: [...shapes, ...decoShapes, ...body] };
}

export function layout(slide: Slide, t: Theme): Laid {
  if (slide.kind === 'title') return hero(slide, t, 44, 'l');
  if (slide.kind === 'closing') return hero(slide, t, 44, 'ctr');
  if (slide.kind === 'section') return hero(slide, t, 40, 'l');
  if (slide.kind === 'big') {
    const subs = (slide.sub ?? '').split('\n').map(clip).filter(Boolean);
    const len = slide.title.length;
    const size = len > 120 ? 24 : len > 70 ? 30 : 38;
    const paras: TPara[] = [{ text: clip(slide.title) || ' ', size, bold: true, color: t.text, align: 'ctr', after: 14 }, ...subs.map((s) => ({ text: s, size: 18, color: t.muted, align: 'ctr' as const, after: 4 }))];
    return { bg: t.bg, shapes: [...deco(t), { t: 'rect', x: 0, y: 0, w: SLIDE_W, h: Math.round(0.18 * IN), fill: t.accent }, { t: 'text', x: Math.round(1.2 * IN), y: Math.round(1.2 * IN), w: SLIDE_W - Math.round(2.4 * IN), h: SLIDE_H - Math.round(2.4 * IN), anchor: 'ctr', title: true, paras }] };
  }
  const shapes = heading(slide, t);
  if (slide.kind === 'bullets') {
    const items = (slide.bullets ?? []).map(clip).filter(Boolean);
    const size = fitSize(items, BODY_W, BODY_H, 28, 14);
    shapes.push({ t: 'text', x: M, y: BODY_Y, w: BODY_W, h: BODY_H, anchor: 't', paras: items.map((x) => ({ text: x, size, color: t.text, bullet: true, bulletColor: t.accent, after: Math.round(size * 0.45) })) });
  } else if (slide.kind === 'two') {
    const cols = (slide.columns ?? []).slice(0, 2);
    const gap = Math.round(0.4 * IN), cw = Math.round((BODY_W - gap) / 2);
    const all = cols.flatMap((c) => c.bullets.map(clip).filter(Boolean));
    const size = fitSize(all, cw, BODY_H - Math.round(0.6 * IN), 24, 14);
    cols.forEach((c, i) => {
      const paras: TPara[] = [{ text: clip(c.head) || ' ', size: Math.min(28, size + 4), bold: true, color: t.accent, after: 10 }, ...c.bullets.map(clip).filter(Boolean).map((x) => ({ text: x, size, color: t.text, bullet: true, bulletColor: t.accent, after: Math.round(size * 0.45) }))];
      shapes.push({ t: 'text', x: M + i * (cw + gap), y: BODY_Y, w: cw, h: BODY_H, anchor: 't', paras });
    });
  } else if (slide.kind === 'table') {
    const rows = (slide.table ?? []).filter((r) => r.some((c) => c.trim()));
    const n = Math.max(1, ...rows.map((r) => r.length));
    const size = rows.length <= 6 && n <= 4 ? 18 : rows.length <= 9 ? 14 : 12;
    const weights = Array.from({ length: n }, (_, c) => Math.min(40, Math.max(6, ...rows.map((r) => (r[c] ?? '').length))));
    const sum = weights.reduce((a, b) => a + b, 0);
    const cols = weights.map((w) => Math.round((w / sum) * BODY_W));
    cols[cols.length - 1]! += BODY_W - cols.reduce((a, b) => a + b, 0);
    shapes.push({ t: 'table', x: M, y: BODY_Y, w: BODY_W, cols, rowH: Math.round(size * 2.1 * EMU_PT), size, line: t.line,
      rows: rows.map((r, ri) => Array.from({ length: n }, (_, c) => ri === 0 ? { text: clip(r[c] ?? ''), fill: t.accent, color: t.accentText, bold: true } : { text: clip(r[c] ?? ''), fill: ri % 2 === 0 ? t.panel : t.bg, color: t.text })) });
  }
  return { bg: t.bg, shapes };
}
