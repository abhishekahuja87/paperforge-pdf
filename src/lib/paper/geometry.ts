import { clipSegment, fit, r3, type Box } from './util';
import { calligraphy, crossStitch, hexGrid, holeGuides, stampItem, storyboard, twoUpItems } from './extra';
import { BINDING_MM, DOT_RADIUS, HEADER_LABELS, PAGE_SIZES, TONES, WEIGHTS, canTwoUp, type HeaderField, type PaperSettings } from './types';

/** Everything on a sheet is a handful of simple shapes in millimetres, origin top-left. The SVG preview and the PDF export both draw this list. */
export type Item =
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; w: number; c: string; dash?: [number, number] }
  | { t: 'dot'; x: number; y: number; r: number; c: string }
  | { t: 'ring'; x: number; y: number; r: number; w: number; c: string }
  | { t: 'text'; x: number; y: number; size: number; text: string; c: string; bold?: boolean; anchor?: 'start' | 'middle' | 'end' };

export type Rect = Box;

export { clipSegment };

export interface Sheet {
  width: number;
  height: number;
  /** The area inside the margins where anything is drawn. */
  area: Rect;
  /** Items that are the same on every page. */
  fixed: Item[];
  /** Where "Page n" is printed, or null when the page number is off. */
  pageNumber: { x: number; y: number; size: number; anchor: 'start' | 'middle' | 'end'; c: string } | null;
}

export type Side = 'front' | 'back';

const TEXT = '#555555';
const ACCENT = '#d98f8f';

export function pageSize(settings: PaperSettings): { width: number; height: number } {
  const { width, height } = PAGE_SIZES[settings.page];
  return settings.landscape ? { width: height, height: width } : { width, height };
}

/** The printable area: the margins, plus extra room on the binding edge when it is switched on. */
export function printableArea(settings: PaperSettings, side: Side): Rect {
  const { width, height } = pageSize(settings);
  const { top, bottom, left, right } = settings.margins;
  let [t, b, l, r] = [top, bottom, left, right];
  if (settings.binding) {
    const atStart = side === 'front' || !settings.bindingAlternate;
    if (settings.landscape) { if (atStart) t += BINDING_MM; else b += BINDING_MM; }
    else if (atStart) l += BINDING_MM; else r += BINDING_MM;
  }
  return { x: l, y: t, w: Math.max(10, width - l - r), h: Math.max(10, height - t - b) };
}

function dotGrid(area: Rect, step: number, radius: number, color: string): Item[] {
  const cols = fit(area.w, step);
  const rows = fit(area.h, step);
  const items: Item[] = [];
  for (let j = 0; j <= rows.count; j += 1) {
    for (let i = 0; i <= cols.count; i += 1) {
      items.push({ t: 'dot', x: r3(area.x + cols.offset + i * step), y: r3(area.y + rows.offset + j * step), r: radius, c: color });
    }
  }
  return items;
}

function squareGrid(area: Rect, step: number, weight: number, color: string, major: number, axes: boolean): Item[] {
  const cols = fit(area.w, step);
  const rows = fit(area.h, step);
  const x0 = area.x + cols.offset;
  const y0 = area.y + rows.offset;
  const x1 = x0 + cols.count * step;
  const y1 = y0 + rows.count * step;
  const items: Item[] = [];
  const thick = (index: number) => major > 0 && index % major === 0;
  for (let i = 0; i <= cols.count; i += 1) {
    const x = r3(x0 + i * step);
    items.push({ t: 'line', x1: x, y1: r3(y0), x2: x, y2: r3(y1), w: thick(i) ? weight * 1.9 : weight, c: color });
  }
  for (let j = 0; j <= rows.count; j += 1) {
    const y = r3(y0 + j * step);
    items.push({ t: 'line', x1: r3(x0), y1: y, x2: r3(x1), y2: y, w: thick(j) ? weight * 1.9 : weight, c: color });
  }
  if (axes) {
    const cx = r3(x0 + Math.round(cols.count / 2) * step);
    const cy = r3(y0 + Math.round(rows.count / 2) * step);
    items.push({ t: 'line', x1: cx, y1: r3(y0), x2: cx, y2: r3(y1), w: weight * 3, c: '#333333' });
    items.push({ t: 'line', x1: r3(x0), y1: cy, x2: r3(x1), y2: cy, w: weight * 3, c: '#333333' });
  }
  return items;
}

