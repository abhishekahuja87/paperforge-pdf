/** Reading a list from pasted text, a CSV file or an Excel (.xlsx) file, entirely in the browser. */

export interface TableInfo {
  source: 'paste' | 'csv' | 'xlsx';
  fileName: string;
  sheetName: string;
  sheetNames: string[];
  delimiter: string;
  encoding: string;
  /** Rows with nothing in them that were left out. */
  blankRowsSkipped: number;
  mergedCells: number;
  hiddenRows: number;
  hiddenSheets: number;
  /** Formula cells that had no saved result, so they were read as empty. */
  formulasWithoutValue: number;
  errorCells: number;
  datesRead: number;
  /** True when the list was cut at the row limit. */
  truncated: boolean;
}
export interface RawTable { rows: string[][]; info: TableInfo }
export type ReadError = 'tooBig' | 'oldXls' | 'notXlsx' | 'empty' | 'unreadable';
export class TableReadError extends Error {
  code: ReadError;
  constructor(code: ReadError) { super(code); this.code = code; }
}

export const MAX_ROWS = 5000, MAX_COLUMNS = 60, MAX_BYTES = 10 * 1024 * 1024;
const emptyInfo = (source: TableInfo['source'], fileName = ''): TableInfo => ({ source, fileName, sheetName: '', sheetNames: [], delimiter: '', encoding: 'UTF-8', blankRowsSkipped: 0, mergedCells: 0, hiddenRows: 0, hiddenSheets: 0, formulasWithoutValue: 0, errorCells: 0, datesRead: 0, truncated: false });

/** Splits text into rows and cells. Handles quotes, doubled quotes and line breaks inside quotes. */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false; } else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i += 1; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

/** The separator that splits the first lines into the same number of cells most consistently. */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '').slice(0, 8);
  let best = ',', bestScore = 0;
  for (const d of ['\t', ',', ';', '|']) {
    const counts = lines.map((l) => parseDelimited(l, d)[0]!.length);
    const first = counts[0] ?? 1; if (first < 2) continue;
    const same = counts.filter((c) => c === first).length, score = same * 100 + first;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

/** Text from bytes: UTF-8 (with or without a BOM), UTF-16, or the older Windows encoding Excel uses for CSV. */
export function decodeBytes(bytes: Uint8Array): { text: string; encoding: string } {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { text: new TextDecoder('utf-16le').decode(bytes.subarray(2)), encoding: 'UTF-16' };
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return { text: new TextDecoder('utf-16be').decode(bytes.subarray(2)), encoding: 'UTF-16' };
  const body = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
  try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(body), encoding: 'UTF-8' }; } catch { return { text: new TextDecoder('windows-1252').decode(body), encoding: 'Windows-1252' }; }
}

const clean = (cell: string) => cell.replace(/ /g, ' ').trim();
function finish(rows: string[][], info: TableInfo): RawTable {
  const kept: string[][] = []; let blank = 0;
  for (const row of rows) { const cells = row.slice(0, MAX_COLUMNS).map(clean); if (cells.every((c) => c === '')) blank += 1; else kept.push(cells); }
  if (kept.length === 0) throw new TableReadError('empty');
  if (kept.length > MAX_ROWS + 1) { info.truncated = true; kept.length = MAX_ROWS + 1; }
  return { rows: kept, info: { ...info, blankRowsSkipped: blank } };
}

/** A list from text, such as cells copied from Excel (tab separated) or the inside of a CSV file. */
export function readText(text: string, source: 'paste' | 'csv' = 'paste', fileName = '', encoding = 'UTF-8'): RawTable {
  const delimiter = detectDelimiter(text), info = emptyInfo(source, fileName); info.delimiter = delimiter; info.encoding = encoding;
  return finish(parseDelimited(text.replace(/^﻿/, ''), delimiter), info);
}

