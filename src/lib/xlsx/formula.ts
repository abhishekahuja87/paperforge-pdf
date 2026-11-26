/** Works out the answers to the formulas we write, so the saved file already holds numbers. Phone and mail previews do not calculate, they only show saved values. Only the common older functions are supported, on purpose: they work in every spreadsheet app. */
import { colIndex, fromSerial, serial, todaySerial, type Book, type Value } from './model';

export interface XlError { err: string }
export type Val = string | number | boolean | null | XlError;
type Grid = Val[][];
const isErr = (v: unknown): v is XlError => typeof v === 'object' && v !== null && 'err' in v;
const E = (code: string): XlError => ({ err: code });

type Node =
  | { t: 'num'; v: number } | { t: 'str'; v: string } | { t: 'bool'; v: boolean }
  | { t: 'ref'; sheet?: string; col: number; row: number; ca: boolean; ra: boolean }
  | { t: 'range'; sheet?: string; c1: number; r1: number; c2: number; r2: number; ca1: boolean; ra1: boolean; ca2: boolean; ra2: boolean }
  | { t: 'fn'; name: string; args: Node[] }
  | { t: 'bin'; op: string; a: Node; b: Node } | { t: 'un'; op: string; a: Node } | { t: 'pct'; a: Node };

const REF = /^((?:'(?:[^']|'')+'|[A-Za-z_][\w.]*)!)?(\$?[A-Za-z]{1,3}\$?\d+)(?::(\$?[A-Za-z]{1,3}\$?\d+))?/;
const splitRef = (text: string) => { const m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/.exec(text)!; return { col: colIndex(m[2]!), row: Number(m[4]) - 1, ca: m[1] === '$', ra: m[3] === '$' }; };

interface Token { k: 'num' | 'str' | 'id' | 'ref' | 'op'; v: string }
function tokenize(src: string): Token[] {
  const out: Token[] = []; let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === '"') { let j = i + 1, text = ''; while (j < src.length) { if (src[j] === '"') { if (src[j + 1] === '"') { text += '"'; j += 2; continue; } break; } text += src[j]; j += 1; } out.push({ k: 'str', v: text }); i = j + 1; continue; }
    const rest = src.slice(i);
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(rest);
    if (num) { out.push({ k: 'num', v: num[0] }); i += num[0].length; continue; }
    const r = REF.exec(rest);
    if (r && !/^[\w(]/.test(rest.slice(r[0].length, r[0].length + 1))) { out.push({ k: 'ref', v: r[0] }); i += r[0].length; continue; }
    const id = /^[A-Za-z_][\w.]*/.exec(rest);
    if (id) { out.push({ k: 'id', v: id[0] }); i += id[0].length; continue; }
    const op = /^(<=|>=|<>|[=<>&+\-*/^%(),])/.exec(rest);
    if (op) { out.push({ k: 'op', v: op[0] }); i += op[0].length; continue; }
    throw new Error(`Cannot read formula near "${rest.slice(0, 8)}"`);
  }
  return out;
}