function ruledLines(area: Rect, step: number, weight: number, color: string, marginLine: boolean, midline: boolean, startX = area.x): Item[] {
  const items: Item[] = [];
  const left = startX;
  const right = area.x + area.w;
  for (let y = area.y + step; y <= area.y + area.h + 1e-6; y += step) {
    items.push({ t: 'line', x1: r3(left), y1: r3(y), x2: r3(right), y2: r3(y), w: weight, c: color });
    if (midline && y - step / 2 > area.y) items.push({ t: 'line', x1: r3(left), y1: r3(y - step / 2), x2: r3(right), y2: r3(y - step / 2), w: weight * 0.7, c: color, dash: [0.8, 0.8] });
  }
  if (marginLine) {
    const mx = r3(Math.min(area.x + area.w * 0.8, area.x + 22));
    items.push({ t: 'line', x1: mx, y1: r3(area.y), x2: mx, y2: r3(area.y + area.h), w: weight * 1.3, c: ACCENT });
  }
  return items;
}

/** Triangular lattice. Built with horizontal rows, then turned on its side for the vertical-axis layout. */
function isometric(area: Rect, pitch: number, mode: 'dots' | 'lines', axis: 'vertical' | 'horizontal', weight: number, color: string, radius: number): Item[] {
  const swap = axis === 'vertical';
  const W = swap ? area.h : area.w;
  const H = swap ? area.w : area.h;
  const rowH = pitch * Math.sin(Math.PI / 3);
  const map = (u: number, v: number): [number, number] => (swap ? [r3(area.x + v), r3(area.y + u)] : [r3(area.x + u), r3(area.y + v)]);
  const items: Item[] = [];
  if (mode === 'dots') {
    for (let j = 0; j * rowH <= H + 1e-6; j += 1) {
      const shift = j % 2 === 0 ? 0 : pitch / 2;
      for (let u = shift; u <= W + 1e-6; u += pitch) {
        const [x, y] = map(u, j * rowH);
        items.push({ t: 'dot', x, y, r: radius, c: color });
      }
    }
    return items;
  }
  const box: Rect = { x: 0, y: 0, w: W, h: H };
  const push = (a: [number, number], b: [number, number]) => {
    const clipped = clipSegment(a[0], a[1], b[0], b[1], box);
    if (!clipped) return;
    const [x1, y1] = map(clipped[0], clipped[1]);
    const [x2, y2] = map(clipped[2], clipped[3]);
    items.push({ t: 'line', x1, y1, x2, y2, w: weight, c: color });
  };
  for (let j = 0; j * rowH <= H + 1e-6; j += 1) push([0, j * rowH], [W, j * rowH]);
  const reach = H / Math.tan(Math.PI / 3);
  for (let u = -reach; u <= W + 1e-6; u += pitch) push([u, 0], [u + reach, H]);
  for (let u = 0; u <= W + reach + 1e-6; u += pitch) push([u, 0], [u - reach, H]);
  return items;
}