// ---- Excel (.xlsx) ----
const BUILTIN_DATE = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
const isDateFormat = (code: string) => /[dmyhs]/i.test(code.replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '').replace(/\\./g, '').replace(/General/gi, ''));
const parseXml = (text: string) => new DOMParser().parseFromString(text, 'application/xml');
const byTag = (root: Element | Document, name: string): Element[] => Array.from(root.getElementsByTagName(name));
const columnIndex = (ref: string) => { let n = 0; for (const ch of ref.replace(/[^A-Z]/gi, '').toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

function dateText(serial: number, base1904: boolean): string {
  const ms = Math.round((serial - (base1904 ? 24107 : 25569)) * 86400 * 1000), d = new Date(ms), p = (n: number) => String(n).padStart(2, '0');
  const date = `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`, hasTime = Math.abs(serial - Math.floor(serial)) > 1e-6;
  return hasTime ? `${date} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` : date;
}
const numberText = (raw: string) => { const n = Number(raw); return Number.isFinite(n) ? String(parseFloat(n.toPrecision(12))) : raw; };

/** One sheet of an .xlsx file. `sheetIndex` counts visible and hidden sheets in file order. */
export async function readXlsx(buffer: ArrayBuffer, sheetIndex = 0, fileName = ''): Promise<RawTable> {
  const { default: JSZip } = await import('jszip');
  let zip: import('jszip');
  try { zip = await JSZip.loadAsync(buffer); } catch { throw new TableReadError('notXlsx'); }
  const read = async (path: string) => { const file = zip.file(path); return file ? file.async('string') : ''; };
  const workbookText = await read('xl/workbook.xml'); if (!workbookText) throw new TableReadError('notXlsx');
  const workbook = parseXml(workbookText), rels = parseXml(await read('xl/_rels/workbook.xml.rels'));
  const targets = new Map<string, string>(); byTag(rels, 'Relationship').forEach((r) => targets.set(r.getAttribute('Id') ?? '', r.getAttribute('Target') ?? ''));
  const sheets = byTag(workbook, 'sheet').map((s) => ({ name: s.getAttribute('name') ?? 'Sheet', hidden: (s.getAttribute('state') ?? 'visible') !== 'visible', target: targets.get(s.getAttribute('r:id') ?? '') ?? '' }));
  if (sheets.length === 0) throw new TableReadError('notXlsx');
  const base1904 = byTag(workbook, 'workbookPr')[0]?.getAttribute('date1904') === '1';
  const chosen = sheets[Math.min(Math.max(sheetIndex, 0), sheets.length - 1)]!;
  const sheetPath = chosen.target.startsWith('/') ? chosen.target.slice(1) : `xl/${chosen.target.replace(/^\.?\//, '')}`;
  const sheetText = await read(sheetPath); if (!sheetText) throw new TableReadError('unreadable');

  const shared: string[] = [];
  const sharedText = await read('xl/sharedStrings.xml');
  if (sharedText) byTag(parseXml(sharedText), 'si').forEach((si) => shared.push(byTag(si, 't').filter((t) => t.parentElement?.tagName !== 'rPh').map((t) => t.textContent ?? '').join('')));
  const dateStyles = new Set<number>();
  const stylesText = await read('xl/styles.xml');
  if (stylesText) {
    const styles = parseXml(stylesText), custom = new Map<number, string>();
    byTag(styles, 'numFmt').forEach((n) => custom.set(Number(n.getAttribute('numFmtId')), n.getAttribute('formatCode') ?? ''));
    const cellXfs = byTag(styles, 'cellXfs')[0];
    if (cellXfs) Array.from(cellXfs.children).forEach((xf, i) => { const id = Number(xf.getAttribute('numFmtId') ?? 0); if (BUILTIN_DATE.has(id) || (custom.has(id) && isDateFormat(custom.get(id)!))) dateStyles.add(i); });
  }

  const info = emptyInfo('xlsx', fileName); info.sheetName = chosen.name; info.sheetNames = sheets.map((s) => s.name); info.hiddenSheets = sheets.filter((s) => s.hidden).length;
  const doc = parseXml(sheetText); info.mergedCells = byTag(doc, 'mergeCell').length;
  const rows: string[][] = [];
  for (const rowEl of byTag(doc, 'row')) {
    const rowNumber = Number(rowEl.getAttribute('r') ?? rows.length + 1) - 1; if (rowNumber >= MAX_ROWS + 50) break;
    if (['1', 'true'].includes(rowEl.getAttribute('hidden') ?? '')) info.hiddenRows += 1;
    const cells: string[] = [];
    for (const c of Array.from(rowEl.children).filter((e) => e.tagName === 'c')) {
      const col = columnIndex(c.getAttribute('r') ?? ''); if (col < 0 || col >= MAX_COLUMNS) continue;
      const type = c.getAttribute('t') ?? 'n', v = c.getElementsByTagName('v')[0]?.textContent ?? '', style = Number(c.getAttribute('s') ?? 0);
      let value = '';
      if (type === 's') value = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') value = byTag(c, 't').map((t) => t.textContent ?? '').join('');
      else if (type === 'str') value = v;
      else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
      else if (type === 'e') { info.errorCells += 1; value = ''; }
      else if (v !== '') { if (dateStyles.has(style) && Number(v) > 0) { value = dateText(Number(v), base1904); info.datesRead += 1; } else value = numberText(v); }
      else if (c.getElementsByTagName('f').length > 0) info.formulasWithoutValue += 1;
      while (cells.length < col) cells.push(''); cells[col] = value;
    }
    while (rows.length < rowNumber) rows.push([]); rows[rowNumber] = cells;
  }
  return finish(rows, info);
}

/** Reads a chosen file by its kind. */
export async function readFile(file: File, sheetIndex = 0): Promise<RawTable> {
  if (file.size > MAX_BYTES) throw new TableReadError('tooBig');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) throw new TableReadError('oldXls');
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return readXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, sheetIndex, file.name);
  const { text, encoding } = decodeBytes(bytes);
  return readText(text, 'csv', file.name, encoding);
}