function parse(src: string): Node {
  const tokens = tokenize(src); let p = 0;
  const peek = () => tokens[p], next = () => tokens[p++]!;
  const isOp = (v: string) => peek()?.k === 'op' && peek()!.v === v;
  const level = (ops: string[], sub: () => Node): Node => { let a = sub(); while (peek()?.k === 'op' && ops.includes(peek()!.v)) { const op = next().v; a = { t: 'bin', op, a, b: sub() }; } return a; };
  const primary = (): Node => {
    const tk = next();
    if (!tk) throw new Error('Formula ends too soon');
    if (tk.k === 'num') return { t: 'num', v: Number(tk.v) };
    if (tk.k === 'str') return { t: 'str', v: tk.v };
    if (tk.k === 'ref') {
      const m = REF.exec(tk.v)!; const sheet = m[1] ? m[1].slice(0, -1).replace(/^'|'$/g, '').replace(/''/g, "'") : undefined;
      const a = splitRef(m[2]!);
      if (m[3]) { const b = splitRef(m[3]); return { t: 'range', sheet, c1: Math.min(a.col, b.col), r1: Math.min(a.row, b.row), c2: Math.max(a.col, b.col), r2: Math.max(a.row, b.row), ca1: a.col <= b.col ? a.ca : b.ca, ra1: a.row <= b.row ? a.ra : b.ra, ca2: a.col <= b.col ? b.ca : a.ca, ra2: a.row <= b.row ? b.ra : a.ra }; }
      return { t: 'ref', sheet, col: a.col, row: a.row, ca: a.ca, ra: a.ra };
    }
    if (tk.k === 'id') {
      const up = tk.v.toUpperCase();
      if (isOp('(')) {
        next(); const args: Node[] = [];
        if (isOp(')')) { next(); return { t: 'fn', name: up, args }; }
        for (;;) { if (isOp(',') || isOp(')')) args.push({ t: 'str', v: '' }); else args.push(compare()); if (isOp(',')) { next(); continue; } if (isOp(')')) { next(); break; } throw new Error('Expected , or )'); }
        return { t: 'fn', name: up, args };
      }
      if (up === 'TRUE') return { t: 'bool', v: true };
      if (up === 'FALSE') return { t: 'bool', v: false };
      throw new Error(`Unknown name ${tk.v}`);
    }
    if (tk.v === '(') { const inner = compare(); if (!isOp(')')) throw new Error('Missing )'); next(); return inner; }
    throw new Error(`Unexpected ${tk.v}`);
  };
  const postfix = (): Node => { let a = primary(); while (isOp('%')) { next(); a = { t: 'pct', a }; } return a; };
  const unary = (): Node => { if (isOp('-') || isOp('+')) { const op = next().v; return { t: 'un', op, a: unary() }; } return postfix(); };
  const power = (): Node => level(['^'], unary);
  const mul = (): Node => level(['*', '/'], power);
  const add = (): Node => level(['+', '-'], mul);
  const concat = (): Node => level(['&'], add);
  function compare(): Node { return level(['=', '<>', '<', '>', '<=', '>='], concat); }
  const tree = compare();
  if (p < tokens.length) throw new Error(`Unexpected ${tokens[p]!.v}`);
  return tree;
}

const num = (v: Val): number | XlError => {
  if (isErr(v)) return v; if (v === null || v === '') return 0; if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v; const n = Number(v.trim()); return Number.isFinite(n) ? n : E('#VALUE!');
};
const text = (v: Val): string => (isErr(v) ? v.err : v === null ? '' : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : typeof v === 'number' ? String(Math.round(v * 1e12) / 1e12) : v);
const truthy = (v: Val): boolean | XlError => { if (isErr(v)) return v; if (typeof v === 'string') return v.toLowerCase() === 'true' ? true : v.toLowerCase() === 'false' ? false : E('#VALUE!'); return !!(v ?? 0); };

function compareVals(a: Val, b: Val): number {
  const rank = (v: Val) => (typeof v === 'string' ? 2 : typeof v === 'boolean' ? 3 : 1);
  const x = a ?? (typeof b === 'string' ? '' : 0), y = b ?? (typeof a === 'string' ? '' : 0);
  if (rank(x) !== rank(y)) return rank(x) - rank(y);
  if (typeof x === 'string') return x.toLowerCase() < (y as string).toLowerCase() ? -1 : x.toLowerCase() > (y as string).toLowerCase() ? 1 : 0;
  return Number(x) - Number(y as number);
}