function musicLines(area: Rect, mode: 'staff' | 'tab', space: number, gap: number, clefSpace: boolean, weight: number, color: string): Item[] {
  const lines = mode === 'staff' ? 5 : 6;
  const step = mode === 'staff' ? space : space * 1.35;
  const height = (lines - 1) * step;
  const count = Math.max(1, Math.floor((area.h + gap) / (height + gap)));
  const items: Item[] = [];
  for (let s = 0; s < count; s += 1) {
    const top = area.y + s * (height + gap);
    for (let l = 0; l < lines; l += 1) {
      const y = r3(top + l * step);
      items.push({ t: 'line', x1: r3(area.x), y1: y, x2: r3(area.x + area.w), y2: y, w: weight, c: color });
    }
    items.push({ t: 'line', x1: r3(area.x), y1: r3(top), x2: r3(area.x), y2: r3(top + height), w: weight * 1.6, c: color });
    items.push({ t: 'line', x1: r3(area.x + area.w), y1: r3(top), x2: r3(area.x + area.w), y2: r3(top + height), w: weight * 1.6, c: color });
    if (mode === 'tab') {
      ['T', 'A', 'B'].forEach((letter, index) => items.push({ t: 'text', x: r3(area.x + 4), y: r3(top + height / 2 + (index - 1) * 3.4 + 1.2), size: 8, text: letter, c: color, bold: true, anchor: 'middle' }));
    } else if (clefSpace) {
      items.push({ t: 'line', x1: r3(area.x + 14), y1: r3(top), x2: r3(area.x + 14), y2: r3(top + height), w: weight, c: color });
    }
  }
  return items;
}

function headerBar(area: Rect, fields: HeaderField[], color: string, weight: number): { items: Item[]; used: number; pageNumber: Sheet['pageNumber'] } {
  const items: Item[] = [];
  const written = fields.filter((field) => field !== 'page');
  const wantsPage = fields.includes('page');
  const baseline = area.y + 6;
  const pageW = wantsPage ? 24 : 0;
  const usable = area.w - pageW;
  const slot = written.length ? usable / written.length : 0;
  written.forEach((field, index) => {
    const label = HEADER_LABELS[field];
    const x = area.x + index * slot;
    const labelW = label.length * 1.7 + 2;
    items.push({ t: 'text', x: r3(x), y: baseline, size: 8, text: label, c: TEXT });
    items.push({ t: 'line', x1: r3(x + labelW), y1: r3(baseline + 0.8), x2: r3(x + slot - 4), y2: r3(baseline + 0.8), w: weight, c: color });
  });
  const pageNumber = wantsPage ? { x: r3(area.x + area.w), y: baseline, size: 9, anchor: 'end' as const, c: TEXT } : null;
  return { items, used: 11, pageNumber };
}

function cornell(area: Rect, settings: PaperSettings, weight: number, color: string): { items: Item[]; pageNumber: Sheet['pageNumber'] } {
  const items: Item[] = [];
  const { cuePercent, summaryMm, body } = settings.cornell;
  const line = (x1: number, y1: number, x2: number, y2: number, w = weight, c = color) => items.push({ t: 'line', x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), w, c });
  const label = (x: number, y: number, text: string) => items.push({ t: 'text', x: r3(x), y: r3(y), size: 8, text, c: TEXT });
  const y1 = area.y + 6;
  const y2 = area.y + 14;
  const split = area.x + area.w * 0.64;
  label(area.x, y1, 'Topic');
  line(area.x + 11, y1 + 0.8, split - 4, y1 + 0.8);
  label(split, y1, 'Date');
  line(split + 9, y1 + 0.8, area.x + area.w, y1 + 0.8);
  label(area.x, y2, 'Subject');
  line(area.x + 14, y2 + 0.8, split - 4, y2 + 0.8);
  const wantsPage = settings.headerFields.includes('page');
  const pageNumber = wantsPage ? { x: r3(area.x + area.w), y: y2, size: 9, anchor: 'end' as const, c: TEXT } : null;
  const mainTop = area.y + 19;
  const mainBottom = area.y + area.h - summaryMm;
  const cueX = area.x + area.w * (cuePercent / 100);
  line(area.x, mainTop, area.x + area.w, mainTop, weight * 2, color);
  line(cueX, mainTop, cueX, mainBottom, weight * 2, color);
  line(area.x, mainBottom, area.x + area.w, mainBottom, weight * 2, color);
  label(area.x + 1, mainTop + 4.5, 'Cues and questions');
  label(cueX + 2, mainTop + 4.5, 'Notes');
  label(area.x + 1, mainBottom + 5, 'Summary');
  const notes: Rect = { x: cueX, y: mainTop + 6, w: area.x + area.w - cueX, h: Math.max(0, mainBottom - mainTop - 6) };
  if (notes.h > 8) {
    if (body === 'lined') items.push(...ruledLines(notes, 8, weight, color, false, false, notes.x + 1.5));
    if (body === 'dot') items.push(...dotGrid({ x: notes.x + 1.5, y: notes.y, w: notes.w - 3, h: notes.h }, 5, 0.2, color));
  }
  return { items, pageNumber };
}

