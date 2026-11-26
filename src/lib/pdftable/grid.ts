/** Turning the positioned text of a PDF into rows and columns. Pure code, no browser needed. */
import type { PagePieces } from './read';

export type Cell = string | number;
export interface GridOptions { merge: boolean; dropHeaders: boolean; joinWrapped: boolean; numbers: boolean; skipIntro: boolean }
export interface Sheet { name: string; rows: Cell[][] }
export interface TableResult { sheets: Sheet[]; columns: number; rows: number; pages: number; foundColumns: boolean }

interface Part { x0: number; x1: number; text: string }
interface Line { y: number; h: number; parts: Part[] }

const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 10; };

/** Pieces on the same baseline make a line; pieces close together on a line make one cell. */
export function groupLines(pieces: PagePieces['pieces']): Line[] {
  if (!pieces.length) return [];
  const tol = median(pieces.map((p) => p.h)) * 0.45;
  const sorted = [...pieces].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: typeof pieces[] = [];
  let anchor = Number.POSITIVE_INFINITY;
  for (const piece of sorted) {
    if (rows.length && Math.abs(piece.y - anchor) <= tol) rows[rows.length - 1]!.push(piece);
    else { rows.push([piece]); anchor = piece.y; }
  }
  return rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    const parts: Part[] = [];
    for (const piece of row) {
      const last = parts[parts.length - 1], gap = last ? piece.x - last.x1 : 0;
      if (last && gap < piece.h * 0.8) { last.text += `${gap > piece.h * 0.1 ? ' ' : ''}${piece.text}`; last.x1 = Math.max(last.x1, piece.x + piece.w); }
      else parts.push({ x0: piece.x, x1: piece.x + piece.w, text: piece.text });
    }
    return { y: row.reduce((sum, p) => sum + p.y, 0) / row.length, h: Math.max(...row.map((p) => p.h)), parts };
  });
}

/** Column ranges: places on the page where many rows have text. A stray line cannot join two columns. */
export function findColumns(lines: Line[][], widths: number[]): [number, number][] {
  const many = lines.flatMap((page, index) => page.filter((line) => line.parts.length >= 2).map((line) => ({ line, width: widths[index]! })));
  if (many.length < 2) return [];
  const size = Math.ceil(Math.max(...widths)) + 2, coverage = new Array<number>(size).fill(0);
  for (const { line, width } of many) {
    const covered = new Set<number>();
    for (const part of line.parts) { if (part.x1 - part.x0 > width * 0.7) continue; for (let x = Math.max(0, Math.floor(part.x0)); x <= Math.min(size - 1, Math.ceil(part.x1)); x += 1) covered.add(x); }
    covered.forEach((x) => { coverage[x] = (coverage[x] ?? 0) + 1; });
  }
  const need = Math.max(2, Math.ceil(many.length * 0.2)), runs: [number, number][] = [];
  let start = -1;
  for (let x = 0; x <= size; x += 1) {
    if ((coverage[x] ?? 0) >= need) { if (start < 0) start = x; } else if (start >= 0) { runs.push([start, x - 1]); start = -1; }
  }
  const merged: [number, number][] = [];
  for (const run of runs) { const last = merged[merged.length - 1]; if (last && run[0] - last[1] < 4) last[1] = run[1]; else merged.push([run[0], run[1]]); }
  return merged;
}

/** Plain numbers only: 1,234.50 and 1,23,456 and (12.00) and -7. Leading zeros, phone numbers and long ids stay as text. */
export function asNumber(text: string): number | null {
  const bracket = /^\((.+)\)$/.exec(text), body = (bracket ? bracket[1]! : text).trim();
  if (!/^-?(\d{1,3}(,\d{2,3})+|\d+)(\.\d+)?$/.test(body)) return null;
  const digits = body.replace(/[-,.]/g, '');
  if (/^-?0\d/.test(body) || digits.length > 15) return null;
  const value = Number(body.replace(/,/g, ''));
  return Number.isFinite(value) ? (bracket ? -value : value) : null;
}

const columnOf = (part: Part, columns: [number, number][]): number => {
  let best = 0, bestOverlap = -1;
  columns.forEach(([a, b], n) => { const overlap = Math.min(b, part.x1) - Math.max(a, part.x0); if (overlap > bestOverlap) { bestOverlap = overlap; best = n; } });
  if (bestOverlap > 0) return best;
  const centre = (part.x0 + part.x1) / 2; let nearest = 0, distance = Number.POSITIVE_INFINITY;
  columns.forEach(([a, b], n) => { const d = Math.abs((a + b) / 2 - centre); if (d < distance) { distance = d; nearest = n; } });
  return nearest;
};

/** Rows and columns from the PDF text. */
export function buildTable(pages: PagePieces[], options: GridOptions): TableResult {
  const lines = pages.map((page) => groupLines(page.pieces)), columns = findColumns(lines, pages.map((p) => p.width));
  const foundColumns = columns.length >= 2, count = foundColumns ? columns.length : 1;
  const perPage: string[][][] = [];
  lines.forEach((pageLines) => {
    const rows: string[][] = []; let previous: Line | null = null;
    for (const line of pageLines) {
      if (!foundColumns) { rows.push([line.parts.map((p) => p.text).join(' ')]); continue; }
      const single = line.parts.length === 1, part = line.parts[0]!;
      if (single && options.joinWrapped && previous && rows.length && previous.y - line.y < Math.max(previous.h, line.h) * 2.4) {
        const col = columnOf(part, columns), last = rows[rows.length - 1]!;
        if (col > 0 && last[col]) { last[col] = `${last[col]} ${part.text}`; previous = line; continue; }
      }
      const row = new Array<string>(count).fill('');
      if (single) row[0] = part.text;
      else for (const piece of line.parts) { const col = columnOf(piece, columns); row[col] = row[col] ? `${row[col]} ${piece.text}` : piece.text; }
      rows.push(row); previous = line;
    }
    perPage.push(rows);
  });
  const key = (row: string[]) => row.map((c) => c.trim().toLowerCase()).join('|');
  let header = '';
  const outRows = perPage.map((rows) => rows.filter((row) => {
    if (!options.dropHeaders || !foundColumns) return true;
    if (row.filter(Boolean).length < Math.max(2, Math.ceil(count * 0.6))) return true;
    if (!header) { header = key(row); return true; }
    return key(row) !== header;
  }));
  if (options.skipIntro && foundColumns && outRows[0]) {
    const need = Math.max(2, Math.ceil(count * 0.6)), at = outRows[0].findIndex((row) => row.filter(Boolean).length >= need);
    if (at > 0) outRows[0] = outRows[0].slice(at);
  }
  const used = new Array<boolean>(count).fill(false);
  outRows.forEach((rows) => rows.forEach((row) => row.forEach((cell, n) => { if (cell) used[n] = true; })));
  const keep = used.map((u, n) => (u ? n : -1)).filter((n) => n >= 0);
  const convert = (text: string): Cell => (options.numbers ? asNumber(text) ?? text : text);
  const shape = (rows: string[][]) => rows.filter((row) => row.some(Boolean)).map((row) => keep.map((n) => convert(row[n] ?? '')));
  const sheets: Sheet[] = options.merge
    ? [{ name: 'Table', rows: shape(outRows.flat()) }]
    : outRows.map((rows, n) => ({ name: `Page ${pages[n]!.page}`, rows: shape(rows) })).filter((sheet) => sheet.rows.length > 0);
  return { sheets, columns: keep.length, rows: sheets.reduce((sum, s) => sum + s.rows.length, 0), pages: pages.length, foundColumns };
}
