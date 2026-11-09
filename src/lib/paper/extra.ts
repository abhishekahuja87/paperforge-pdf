/** Sheet styles and overlays added after the first release: hexagons, calligraphy, cross-stitch, storyboard, punch-hole guides, stamp. */
import type { Item, Rect } from './geometry';
import { STORY_RATIOS, type PaperSettings } from './types';
import { clipSegment, fit, r3 } from './util';

const TEXT = '#555555';
const ACCENT = '#d98f8f';

/** Hexagon grid. Built as pointy-top rows, then turned on its side for flat-top. Only whole hexagons are drawn. */
export function hexGrid(area: Rect, s: PaperSettings['hex'], weight: number, color: string): Item[] {
  const swap = s.orientation === 'flat';
  const W = swap ? area.h : area.w;
  const H = swap ? area.w : area.h;
  const R = s.radius;
  const w = Math.sqrt(3) * R;
  const cols = Math.max(1, Math.floor((W - w / 2) / w + 1e-6));
  const rows = Math.max(1, Math.floor((H - R / 2) / (1.5 * R) + 1e-6));
  const totalW = cols * w + (rows > 1 ? w / 2 : 0);
  const totalH = R * (1.5 * rows + 0.5);
  const ox = (W - totalW) / 2;
  const oy = (H - totalH) / 2 + R;
  const map = (u: number, v: number): [number, number] => (swap ? [r3(area.x + v), r3(area.y + u)] : [r3(area.x + u), r3(area.y + v)]);
  const items: Item[] = [];
  const seen = new Set<string>();
  const seg = (a: [number, number], b: [number, number]) => {
    const [x1, y1] = map(a[0], a[1]);
    const [x2, y2] = map(b[0], b[1]);
    const key = x1 < x2 || (x1 === x2 && y1 <= y2) ? `${Math.round(x1 * 50)},${Math.round(y1 * 50)},${Math.round(x2 * 50)},${Math.round(y2 * 50)}` : `${Math.round(x2 * 50)},${Math.round(y2 * 50)},${Math.round(x1 * 50)},${Math.round(y1 * 50)}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ t: 'line', x1, y1, x2, y2, w: weight, c: color });
  };
  for (let r = 0; r < rows; r += 1) {
    const shift = r % 2 === 1 ? w / 2 : 0;
    const cy = oy + r * 1.5 * R;
    for (let c = 0; c < cols; c += 1) {
      const cx = ox + shift + c * w + w / 2;
      const p: [number, number][] = [[cx, cy - R], [cx + w / 2, cy - R / 2], [cx + w / 2, cy + R / 2], [cx, cy + R], [cx - w / 2, cy + R / 2], [cx - w / 2, cy - R / 2]];
      for (let k = 0; k < 6; k += 1) seg(p[k], p[(k + 1) % 6]);
      if (s.centers) { const [dx, dy] = map(cx, cy); items.push({ t: 'dot', x: dx, y: dy, r: 0.25, c: color }); }
    }
  }
  return items;
}

/** Calligraphy sheet: baseline, waist, ascender and descender lines in repeating groups, with slant guides across them. */
export function calligraphy(area: Rect, s: PaperSettings['calligraphy'], weight: number, color: string): Item[] {
  const items: Item[] = [];
  const xh = s.xHeight;
  const groupH = (s.ascender + 1 + s.descender) * xh;
  const count = Math.max(1, Math.floor((area.h + s.gap) / (groupH + s.gap) + 1e-6));
  const right = area.x + area.w;
  const hline = (y: number, w: number, dash?: [number, number]) => items.push({ t: 'line', x1: r3(area.x), y1: r3(y), x2: r3(right), y2: r3(y), w, c: color, ...(dash ? { dash } : {}) });
  for (let g = 0; g < count; g += 1) {
    const top = area.y + g * (groupH + s.gap);
    const waist = top + s.ascender * xh;
    const baseline = waist + xh;
    hline(top, weight * 0.7, [1.2, 1]);
    hline(waist, weight);
    hline(baseline, weight * 1.4);
    hline(baseline + s.descender * xh, weight * 0.7, [1.2, 1]);
  }
  if (s.slantLines && s.slantSpacing > 0) {
    const lastBottom = area.y + (count - 1) * (groupH + s.gap) + groupH;
    const box: Rect = { x: area.x, y: area.y, w: area.w, h: lastBottom - area.y };
    const rise = box.h / Math.tan((Math.max(1, Math.min(89, s.slant)) * Math.PI) / 180);
    for (let x = area.x - rise; x <= right + 1e-6; x += s.slantSpacing) {
      const clipped = clipSegment(x, box.y + box.h, x + rise, box.y, box);
      if (clipped) items.push({ t: 'line', x1: clipped[0], y1: clipped[1], x2: clipped[2], y2: clipped[3], w: weight * 0.6, c: color });
    }
  }
  return items;
}

/** Cross-stitch chart: one square per stitch, a darker line every 10, and dashed centre lines to start from the middle. */
export function crossStitch(area: Rect, s: PaperSettings['crossstitch'], weight: number, color: string): Item[] {
  const cell = 25.4 / s.count;
  const cols = fit(area.w, cell);
  const rows = fit(area.h, cell);
  const x0 = area.x + cols.offset;
  const y0 = area.y + rows.offset;
  const x1 = x0 + cols.count * cell;
  const y1 = y0 + rows.count * cell;
  const items: Item[] = [];
  const dark = (i: number) => s.major && i % 10 === 0;
  for (let i = 0; i <= cols.count; i += 1) { const x = r3(x0 + i * cell); items.push({ t: 'line', x1: x, y1: r3(y0), x2: x, y2: r3(y1), w: dark(i) ? weight * 2.2 : weight * 0.7, c: color }); }
  for (let j = 0; j <= rows.count; j += 1) { const y = r3(y0 + j * cell); items.push({ t: 'line', x1: r3(x0), y1: y, x2: r3(x1), y2: y, w: dark(j) ? weight * 2.2 : weight * 0.7, c: color }); }
  if (s.centerLines) {
    const cx = r3(x0 + (cols.count / 2) * cell);
    const cy = r3(y0 + (rows.count / 2) * cell);
    items.push({ t: 'line', x1: cx, y1: r3(y0 - 2), x2: cx, y2: r3(y1 + 2), w: weight * 1.4, c: ACCENT, dash: [1.5, 1] });
    items.push({ t: 'line', x1: r3(x0 - 2), y1: cy, x2: r3(x1 + 2), y2: cy, w: weight * 1.4, c: ACCENT, dash: [1.5, 1] });
  }
  return items;
}

/** Storyboard: a grid of panels in a fixed aspect ratio, each with numbered corner and memo lines underneath. */
export function storyboard(area: Rect, s: PaperSettings['storyboard'], weight: number, color: string): Item[] {
  const items: Item[] = [];
  const ratio = STORY_RATIOS[s.ratio];
  const memoH = s.memo * 5.5;
  const cellW = (area.w - (s.cols - 1) * s.gutter) / s.cols;
  const cellH = (area.h - (s.rows - 1) * s.gutter) / s.rows;
  const panelW = Math.max(5, Math.min(cellW, (cellH - memoH - (s.memo ? 2 : 0)) * ratio));
  const panelH = panelW / ratio;
  const blockH = panelH + (s.memo ? 2 + memoH : 0);
  const gridW = s.cols * panelW + (s.cols - 1) * s.gutter;
  const gridH = s.rows * blockH + (s.rows - 1) * s.gutter;
  const ox = area.x + (area.w - gridW) / 2;
  const oy = area.y + (area.h - gridH) / 2;
  let n = 1;
  for (let r = 0; r < s.rows; r += 1) {
    for (let c = 0; c < s.cols; c += 1) {
      const x = ox + c * (panelW + s.gutter);
      const y = oy + r * (blockH + s.gutter);
      const edge = (x1: number, y1: number, x2: number, y2: number) => items.push({ t: 'line', x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), w: weight * 2, c: color });
      edge(x, y, x + panelW, y); edge(x + panelW, y, x + panelW, y + panelH); edge(x + panelW, y + panelH, x, y + panelH); edge(x, y + panelH, x, y);
      if (s.numbers) items.push({ t: 'text', x: r3(x + 1.2), y: r3(y + 3.6), size: 7, text: String(n), c: TEXT, bold: true });
      for (let m = 1; m <= s.memo; m += 1) {
        const ly = y + panelH + 2 + m * 5.5;
        items.push({ t: 'line', x1: r3(x), y1: r3(ly), x2: r3(x + panelW), y2: r3(ly), w: weight, c: color });
      }
      n += 1;
    }
  }
  return items;
}

/** Punch-hole guide rings along the binding edge. Standard centres: 2-hole 80 mm, 3-hole US 108 mm, 4-hole 80 mm. */
export function holeGuides(width: number, height: number, mode: PaperSettings['holes'], landscape: boolean, atStart: boolean): Item[] {
  if (mode === 'none') return [];
  const offsets: Record<string, number[]> = { '2': [-40, 40], '3': [-108, 0, 108], '4': [-120, -40, 40, 120] };
  const along = landscape ? width : height;
  const edge = landscape ? height : width;
  const inset = 12;
  const fixedPos = atStart ? inset : edge - inset;
  const items: Item[] = [];
  for (const o of offsets[mode]) {
    const p = along / 2 + o;
    if (p < 8 || p > along - 8) continue;
    const x = landscape ? p : fixedPos;
    const y = landscape ? fixedPos : p;
    items.push({ t: 'ring', x: r3(x), y: r3(y), r: 3, w: 0.2, c: '#999999' });
    items.push({ t: 'line', x1: r3(x - 4.5), y1: r3(y), x2: r3(x + 4.5), y2: r3(y), w: 0.15, c: '#999999' });
    items.push({ t: 'line', x1: r3(x), y1: r3(y - 4.5), x2: r3(x), y2: r3(y + 4.5), w: 0.15, c: '#999999' });
  }
  return items;
}

/** A short label in one corner of the page. */
export function stampItem(width: number, height: number, stamp: PaperSettings['stamp']): Item[] {
  const text = stamp.text.trim().slice(0, 40);
  if (!text) return [];
  const left = stamp.corner === 'tl' || stamp.corner === 'bl';
  const top = stamp.corner === 'tl' || stamp.corner === 'tr';
  return [{ t: 'text', x: r3(left ? 6 : width - 6), y: r3(top ? 8 : height - 5), size: 7, text, c: TEXT, anchor: left ? 'start' : 'end' }];
}

/** Places two copies of an A5 portrait sheet side by side on an A4 landscape sheet with a dashed cut line. */
export function twoUpItems(items: Item[], pageWidth: number, sheetWidth: number, sheetHeight: number): Item[] {
  const gap = (sheetWidth - pageWidth * 2) / 2;
  const shift = (list: Item[], dx: number): Item[] => list.map((item) => {
    if (item.t === 'line') return { ...item, x1: r3(item.x1 + dx), x2: r3(item.x2 + dx) };
    return { ...item, x: r3(item.x + dx) };
  });
  const cut: Item = { t: 'line', x1: r3(sheetWidth / 2), y1: 0, x2: r3(sheetWidth / 2), y2: sheetHeight, w: 0.2, c: '#999999', dash: [2, 2] };
  return [...shift(items, gap), ...shift(items, gap + pageWidth), cut];
}