function tracker(area: Rect, settings: PaperSettings, weight: number, color: string): Item[] {
  const items: Item[] = [];
  const { days, rows, habits } = settings.tracker;
  const names = habits.split('\n').map((line) => line.trim()).slice(0, 40);
  const line = (x1: number, y1: number, x2: number, y2: number, w = weight, c = color) => items.push({ t: 'line', x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), w, c });
  items.push({ t: 'text', x: r3(area.x), y: r3(area.y + 5), size: 9, text: 'Month', c: TEXT, bold: true });
  line(area.x + 14, area.y + 5.8, area.x + area.w * 0.45, area.y + 5.8);
  items.push({ t: 'text', x: r3(area.x + area.w * 0.5), y: r3(area.y + 5), size: 9, text: 'Year', c: TEXT, bold: true });
  line(area.x + area.w * 0.5 + 10, area.y + 5.8, area.x + area.w * 0.75, area.y + 5.8);
  const nameW = Math.min(46, area.w * 0.28);
  const headH = 6;
  const top = area.y + 11;
  const available = area.h - 11 - headH;
  const rowH = Math.min(10, Math.max(5, available / Math.max(1, rows)));
  const fitRows = Math.max(1, Math.min(rows, Math.floor(available / rowH + 1e-6)));
  const cellW = (area.w - nameW) / days;
  const gridTop = top + headH;
  const bottom = gridTop + fitRows * rowH;
  const gridLeft = area.x + nameW;
  for (let d = 0; d < days; d += 1) {
    items.push({ t: 'text', x: r3(gridLeft + d * cellW + cellW / 2), y: r3(top + 4.3), size: cellW < 5 ? 5.5 : 7, text: String(d + 1), c: TEXT, anchor: 'middle' });
  }
  items.push({ t: 'text', x: r3(area.x + 1), y: r3(top + 4.3), size: 8, text: 'Habit or task', c: TEXT, bold: true });
  line(area.x, top, area.x + area.w, top, weight * 1.6);
  line(area.x, gridTop, area.x + area.w, gridTop, weight * 1.6);
  for (let r = 1; r <= fitRows; r += 1) line(area.x, gridTop + r * rowH, area.x + area.w, gridTop + r * rowH);
  line(area.x, top, area.x, bottom, weight * 1.6);
  line(gridLeft, top, gridLeft, bottom, weight * 1.6);
  line(area.x + area.w, top, area.x + area.w, bottom, weight * 1.6);
  for (let d = 1; d < days; d += 1) line(gridLeft + d * cellW, top, gridLeft + d * cellW, bottom, weight * 0.6);
  const radius = Math.min(cellW, rowH) * 0.3;
  for (let r = 0; r < fitRows; r += 1) {
    const name = names[r];
    if (name) {
      const maxChars = Math.floor((nameW - 2) / 1.9);
      items.push({ t: 'text', x: r3(area.x + 1), y: r3(gridTop + r * rowH + rowH / 2 + 1.2), size: 8, text: name.length > maxChars ? `${name.slice(0, Math.max(1, maxChars - 1))}.` : name, c: TEXT });
    }
    for (let d = 0; d < days; d += 1) items.push({ t: 'ring', x: r3(gridLeft + d * cellW + cellW / 2), y: r3(gridTop + r * rowH + rowH / 2), r: r3(radius), w: weight, c: color });
  }
  return items;
}

