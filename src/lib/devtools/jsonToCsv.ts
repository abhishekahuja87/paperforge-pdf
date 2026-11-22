/** Turning JSON into CSV: finding the list of records, flattening nested values, and writing safe CSV text. */

export type Delimiter = ',' | ';' | '\t' | '|';
export type ArrayMode = 'join' | 'json' | 'columns';

export interface CsvOptions {
  delimiter: Delimiter;
  /** Turn nested objects into columns such as address.city. When off they are kept as JSON text. */
  flatten: boolean;
  /** What to do with lists inside a record. */
  arrayMode: ArrayMode;
  /** Write the column names as the first row. */
  header: boolean;
  /** Put every value in quotes, not only the ones that need it. */
  quoteAll: boolean;
  /** Text written for null or a missing value. */
  emptyText: string;
  /** Put an apostrophe before text that starts with = + - or @, so a spreadsheet cannot run it as a formula. */
  protectFormulas: boolean;
}

export const DEFAULT_OPTIONS: CsvOptions = { delimiter: ',', flatten: true, arrayMode: 'join', header: true, quoteAll: false, emptyText: '', protectFormulas: true };

/** A place in the JSON that holds a list of records. */
export interface RecordSet {
  /** Dotted path from the top, empty for the top itself. */
  path: string;
  /** "list" is [ ... ]; "keyed" is an object whose values are records, so each key becomes a "key" column. */
  kind: 'list' | 'keyed' | 'single';
  count: number;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const joinPath = (base: string, key: string) => (base ? `${base}.${key}` : key);

/** Finds every list of records in the JSON (up to a few levels down), biggest first. */
export function findRecordSets(root: unknown): RecordSet[] {
  const found: RecordSet[] = [];
  const visit = (value: unknown, path: string, depth: number) => {
    if (Array.isArray(value)) {
      if (value.length > 0) found.push({ path, kind: 'list', count: value.length });
      return;
    }
    if (!isObject(value)) return;
    const values = Object.values(value);
    if (path === '' && values.length > 1 && values.every(isObject) && !values.some(Array.isArray)) {
      // Something like { "a": {...}, "b": {...} } is a keyed table.
      found.push({ path, kind: 'keyed', count: values.length });
    }
    if (depth < 4) for (const [key, child] of Object.entries(value)) visit(child, joinPath(path, key), depth + 1);
  };
  visit(root, '', 0);
  if (found.length === 0 && isObject(root)) found.push({ path: '', kind: 'single', count: 1 });
  // A top-level list should come first even when something inside it is longer.
  return found.sort((a, b) => (a.path === '' ? -1 : b.path === '' ? 1 : b.count - a.count));
}

export function valueAtPath(root: unknown, path: string): unknown {
  if (!path) return root;
  let current: unknown = root;
  for (const key of path.split('.')) {
    if (!isObject(current) && !Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** The records at a place found by findRecordSets, each as a value that can be flattened. */
export function recordsOf(root: unknown, set: RecordSet): { key?: string; value: unknown }[] {
  const target = valueAtPath(root, set.path);
  if (set.kind === 'list' && Array.isArray(target)) return target.map((value) => ({ value }));
  if (set.kind === 'keyed' && isObject(target)) return Object.entries(target).map(([key, value]) => ({ key, value }));
  return [{ value: target }];
}

type Cell = { text: string; isString: boolean };
const FORMULA_START = /^[=+\-@\t\r]/;

function leaf(value: unknown, options: CsvOptions): Cell {
  if (value === null || value === undefined) return { text: options.emptyText, isString: false };
  if (typeof value === 'string') return { text: value, isString: true };
  if (typeof value === 'number' || typeof value === 'boolean') return { text: String(value), isString: false };
  return { text: JSON.stringify(value), isString: true };
}

function flattenInto(out: Map<string, Cell>, prefix: string, value: unknown, options: CsvOptions, depth: number): void {
  const name = prefix || 'value';
  if (Array.isArray(value)) {
    if (options.arrayMode === 'columns' && depth < 8) {
      if (value.length === 0) out.set(name, { text: '', isString: false });
      value.forEach((item, index) => flattenInto(out, `${name}.${index}`, item, options, depth + 1));
    } else if (options.arrayMode === 'join' && value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
      out.set(name, { text: value.map((item) => (item === null ? '' : String(item))).join('; '), isString: true });
    } else out.set(name, { text: JSON.stringify(value), isString: true });
    return;
  }
  if (isObject(value)) {
    const entries = Object.entries(value);
    if ((!options.flatten && depth > 0) || depth >= 8) { out.set(name, { text: JSON.stringify(value), isString: true }); return; }
    if (entries.length === 0) { out.set(name, { text: '', isString: false }); return; }
    for (const [key, child] of entries) flattenInto(out, prefix ? `${prefix}.${key}` : key, child, options, depth + 1);
    return;
  }
  out.set(name, leaf(value, options));
}

export interface CsvTable { columns: string[]; rows: string[][] }

/** Flattens the records into a table: one column per distinct key, in the order first seen. */
export function buildTable(records: { key?: string; value: unknown }[], options: CsvOptions): CsvTable {
  const order = new Map<string, number>();
  const flat: Map<string, Cell>[] = [];
  const withKey = records.some((record) => record.key !== undefined);
  if (withKey) order.set('key', 0);
  for (const record of records) {
    const cells = new Map<string, Cell>();
    if (record.key !== undefined) cells.set('key', { text: record.key, isString: true });
    flattenInto(cells, '', record.value, options, 0);
    for (const name of cells.keys()) if (!order.has(name)) order.set(name, order.size);
    flat.push(cells);
  }
  const columns = [...order.keys()];
  const rows = flat.map((cells) => columns.map((name) => {
    const cell = cells.get(name);
    if (!cell) return options.emptyText;
    return options.protectFormulas && cell.isString && FORMULA_START.test(cell.text) ? `'${cell.text}` : cell.text;
  }));
  return { columns, rows };
}

function escapeCell(text: string, options: CsvOptions): string {
  const needs = options.quoteAll || text.includes(options.delimiter) || /["\r\n]/.test(text) || /^\s|\s$/.test(text);
  return needs ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV text with Windows line endings, which every spreadsheet reads. */
export function toCsv(table: CsvTable, options: CsvOptions, columnsToUse?: string[]): string {
  const keep = columnsToUse ? table.columns.map((name, index) => ({ name, index })).filter((column) => columnsToUse.includes(column.name)) : table.columns.map((name, index) => ({ name, index }));
  const lines: string[] = [];
  if (options.header) lines.push(keep.map((column) => escapeCell(column.name, options)).join(options.delimiter));
  for (const row of table.rows) lines.push(keep.map((column) => escapeCell(row[column.index] ?? '', options)).join(options.delimiter));
  return lines.join('\r\n');
}