/** "=x", ">5", "<>done", "abc*" and plain values, as used by COUNTIF and SUMIFS. */
function criterion(c: Val): (v: Val) => boolean {
  if (typeof c === 'number' || typeof c === 'boolean') return (v) => compareVals(v, c) === 0 && typeof v !== 'string';
  const s = text(c); const m = /^(<=|>=|<>|=|<|>)?(.*)$/s.exec(s)!; const op = m[1] ?? '=', operand = m[2]!;
  const n = operand.trim() !== '' && Number.isFinite(Number(operand)) ? Number(operand) : null;
  if (operand === '' ) return op === '<>' ? (v) => v !== null && v !== '' : (v) => v === null || v === '';
  if (n !== null) { const cmp = (v: Val) => (typeof v === 'number' ? v - n : NaN); return op === '=' ? (v) => cmp(v) === 0 : op === '<>' ? (v) => cmp(v) !== 0 : op === '>' ? (v) => cmp(v) > 0 : op === '<' ? (v) => cmp(v) < 0 : op === '>=' ? (v) => cmp(v) >= 0 : (v) => cmp(v) <= 0; }
  const wild = /[*?]/.test(operand) ? new RegExp(`^${operand.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`, 'i') : null;
  const eq = (v: Val) => (typeof v === 'string' || typeof v === 'number') && (wild ? wild.test(String(v)) : String(v).toLowerCase() === operand.toLowerCase());
  return op === '<>' ? (v) => !eq(v) : eq;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const group = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export function formatText(v: Val, fmt: string): string {
  const n = num(v); if (isErr(n)) return n.err;
  if (/[dmy]/i.test(fmt.replace(/"[^"]*"/g, ''))) {
    const d = fromSerial(n), y = d.getUTCFullYear(), mo = d.getUTCMonth(), da = d.getUTCDate(), wd = d.getUTCDay();
    return fmt.replace(/yyyy|yy|mmmm|mmm|mm|m|dddd|ddd|dd|d/gi, (t) => {
      switch (t.toLowerCase()) { case 'yyyy': return String(y); case 'yy': return String(y).slice(-2); case 'mmmm': return MONTHS[mo]!; case 'mmm': return MONTHS[mo]!.slice(0, 3); case 'mm': return String(mo + 1).padStart(2, '0'); case 'm': return String(mo + 1);
        case 'dddd': return DAYS[wd]!; case 'ddd': return DAYS[wd]!.slice(0, 3); case 'dd': return String(da).padStart(2, '0'); default: return String(da); }
    });
  }
  const pct = fmt.includes('%'); const x = pct ? n * 100 : n; const dec = /\.(0+)/.exec(fmt)?.[1]?.length ?? 0;
  const fixed = Math.abs(x).toFixed(dec); const [whole, frac] = fixed.split('.'); const body = (fmt.includes(',') ? group(whole!) : whole!) + (frac ? `.${frac}` : '');
  return `${x < 0 ? '-' : ''}${body}${pct ? '%' : ''}`;
}

const asDate = (n: number) => fromSerial(n);
const roundTo = (x: number, d: number, mode: 'half' | 'up' | 'down') => { const f = 10 ** d; const y = Math.abs(x) * f; const r = mode === 'half' ? Math.round(y + 1e-9) : mode === 'up' ? Math.ceil(y - 1e-9) : Math.floor(y + 1e-9); return Math.sign(x) * r / f; };

/** Thrown for a function we do not support, so the cell is left without a saved value and the test notices. */
class Unsupported extends Error {}

/** Answers for every formula, and a way to ask whether a colour rule applies to a cell. */
export interface Computed { values: Map<string, Val>; warnings: string[]; test?: (sheet: string, formula: string, dc: number, dr: number) => boolean }
interface Shift { dc: number; dr: number }
const NO_SHIFT: Shift = { dc: 0, dr: 0 };
const key = (sheet: string, col: number, row: number) => `${sheet}!${col},${row}`;

/** Works out every formula in the book. Cells are looked up by sheet, column and row. */
export function computeBook(book: Book, now = new Date()): Computed {
  const sheets = new Map(book.sheets.map((s) => [s.name.toLowerCase(), s]));
  const sources = new Map<string, { sheet: string; col: number; row: number; f: string }>();
  const literals = new Map<string, Value>();
  for (const sheet of book.sheets) {
    for (const [at, cell] of Object.entries(sheet.cells)) {
      const m = /^([A-Z]+)(\d+)$/.exec(at)!; const col = colIndex(m[1]!), row = Number(m[2]) - 1;
      if (cell.f !== undefined) sources.set(key(sheet.name, col, row), { sheet: sheet.name, col, row, f: cell.f }); else if (cell.v !== undefined) literals.set(key(sheet.name, col, row), cell.v);
    }
  }
  const values = new Map<string, Val>(), busy = new Set<string>(), asts = new Map<string, Node>(), warnings: string[] = [], today = todaySerial(now);

  const cellVal = (sheet: string, col: number, row: number): Val => {
    const k = key(sheet, col, row);
    if (literals.has(k)) return literals.get(k) ?? null;
    const src = sources.get(k); if (!src) return null;
    if (values.has(k)) return values.get(k)!;
    if (busy.has(k)) return E('#REF!');
    busy.add(k);
    let result: Val;
    try { let ast = asts.get(k); if (!ast) { ast = parse(src.f); asts.set(k, ast); } result = scalar(evalNode(ast, sheet, NO_SHIFT)); if (result === null) result = 0; }
    catch (e) { warnings.push(`${sheet}!${col},${row}: ${(e as Error).message}`); result = E('#NAME?'); busy.delete(k); values.set(k, result); return result; }
    busy.delete(k); values.set(k, result); return result;
  };
  const scalar = (v: Val | Grid): Val => (Array.isArray(v) ? (v[0]?.[0] ?? null) : v);
  const range = (sheet: string, c1: number, r1: number, c2: number, r2: number): Grid => { const rows: Grid = []; for (let r = r1; r <= r2; r += 1) { const line: Val[] = []; for (let c = c1; c <= c2; c += 1) line.push(cellVal(sheet, c, r)); rows.push(line); } return rows; };
  const flat = (g: Grid) => g.flat();

  function evalNode(n: Node, sheet: string, off: Shift): Val | Grid {
    switch (n.t) {
      case 'num': return n.v; case 'str': return n.v; case 'bool': return n.v;
      case 'ref': { const s = n.sheet ? sheets.get(n.sheet.toLowerCase())?.name : sheet; const c = n.col + (n.ca ? 0 : off.dc), r = n.row + (n.ra ? 0 : off.dr); return s && c >= 0 && r >= 0 ? cellVal(s, c, r) : E('#REF!'); }
      case 'range': { const s = n.sheet ? sheets.get(n.sheet.toLowerCase())?.name : sheet; const c1 = n.c1 + (n.ca1 ? 0 : off.dc), r1 = n.r1 + (n.ra1 ? 0 : off.dr), c2 = n.c2 + (n.ca2 ? 0 : off.dc), r2 = n.r2 + (n.ra2 ? 0 : off.dr); return s && c1 >= 0 && r1 >= 0 ? range(s, c1, r1, c2, r2) : E('#REF!'); }
      case 'pct': { const x = num(scalar(evalNode(n.a, sheet, off))); return isErr(x) ? x : x / 100; }
      case 'un': { const x = num(scalar(evalNode(n.a, sheet, off))); return isErr(x) ? x : n.op === '-' ? -x : x; }
      case 'bin': return binary(n.op, scalar(evalNode(n.a, sheet, off)), scalar(evalNode(n.b, sheet, off)));
      case 'fn': return call(n.name, n.args, sheet, off);
    }
  }
  function binary(op: string, a: Val, b: Val): Val {
    if (isErr(a)) return a; if (isErr(b)) return b;
    if (op === '&') return text(a) + text(b);
    if (['=', '<>', '<', '>', '<=', '>='].includes(op)) { const c = compareVals(a, b); return op === '=' ? c === 0 : op === '<>' ? c !== 0 : op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0; }
    const x = num(a), y = num(b); if (isErr(x)) return x; if (isErr(y)) return y;
    switch (op) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return y === 0 ? E('#DIV/0!') : x / y; default: return x ** y; }
  }

  function call(name: string, args: Node[], sheet: string, off: Shift): Val | Grid {
    const arg = (i: number) => (args[i] ? evalNode(args[i]!, sheet, off) : null);
    const sc = (i: number) => scalar(arg(i) as Val | Grid);
    const nums = (): number[] | XlError => { const out: number[] = []; for (let i = 0; i < args.length; i += 1) { const v = arg(i); if (Array.isArray(v)) { for (const x of flat(v)) { if (isErr(x)) return x; if (typeof x === 'number') out.push(x); } } else { const n = num(v as Val); if (isErr(n)) return n; out.push(n); } } return out; };
    const n1 = (i: number): number | XlError => num(sc(i));
    switch (name) {
      case 'IF': { const c = truthy(sc(0)); if (isErr(c)) return c; return c ? (args[1] ? arg(1) : true) : (args[2] ? arg(2) : false); }
      case 'IFERROR': { const v = sc(0); return isErr(v) ? arg(1) : v; }
      case 'AND': case 'OR': { let acc = name === 'AND'; for (let i = 0; i < args.length; i += 1) { const v = arg(i); for (const x of Array.isArray(v) ? flat(v) : [v as Val]) { if (x === null || x === '') continue; const b = truthy(x); if (isErr(b)) return b; acc = name === 'AND' ? acc && b : acc || b; } } return acc; }
      case 'NOT': { const b = truthy(sc(0)); return isErr(b) ? b : !b; }
      case 'SUM': { const l = nums(); return isErr(l) ? l : l.reduce((a, b) => a + b, 0); }
      case 'MAX': { const l = nums(); return isErr(l) ? l : l.length ? Math.max(...l) : 0; }
      case 'MIN': { const l = nums(); return isErr(l) ? l : l.length ? Math.min(...l) : 0; }
      case 'AVERAGE': { const l = nums(); return isErr(l) ? l : l.length ? l.reduce((a, b) => a + b, 0) / l.length : E('#DIV/0!'); }
      case 'COUNT': { let c = 0; for (let i = 0; i < args.length; i += 1) { const v = arg(i); for (const x of Array.isArray(v) ? flat(v) : [v as Val]) if (typeof x === 'number') c += 1; } return c; }
      case 'COUNTA': { let c = 0; for (let i = 0; i < args.length; i += 1) { const v = arg(i); for (const x of Array.isArray(v) ? flat(v) : [v as Val]) if (x !== null && x !== '') c += 1; } return c; }
      case 'ABS': { const x = n1(0); return isErr(x) ? x : Math.abs(x); }
      case 'INT': { const x = n1(0); return isErr(x) ? x : Math.floor(x); }
      case 'MOD': { const x = n1(0), y = n1(1); if (isErr(x)) return x; if (isErr(y)) return y; return y === 0 ? E('#DIV/0!') : x - y * Math.floor(x / y); }
      case 'ROUND': case 'ROUNDUP': case 'ROUNDDOWN': { const x = n1(0), d = args[1] ? n1(1) : 0; if (isErr(x)) return x; if (isErr(d)) return d; return roundTo(x, d, name === 'ROUND' ? 'half' : name === 'ROUNDUP' ? 'up' : 'down'); }
      case 'COUNTIF': case 'SUMIF': { const r = arg(0) as Grid, test = criterion(sc(1)); const sum = name === 'SUMIF' ? (args[2] ? (arg(2) as Grid) : r) : null; const a = flat(r), b = sum ? flat(sum) : null; let total = 0; a.forEach((v, i) => { if (test(v)) { if (b) { const x = b[i]; if (typeof x === 'number') total += x; } else total += 1; } }); return total; }
      case 'COUNTIFS': case 'SUMIFS': {
        const sumArg = name === 'SUMIFS' ? flat(arg(0) as Grid) : null; const start = name === 'SUMIFS' ? 1 : 0; const tests: { cells: Val[]; test: (v: Val) => boolean }[] = [];
        for (let i = start; i + 1 < args.length + 1 && args[i]; i += 2) tests.push({ cells: flat(arg(i) as Grid), test: criterion(sc(i + 1)) });
        const size = tests[0]?.cells.length ?? 0; let total = 0;
        for (let i = 0; i < size; i += 1) if (tests.every((t) => t.test(t.cells[i] ?? null))) { if (sumArg) { const x = sumArg[i]; if (typeof x === 'number') total += x; } else total += 1; }
        return total;
      }
      case 'INDEX': { const g = arg(0) as Grid; if (!Array.isArray(g)) return g; const r = n1(1), c = args[2] ? n1(2) : 0; if (isErr(r)) return r; if (isErr(c)) return c; const one = g.length === 1; const rr = one && !args[2] ? 1 : r, cc = one && !args[2] ? r : (c || 1); const v = g[rr - 1]?.[cc - 1]; return v === undefined ? E('#REF!') : v; }
      case 'MATCH': {
        const target = sc(0); const g = flat(arg(1) as Grid); const type = args[2] ? n1(2) : 1; if (isErr(type)) return type; if (isErr(target)) return target;
        if (type === 0) { const test = typeof target === 'string' ? criterion(`=${target}`) : (v: Val) => compareVals(v, target) === 0 && typeof v !== 'string'; const at = g.findIndex((v) => test(v)); return at < 0 ? E('#N/A') : at + 1; }
        let best = -1; g.forEach((v, i) => { if (v !== null && v !== '' && compareVals(v, target) <= 0) best = i; }); return best < 0 ? E('#N/A') : best + 1;
      }
      case 'CHOOSE': { const i = n1(0); if (isErr(i)) return i; return args[i] ? arg(i) : E('#VALUE!'); }
      case 'ISBLANK': { const v = sc(0); return v === null || v === ''; }
      case 'ISNUMBER': return typeof sc(0) === 'number';
      case 'ISTEXT': { const v = sc(0); return typeof v === 'string' && v !== ''; }
      case 'ISERROR': return isErr(sc(0));
      case 'VALUE': { const x = num(sc(0)); return x; }
      case 'LEN': return text(sc(0)).length;
      case 'UPPER': return text(sc(0)).toUpperCase();
      case 'LOWER': return text(sc(0)).toLowerCase();
      case 'TRIM': return text(sc(0)).trim().replace(/\s+/g, ' ');
      case 'LEFT': { const n = args[1] ? n1(1) : 1; return isErr(n) ? n : text(sc(0)).slice(0, n); }
      case 'RIGHT': { const n = args[1] ? n1(1) : 1; return isErr(n) ? n : n === 0 ? '' : text(sc(0)).slice(-n); }
      case 'MID': { const s = n1(1), l = n1(2); if (isErr(s)) return s; if (isErr(l)) return l; return text(sc(0)).substr(s - 1, l); }
      case 'SUBSTITUTE': return text(sc(0)).split(text(sc(1))).join(text(sc(2)));
      case 'TEXT': { const v = sc(0); return v === '' ? '' : formatText(v, text(sc(1))); }
      case 'HYPERLINK': return args[1] ? sc(1) : sc(0);
      case 'TODAY': return today;
      case 'DATE': { const y = n1(0), m = n1(1), d = n1(2); if (isErr(y)) return y; if (isErr(m)) return m; if (isErr(d)) return d; return serial(y, 1, 1) + Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000); }
      case 'YEAR': { const x = n1(0); return isErr(x) ? x : asDate(x).getUTCFullYear(); }
      case 'MONTH': { const x = n1(0); return isErr(x) ? x : asDate(x).getUTCMonth() + 1; }
      case 'DAY': { const x = n1(0); return isErr(x) ? x : asDate(x).getUTCDate(); }
      case 'WEEKDAY': { const x = n1(0), t = args[1] ? n1(1) : 1; if (isErr(x)) return x; if (isErr(t)) return t; const w = asDate(x).getUTCDay(); return t === 2 ? (w + 6) % 7 + 1 : t === 3 ? (w + 6) % 7 : w + 1; }
      case 'EOMONTH': { const x = n1(0), m = n1(1); if (isErr(x)) return x; if (isErr(m)) return m; const d = asDate(x); return Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m + 1, 0) - Date.UTC(1899, 11, 30)) / 86400000); }
      case 'ROW': case 'COLUMN': throw new Unsupported(name);
      default: throw new Unsupported(name);
    }
  }

  for (const k of sources.keys()) { const m = /^(.*)!(\d+),(\d+)$/s.exec(k)!; cellVal(m[1]!, Number(m[2]), Number(m[3])); }
  const conditions = new Map<string, Node>();
  const test = (sheet: string, formula: string, dc: number, dr: number): boolean => {
    try { let ast = conditions.get(formula); if (!ast) { ast = parse(formula); conditions.set(formula, ast); } return scalar(evalNode(ast, sheet, { dc, dr })) === true; } catch { return false; }
  };
  return { values, warnings, test };
}

export { isErr };