function buildPage(settings: PaperSettings, side: Side): Sheet {
  const { width, height } = pageSize(settings);
  const full = printableArea(settings, side);
  const weight = WEIGHTS[settings.weight].mm;
  const color = TONES[settings.tone].color;
  const fixed: Item[] = [];
  let pageNumber: Sheet['pageNumber'] = null;
  let area = full;

  if (settings.style === 'cornell') {
    const result = cornell(full, settings, weight, color);
    fixed.push(...result.items);
    pageNumber = result.pageNumber;
    return { width, height, area, fixed, pageNumber };
  }
  if (settings.header && settings.style !== 'tracker') {
    const bar = headerBar(full, settings.headerFields, color, weight);
    fixed.push(...bar.items);
    pageNumber = bar.pageNumber;
    area = { x: full.x, y: full.y + bar.used, w: full.w, h: Math.max(10, full.h - bar.used) };
  }
  switch (settings.style) {
    case 'dot': fixed.push(...dotGrid(area, settings.dot.spacing, DOT_RADIUS[settings.dot.size], color)); break;
    case 'graph': fixed.push(...squareGrid(area, settings.graph.size, weight, color, settings.graph.major, settings.graph.axes)); break;
    case 'lined': fixed.push(...ruledLines(area, settings.lined.spacing, weight, color, settings.lined.marginLine, settings.lined.midline)); break;
    case 'isometric': fixed.push(...isometric(area, settings.isometric.pitch, settings.isometric.mode, settings.isometric.axis, weight, color, DOT_RADIUS.medium)); break;
    case 'music': fixed.push(...musicLines(area, settings.music.mode, settings.music.space, settings.music.gap, settings.music.clefSpace, weight, color)); break;
    case 'hex': fixed.push(...hexGrid(area, settings.hex, weight, color)); break;
    case 'calligraphy': fixed.push(...calligraphy(area, settings.calligraphy, weight, color)); break;
    case 'crossstitch': fixed.push(...crossStitch(area, settings.crossstitch, weight, color)); break;
    case 'storyboard': fixed.push(...storyboard(area, settings.storyboard, weight, color)); break;
    case 'tracker': {
      fixed.push(...tracker(full, settings, weight, color));
      if (settings.headerFields.includes('page')) pageNumber = { x: r3(full.x + full.w), y: r3(full.y + 5), size: 9, anchor: 'end', c: TEXT };
      break;
    }
    default: break;
  }
  return { width, height, area, fixed, pageNumber };
}

/** Builds the fixed shapes of one sheet, with the punch-hole guides and corner stamp. Page numbers are added per page by the caller. */
export function buildSheet(settings: PaperSettings, side: Side = 'front'): Sheet {
  // Hole guides sit 12 mm from the edge, so the pattern is moved clear of them even if the binding margin is off.
  const page = buildPage(settings.holes !== 'none' && !settings.binding ? { ...settings, binding: true } : settings, side);
  const atStart = side === 'front' || !settings.bindingAlternate;
  page.fixed.push(...holeGuides(page.width, page.height, settings.holes, settings.landscape, atStart), ...stampItem(page.width, page.height, settings.stamp));
  if (!settings.twoUp || !canTwoUp(settings)) return page;
  const width = PAGE_SIZES.a4.height;
  return { width, height: page.height, area: page.area, fixed: twoUpItems(page.fixed, page.width, width, page.height), pageNumber: null };
}

/** Whether back pages differ from front pages (only when the binding edge alternates). */
export const hasBackSide = (settings: PaperSettings) => settings.binding && settings.bindingAlternate && settings.pages > 1;
