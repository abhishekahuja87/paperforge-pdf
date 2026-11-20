import type { Sheet } from '../paper/geometry';
import { INK, clamp, fitText, flag, line, lines, makePages, num, str, text, titleBar, type Ctx } from './draw';
import { randInt, rng, shuffle } from './rng';
import { blank } from './simple';
import type { Family, SheetDef, Values } from './types';

const GREY = '#9a9a9a';
const sel = (v: Values, key: string, fallback: string) => str(v, key) || fallback;
const seedOf = (v: Values) => clamp(num(v, 'seed', 1), 1, 99999);
const SEED_FIELD = { type: 'number', key: 'seed', label: 'Puzzle number', min: 1, max: 99999, step: 1, unit: '' } as const;
const KEY_FIELD = { type: 'toggle', key: 'answers', label: 'Add an answer page', hint: 'The answers are on a separate page at the end.' } as const;

/** The name and date lines under a title. Returns where the content starts. */
function header(c: Ctx, title: string, withName: boolean): number {
  const top = c.y + titleBar(c, title);
  if (!withName) return top;
  blank(c, c.x, top + 1, c.w * 0.62, 'Name:');
  blank(c, c.x + c.w * 0.66, top + 1, c.w * 0.34, 'Date:');
  return top + 11;
}

/* ---------- Maths worksheet ---------- */

type Op = '+' | '-' | 'x' | '/';
interface Problem { a: number; b: number; op: Op; answer: number }

function makeProblem(next: () => number, op: Op, digits: number): Problem {
  const lo = digits === 1 ? 1 : 10 ** (digits - 1);
  const hi = 10 ** digits - 1;
  if (op === '+') { const a = randInt(next, lo, hi); const b = randInt(next, lo, hi); return { a, b, op, answer: a + b }; }
  if (op === '-') { const a = randInt(next, lo, hi); const b = randInt(next, lo, hi); const big = Math.max(a, b); const small = Math.min(a, b); return { a: big, b: small, op, answer: big - small }; }
  if (op === 'x') { const a = randInt(next, lo, hi); const b = randInt(next, 2, digits === 1 ? 9 : 12); return { a, b, op, answer: a * b }; }
  const b = randInt(next, 2, digits === 1 ? 9 : 12);
  const q = randInt(next, 2, digits === 1 ? 9 : 10 ** Math.max(1, digits - 1) + 9);
  return { a: b * q, b, op, answer: q };
}

const opSymbol = (op: Op) => (op === '+' ? '+' : op === '-' ? '-' : op === 'x' ? 'x' : '/');

const mathSheet: SheetDef = {
  id: 'math-worksheet-generator-printable', label: 'Maths worksheet', hint: 'Sums with an answer page', path: '/math-worksheet-generator-printable', landscape: false,
  fields: [
    { type: 'select', key: 'op', label: 'Kind of sums', options: [{ value: '+', label: 'Addition' }, { value: '-', label: 'Subtraction' }, { value: 'x', label: 'Multiplication' }, { value: '/', label: 'Division' }, { value: 'mixed', label: 'All four mixed' }] },
    { type: 'select', key: 'digits', label: 'Size of numbers', options: [{ value: '1', label: '1 digit' }, { value: '2', label: '2 digits' }, { value: '3', label: '3 digits' }, { value: '4', label: '4 digits' }] },
    { type: 'select', key: 'layout', label: 'Layout', options: [{ value: 'vertical', label: 'Stacked, one number under the other' }, { value: 'horizontal', label: 'In a line, 12 + 7 = ' }] },
    { type: 'number', key: 'count', label: 'Number of sums', min: 6, max: 60, step: 1, unit: 'sums' },
    SEED_FIELD, KEY_FIELD,
    { type: 'toggle', key: 'name', label: 'Name and date lines' },
  ],
  defaults: { op: '+', digits: '2', layout: 'vertical', count: 20, seed: 1, answers: true, name: true },
  build: (v, common) => {
    const kind = sel(v, 'op', '+');
    const digits = clamp(Number(sel(v, 'digits', '2')), 1, 4);
    const vertical = sel(v, 'layout', 'vertical') === 'vertical';
    const count = clamp(num(v, 'count', 20), 6, 60);
    const next = rng(seedOf(v));
    const ops: Op[] = ['+', '-', 'x', '/'];
    const problems = Array.from({ length: count }, (_, i) => makeProblem(next, kind === 'mixed' ? ops[i % 4]! : (kind as Op), digits));
    const cols = vertical ? 4 : 2;
    const perPage = vertical ? 24 : 40;
    const sheets: Sheet[] = [];
    const draw = (title: string, withAnswers: boolean) => {
      const pages = Math.ceil(count / perPage);
      sheets.push(...makePages(common, pages, (c, pi) => {
        const top = header(c, title, flag(v, 'name') && !withAnswers);
        const slice = problems.slice(pi * perPage, (pi + 1) * perPage);
        const rows = vertical ? 6 : 20;
        const cw = c.w / cols;
        const rh = (c.y + c.h - top) / rows;
        slice.forEach((p, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = c.x + col * cw;
          const y = top + row * rh;
          const n = pi * perPage + i + 1;
          text(c, x + 1, y + 5, 7, `${n}.`, false, 'start', GREY);
          if (vertical) {
            const right = x + cw - 8;
            const size = Math.min(15, rh * 0.38);
            text(c, right, y + 10, size, String(p.a), true, 'end', INK);
            text(c, right, y + 10 + size * 0.5, size, String(p.b), true, 'end', INK);
            text(c, right - String(Math.max(p.a, p.b)).length * size * (c.cw + 0.01) - 4, y + 10 + size * 0.5, size, opSymbol(p.op), true, 'end', INK);
            line(c, x + 6, y + 10 + size * 0.5 + 2, right + 1, y + 10 + size * 0.5 + 2, c.weight * 1.5);
            if (withAnswers) text(c, right, y + 10 + size * 1.1 + 2, size, String(p.answer), true, 'end', '#2a6b2a');
          } else {
            const size = Math.min(14, rh * 0.5);
            const label = `${p.a} ${opSymbol(p.op)} ${p.b} =`;
            text(c, x + 8, y + rh * 0.62, size, label, true, 'start', INK);
            if (withAnswers) text(c, x + 8 + label.length * size * (c.cw + 0.01) + 3, y + rh * 0.62, size, String(p.answer), true, 'start', '#2a6b2a');
            else line(c, x + 8 + label.length * size * 0.2 + 2, y + rh * 0.62 + 0.8, x + cw - 4, y + rh * 0.62 + 0.8, c.weight);
          }
        });
      }));
    };
    draw('Maths practice', false);
    if (flag(v, 'answers')) draw('Maths practice: answers', true);
    return sheets;
  },
};

/* ---------- Times tables ---------- */

const tablesSheet: SheetDef = {
  id: 'times-table-worksheet-printable', label: 'Times tables', hint: 'Practice sheets and charts', path: '/times-table-worksheet-printable', landscape: false,
  fields: [
    { type: 'number', key: 'from', label: 'First table', min: 1, max: 30, step: 1, unit: '' },
    { type: 'number', key: 'to', label: 'Last table', min: 1, max: 30, step: 1, unit: '' },
    { type: 'select', key: 'upto', label: 'Up to', options: [{ value: '10', label: 'x 10' }, { value: '12', label: 'x 12' }, { value: '20', label: 'x 20' }] },
    { type: 'select', key: 'style', label: 'Style', options: [{ value: 'practice', label: 'Practice: write the answers' }, { value: 'shuffled', label: 'Practice in a mixed order' }, { value: 'chart', label: 'Chart with all answers' }] },
    SEED_FIELD, { type: 'toggle', key: 'name', label: 'Name and date lines' },
  ],
  defaults: { from: 2, to: 9, upto: '10', style: 'practice', seed: 1, name: true },
  build: (v, common) => {
    const from = clamp(num(v, 'from', 2), 1, 30);
    const to = Math.max(from, clamp(num(v, 'to', 9), 1, 30));
    const upto = clamp(Number(sel(v, 'upto', '10')), 5, 20);
    const style = sel(v, 'style', 'practice');
    const tables = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    if (style === 'chart') {
      return makePages(common, 1, (c) => {
        const top = header(c, 'Multiplication chart', false);
        const cols = Math.min(tables.length, 6);
        const rowsPer = Math.ceil(tables.length / cols);
        const bw = c.w / cols;
        const bh = (c.y + c.h - top) / rowsPer;
        tables.forEach((t, i) => {
          const x = c.x + (i % cols) * bw;
          const y = top + Math.floor(i / cols) * bh;
          line(c, x + 1, y, x + bw - 1, y, c.weight * 1.6);
          text(c, x + bw / 2, y + 7, 11, `Table of ${t}`, true, 'middle', INK);
          const step = Math.min(8, (bh - 12) / upto);
          for (let k = 1; k <= upto; k += 1) text(c, x + bw / 2, y + 12 + k * step, Math.min(9, step * 1.1), `${t} x ${k} = ${t * k}`, false, 'middle', INK);
        });
      });
    }
    const perPage = 4;
    const pages = Math.ceil(tables.length / perPage);
    const next = rng(seedOf(v));
    return makePages(common, pages, (c, pi) => {
      const top = header(c, 'Times tables practice', flag(v, 'name'));
      const group = tables.slice(pi * perPage, (pi + 1) * perPage);
      const bw = c.w / group.length;
      const rh = Math.min(16, (c.y + c.h - top - 14) / upto);
      group.forEach((t, i) => {
        const x = c.x + i * bw;
        text(c, x + bw / 2, top + 8, 12, `Table of ${t}`, true, 'middle', INK);
        const order = style === 'shuffled' ? shuffle(next, Array.from({ length: upto }, (_, k) => k + 1)) : Array.from({ length: upto }, (_, k) => k + 1);
        order.forEach((k, r) => {
          const y = top + 16 + r * rh;
          text(c, x + 4, y + rh * 0.62, Math.min(12, rh * 0.7), `${t} x ${k} =`, true, 'start', INK);
          line(c, x + bw * 0.55, y + rh * 0.7, x + bw - 4, y + rh * 0.7, c.weight);
        });
      });
    });
  },
};

/* ---------- Word search ---------- */

interface Placed { word: string; x: number; y: number; dx: number; dy: number }

function buildSearch(next: () => number, words: string[], size: number, hard: number): { grid: string[][]; placed: Placed[]; missed: string[] } {
  const dirs: [number, number][] = [[1, 0], [0, 1]];
  if (hard >= 1) dirs.push([1, 1], [1, -1]);
  if (hard >= 2) dirs.push([-1, 0], [0, -1], [-1, -1], [-1, 1]);
  const grid: string[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
  const placed: Placed[] = [];
  const missed: string[] = [];
  [...words].sort((a, b) => b.length - a.length).forEach((word) => {
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const [dx, dy] = dirs[randInt(next, 0, dirs.length - 1)]!;
      const x = randInt(next, 0, size - 1);
      const y = randInt(next, 0, size - 1);
      const ex = x + dx * (word.length - 1);
      const ey = y + dy * (word.length - 1);
      if (ex < 0 || ey < 0 || ex >= size || ey >= size) continue;
      let ok = true;
      for (let i = 0; i < word.length && ok; i += 1) { const cell = grid[y + dy * i]![x + dx * i]!; if (cell && cell !== word[i]) ok = false; }
      if (!ok) continue;
      for (let i = 0; i < word.length; i += 1) grid[y + dy * i]![x + dx * i] = word[i]!;
      placed.push({ word, x, y, dx, dy });
      return;
    }
    missed.push(word);
  });
  return { grid, placed, missed };
}

const wordSearchSheet: SheetDef = {
  id: 'word-search-generator-printable', label: 'Word search', hint: 'Your words in a puzzle', path: '/word-search-generator-printable', landscape: false,
  fields: [
    { type: 'text', key: 'title', label: 'Title', placeholder: 'Animals', max: 40 },
    { type: 'list', key: 'words', label: 'Words', hint: 'One per line, up to 24, letters only.', max: 24 },
    { type: 'select', key: 'size', label: 'Grid size', options: [{ value: '10', label: '10 x 10 (small)' }, { value: '13', label: '13 x 13' }, { value: '16', label: '16 x 16' }, { value: '20', label: '20 x 20 (large)' }] },
    { type: 'select', key: 'level', label: 'Directions', options: [{ value: '0', label: 'Easy: across and down' }, { value: '1', label: 'Medium: plus diagonals' }, { value: '2', label: 'Hard: every direction, also backwards' }] },
    SEED_FIELD, KEY_FIELD,
  ],
  defaults: { title: '', words: 'APPLE\nMANGO\nBANANA\nGRAPES\nORANGE\nGUAVA\nPAPAYA\nLEMON\nCHERRY\nPEAR', size: '13', level: '1', seed: 1, answers: true },
  build: (v, common) => {
    const size = clamp(Number(sel(v, 'size', '13')), 8, 22);
    const words = lines(v, 'words', 24).map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length >= 2 && w.length <= size);
    const unique = Array.from(new Set(words));
    const { grid, placed } = buildSearch(rng(seedOf(v)), unique, size, clamp(Number(sel(v, 'level', '1')), 0, 2));
    const fill = rng(seedOf(v) + 7);
    const letters = grid.map((row) => row.map((cell) => cell || String.fromCharCode(65 + Math.floor(fill() * 26))));
    const title = str(v, 'title') || 'Word search';
    const sheets: Sheet[] = [];
    const draw = (showKey: boolean) => sheets.push(...makePages(common, 1, (c) => {
      const top = header(c, showKey ? `${title}: answers` : title, !showKey);
      const listH = Math.ceil(unique.length / 4) * 7 + 12;
      const cell = Math.min(c.w / size, (c.y + c.h - top - listH) / size);
      const gx = c.x + (c.w - cell * size) / 2;
      const inKey = new Set<string>();
      if (showKey) placed.forEach((p) => { for (let i = 0; i < p.word.length; i += 1) inKey.add(`${p.x + p.dx * i},${p.y + p.dy * i}`); });
      letters.forEach((row, y) => row.forEach((ch, x) => {
        const hit = inKey.has(`${x},${y}`);
        text(c, gx + x * cell + cell / 2, top + y * cell + cell * 0.68, cell * 1.9, ch, hit, 'middle', showKey && !hit ? '#bbbbbb' : INK);
      }));
      line(c, gx, top, gx + cell * size, top, c.weight * 1.4); line(c, gx, top + cell * size, gx + cell * size, top + cell * size, c.weight * 1.4);
      line(c, gx, top, gx, top + cell * size, c.weight * 1.4); line(c, gx + cell * size, top, gx + cell * size, top + cell * size, c.weight * 1.4);
      const ly = top + cell * size + 9;
      text(c, c.x, ly, 10, 'Find these words:', true, 'start', INK);
      unique.forEach((w, i) => text(c, c.x + (i % 4) * (c.w / 4), ly + 7 + Math.floor(i / 4) * 7, 10, w, false, 'start', INK));
    }));
    draw(false);
    if (flag(v, 'answers')) draw(true);
    return sheets;
  },
};

/* ---------- Maze ---------- */

interface Maze { cols: number; rows: number; right: boolean[][]; down: boolean[][]; path: [number, number][] }

function buildMaze(next: () => number, cols: number, rows: number): Maze {
  const right = Array.from({ length: rows }, () => Array.from({ length: cols }, () => true));
  const down = Array.from({ length: rows }, () => Array.from({ length: cols }, () => true));
  const seen = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
  const stack: [number, number][] = [[0, 0]];
  seen[0]![0] = true;
  while (stack.length > 0) {
    const [x, y] = stack[stack.length - 1]!;
    const options: [number, number][] = [];
    if (x > 0 && !seen[y]![x - 1]!) options.push([x - 1, y]);
    if (x < cols - 1 && !seen[y]![x + 1]!) options.push([x + 1, y]);
    if (y > 0 && !seen[y - 1]![x]!) options.push([x, y - 1]);
    if (y < rows - 1 && !seen[y + 1]![x]!) options.push([x, y + 1]);
    if (options.length === 0) { stack.pop(); continue; }
    const [nx, ny] = options[randInt(next, 0, options.length - 1)]!;
    if (nx > x) right[y]![x] = false; else if (nx < x) right[ny]![nx] = false; else if (ny > y) down[y]![x] = false; else down[ny]![nx] = false;
    seen[ny]![nx] = true;
    stack.push([nx, ny]);
  }
  // The route from the start to the exit, by a search that remembers where it came from.
  const from = new Map<string, string>();
  const queue: [number, number][] = [[0, 0]];
  from.set('0,0', '');
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const open: [number, number][] = [];
    if (x < cols - 1 && !right[y]![x]!) open.push([x + 1, y]);
    if (x > 0 && !right[y]![x - 1]!) open.push([x - 1, y]);
    if (y < rows - 1 && !down[y]![x]!) open.push([x, y + 1]);
    if (y > 0 && !down[y - 1]![x]!) open.push([x, y - 1]);
    open.forEach(([ox, oy]) => { if (!from.has(`${ox},${oy}`)) { from.set(`${ox},${oy}`, `${x},${y}`); queue.push([ox, oy]); } });
  }
  const path: [number, number][] = [];
  let key = `${cols - 1},${rows - 1}`;
  while (key) { const [px, py] = key.split(',').map(Number) as [number, number]; path.unshift([px, py]); key = from.get(key) ?? ''; }
  return { cols, rows, right, down, path };
}

const mazeSheet: SheetDef = {
  id: 'maze-generator-printable', label: 'Maze', hint: 'A new maze each time', path: '/maze-generator-printable', landscape: false,
  fields: [
    { type: 'select', key: 'size', label: 'Size', options: [{ value: 'small', label: 'Small and easy (10 x 14)' }, { value: 'medium', label: 'Medium (15 x 21)' }, { value: 'large', label: 'Large and hard (22 x 30)' }] },
    { type: 'number', key: 'pages', label: 'Different mazes', min: 1, max: 6, step: 1, unit: 'mazes' },
    SEED_FIELD, KEY_FIELD, { type: 'toggle', key: 'name', label: 'Name line' },
  ],
  defaults: { size: 'medium', pages: 1, seed: 1, answers: false, name: true },
  build: (v, common) => {
    const [cols, rows] = ({ small: [10, 14], medium: [15, 21], large: [22, 30] } as Record<string, [number, number]>)[sel(v, 'size', 'medium')] ?? [15, 21];
    const count = clamp(num(v, 'pages', 1), 1, 6);
    const mazes = Array.from({ length: count }, (_, i) => buildMaze(rng(seedOf(v) + i * 101), cols, rows));
    const sheets: Sheet[] = [];
    const draw = (showKey: boolean) => sheets.push(...makePages(common, count, (c, i) => {
      const m = mazes[i]!;
      const top = header(c, showKey ? 'Maze: the way through' : 'Find your way through the maze', flag(v, 'name') && !showKey);
      const cell = Math.min(c.w / cols, (c.y + c.h - top - 8) / rows);
      const x0 = c.x + (c.w - cell * cols) / 2;
      const y0 = top + 4;
      const w = c.weight * 1.8;
      line(c, x0 + cell, y0, x0 + cols * cell, y0, w);
      line(c, x0, y0 + rows * cell, x0 + (cols - 1) * cell, y0 + rows * cell, w);
      line(c, x0, y0, x0, y0 + rows * cell, w); line(c, x0 + cols * cell, y0, x0 + cols * cell, y0 + rows * cell, w);
      for (let y = 0; y < rows; y += 1) for (let x = 0; x < cols; x += 1) {
        if (m.right[y]![x]! && x < cols - 1) line(c, x0 + (x + 1) * cell, y0 + y * cell, x0 + (x + 1) * cell, y0 + (y + 1) * cell, w);
        if (m.down[y]![x]! && y < rows - 1) line(c, x0 + x * cell, y0 + (y + 1) * cell, x0 + (x + 1) * cell, y0 + (y + 1) * cell, w);
      }
      text(c, x0 - 1, y0 + 4, 8, 'START', true, 'end', INK);
      text(c, x0 + cols * cell + 1, y0 + rows * cell - 1, 8, 'END', true, 'start', INK);
      if (showKey) for (let k = 1; k < m.path.length; k += 1) { const [ax, ay] = m.path[k - 1]!; const [bx, by] = m.path[k]!; line(c, x0 + (ax + 0.5) * cell, y0 + (ay + 0.5) * cell, x0 + (bx + 0.5) * cell, y0 + (by + 0.5) * cell, c.weight * 3, '#2a6b2a'); }
    }));
    draw(false);
    if (flag(v, 'answers')) draw(true);
    return sheets;
  },
};

/* ---------- Sudoku ---------- */

function solveCount(grid: number[], n: number, bw: number, bh: number, limit: number): number {
  const cells = n * n;
  const ok = (idx: number, val: number) => {
    const r = Math.floor(idx / n); const col = idx % n;
    for (let k = 0; k < n; k += 1) { if (grid[r * n + k] === val || grid[k * n + col] === val) return false; }
    const br = Math.floor(r / bh) * bh; const bc = Math.floor(col / bw) * bw;
    for (let y = 0; y < bh; y += 1) for (let x = 0; x < bw; x += 1) if (grid[(br + y) * n + bc + x] === val) return false;
    return true;
  };
  let found = 0;
  const go = (): void => {
    if (found >= limit) return;
    let best = -1; let bestOptions: number[] = [];
    for (let i = 0; i < cells; i += 1) {
      if (grid[i] !== 0) continue;
      const options: number[] = [];
      for (let val = 1; val <= n; val += 1) if (ok(i, val)) options.push(val);
      if (options.length === 0) return;
      if (best < 0 || options.length < bestOptions.length) { best = i; bestOptions = options; if (options.length === 1) break; }
    }
    if (best < 0) { found += 1; return; }
    for (const val of bestOptions) { grid[best] = val; go(); grid[best] = 0; if (found >= limit) return; }
  };
  go();
  return found;
}

function makeSudoku(next: () => number, n: number, bw: number, bh: number, clues: number): { puzzle: number[]; solution: number[] } {
  const grid = Array.from({ length: n * n }, () => 0);
  const fillOne = (idx: number): boolean => {
    if (idx === n * n) return true;
    const r = Math.floor(idx / n); const col = idx % n;
    for (const val of shuffle(next, Array.from({ length: n }, (_, k) => k + 1))) {
      let ok = true;
      for (let k = 0; k < n && ok; k += 1) if (grid[r * n + k] === val || grid[k * n + col] === val) ok = false;
      const br = Math.floor(r / bh) * bh; const bc = Math.floor(col / bw) * bw;
      for (let y = 0; y < bh && ok; y += 1) for (let x = 0; x < bw && ok; x += 1) if (grid[(br + y) * n + bc + x] === val) ok = false;
      if (!ok) continue;
      grid[idx] = val;
      if (fillOne(idx + 1)) return true;
      grid[idx] = 0;
    }
    return false;
  };
  fillOne(0);
  const solution = grid.slice();
  const puzzle = grid.slice();
  let left = n * n;
  for (const idx of shuffle(next, Array.from({ length: n * n }, (_, k) => k))) {
    if (left <= clues) break;
    const keep = puzzle[idx]!;
    puzzle[idx] = 0;
    if (solveCount(puzzle.slice(), n, bw, bh, 2) !== 1) puzzle[idx] = keep; else left -= 1;
  }
  return { puzzle, solution };
}

const sudokuSheet: SheetDef = {
  id: 'sudoku-puzzle-printable', label: 'Sudoku', hint: 'Easy to hard, with answers', path: '/sudoku-puzzle-printable', landscape: false,
  fields: [
    { type: 'select', key: 'size', label: 'Grid', options: [{ value: '4', label: '4 x 4 (for young children)' }, { value: '6', label: '6 x 6 (beginners)' }, { value: '9', label: '9 x 9 (classic)' }] },
    { type: 'select', key: 'level', label: 'Difficulty', options: [{ value: 'easy', label: 'Easy: more numbers given' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard: fewer numbers given' }] },
    { type: 'select', key: 'per', label: 'Puzzles on a page', options: [{ value: '1', label: 'One, large' }, { value: '2', label: 'Two' }, { value: '4', label: 'Four, small' }] },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 4, step: 1, unit: 'pages' },
    SEED_FIELD, KEY_FIELD,
  ],
  defaults: { size: '9', level: 'medium', per: '2', pages: 1, seed: 1, answers: true },
  build: (v, common) => {
    const n = clamp(Number(sel(v, 'size', '9')), 4, 9);
    const [bw, bh] = n === 4 ? [2, 2] : n === 6 ? [3, 2] : [3, 3];
    const level = sel(v, 'level', 'medium');
    const ratio = level === 'easy' ? 0.5 : level === 'hard' ? 0.32 : 0.4;
    const clues = Math.round(n * n * ratio);
    const per = clamp(Number(sel(v, 'per', '2')), 1, 4);
    const pages = clamp(num(v, 'pages', 1), 1, 4);
    const next = rng(seedOf(v));
    const all = Array.from({ length: pages * per }, () => makeSudoku(next, n, bw, bh, clues));
    const sheets: Sheet[] = [];
    const draw = (showKey: boolean) => sheets.push(...makePages(common, pages, (c, pi) => {
      const top = header(c, showKey ? 'Sudoku: answers' : 'Sudoku', !showKey);
      const cols = per === 4 ? 2 : 1;
      const rowsOn = Math.ceil(per / cols);
      const bw2 = c.w / cols;
      const bh2 = (c.y + c.h - top) / rowsOn;
      for (let k = 0; k < per; k += 1) {
        const s = all[pi * per + k]!;
        const size = Math.min(bw2 - 12, bh2 - 12, per === 1 ? 150 : 120);
        const cell = size / n;
        const x0 = c.x + (k % cols) * bw2 + (bw2 - size) / 2;
        const y0 = top + Math.floor(k / cols) * bh2 + 4;
        for (let i = 0; i <= n; i += 1) {
          const bold = i % bw === 0; const boldY = i % bh === 0;
          line(c, x0 + i * cell, y0, x0 + i * cell, y0 + size, bold ? c.weight * 2.6 : c.weight * 0.8);
          line(c, x0, y0 + i * cell, x0 + size, y0 + i * cell, boldY ? c.weight * 2.6 : c.weight * 0.8);
        }
        s.puzzle.forEach((val, idx) => {
          const given = val !== 0;
          if (given || showKey) text(c, x0 + (idx % n) * cell + cell / 2, y0 + Math.floor(idx / n) * cell + cell * 0.68, cell * 1.8, String(s.solution[idx]), given, 'middle', given ? INK : '#2a6b2a');
        });
        text(c, x0, y0 + size + 6, 8, `Puzzle ${pi * per + k + 1}`, false, 'start', GREY);
      }
    }));
    draw(false);
    if (flag(v, 'answers')) draw(true);
    return sheets;
  },
};

/* ---------- Handwriting and tracing ---------- */

const tracingSheet: SheetDef = {
  id: 'handwriting-tracing-sheet-printable', label: 'Tracing sheet', hint: 'Letters, numbers and words to trace', path: '/handwriting-tracing-sheet-printable', landscape: false,
  fields: [
    { type: 'list', key: 'rows', label: 'What to trace', hint: 'One line for each row, such as A B C D, 1 2 3 4 5 or a word. Up to 12.', max: 12 },
    { type: 'select', key: 'size', label: 'Letter size', options: [{ value: '30', label: 'Large (age 4 to 5)' }, { value: '22', label: 'Medium' }, { value: '16', label: 'Small' }] },
    { type: 'select', key: 'style', label: 'Rows', options: [{ value: 'trace', label: 'Grey to trace, then a blank row' }, { value: 'trace-only', label: 'Grey to trace only' }, { value: 'blank', label: 'Blank lines only' }] },
    { type: 'toggle', key: 'name', label: 'Name and date lines' },
  ],
  defaults: { rows: 'A B C D E\na b c d e\n1 2 3 4 5\nCat   Dog   Sun', size: '22', style: 'trace', name: true },
  build: (v, common) => {
    const entries = lines(v, 'rows', 12);
    const pt = clamp(Number(sel(v, 'size', '22')), 12, 40);
    const style = sel(v, 'style', 'trace');
    const rowH = pt * 0.5 + 8;
    const perGroup = style === 'trace' ? 2 : 1;
    const source = entries.length > 0 ? entries : [''];
    return makePages(common, Math.max(1, Math.ceil((source.length * perGroup * rowH) / 230)), (c, pi) => {
      const top = header(c, 'Handwriting practice', flag(v, 'name'));
      const slots = Math.max(1, Math.floor((c.y + c.h - top) / rowH));
      const rowsPerPage = Math.max(1, Math.floor(slots / perGroup));
      source.slice(pi * rowsPerPage, (pi + 1) * rowsPerPage).forEach((entry, i) => {
        for (let g = 0; g < perGroup; g += 1) {
          const y = top + (i * perGroup + g) * rowH;
          const base = y + rowH - 3;
          const mid = base - pt * 0.17;
          const upper = base - pt * 0.35;
          line(c, c.x, upper, c.x + c.w, upper, c.weight * 0.7, '#cccccc');
          line(c, c.x, mid, c.x + c.w, mid, c.weight * 0.7, '#cccccc');
          line(c, c.x, base, c.x + c.w, base, c.weight * 1.2);
          const trace = style !== 'blank' && g === 0 && entry;
          if (trace) {
            const unit = entry.length * pt * (c.cw + 0.01) + pt * 0.5;
            const repeats = Math.max(1, Math.floor(c.w / unit));
            for (let r = 0; r < repeats; r += 1) text(c, c.x + 1 + r * unit, base - 0.8, pt, entry, false, 'start', '#c4c4c4');
          }
        }
      });
    });
  },
};

/* ---------- Bingo cards ---------- */

const bingoSheet: SheetDef = {
  id: 'bingo-card-generator-printable', label: 'Bingo cards', hint: 'Cards from your own words', path: '/bingo-card-generator-printable', landscape: false,
  fields: [
    { type: 'text', key: 'title', label: 'Title', placeholder: 'BINGO', max: 24 },
    { type: 'list', key: 'items', label: 'Words, names or things', hint: 'One per line. Use more items than squares so every card is different.', max: 60 },
    { type: 'select', key: 'grid', label: 'Card size', options: [{ value: '3', label: '3 x 3' }, { value: '4', label: '4 x 4' }, { value: '5', label: '5 x 5' }] },
    { type: 'number', key: 'cards', label: 'Different cards', min: 1, max: 30, step: 1, unit: 'cards' },
    { type: 'select', key: 'per', label: 'Cards on a page', options: [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }, { value: '4', label: 'Four' }] },
    { type: 'toggle', key: 'free', label: 'Free space in the middle', hint: 'Only for 3 x 3 and 5 x 5.' },
    SEED_FIELD,
  ],
  defaults: { title: 'BINGO', items: 'Cake\nBalloon\nGift\nCandle\nMusic\nDance\nGames\nSmile\nPhoto\nSong\nParty hat\nSnacks\nJuice\nCard\nRibbon\nFriends\nClap\nCheer\nJoke\nStory\nHug\nBubble\nStar\nCrown\nPuzzle', grid: '5', cards: 4, per: '1', free: true, seed: 1 },
  build: (v, common) => {
    const n = clamp(Number(sel(v, 'grid', '5')), 3, 5);
    const items = lines(v, 'items', 60);
    const cards = clamp(num(v, 'cards', 4), 1, 30);
    const per = clamp(Number(sel(v, 'per', '1')), 1, 4);
    const free = flag(v, 'free') && n % 2 === 1;
    const next = rng(seedOf(v));
    const title = str(v, 'title') || 'BINGO';
    const decks = Array.from({ length: cards }, () => shuffle(next, items));
    return makePages(common, Math.ceil(cards / per), (c, pi) => {
      const cols = per === 4 ? 2 : 1;
      const rowsOn = Math.ceil(per / cols);
      const bw = c.w / cols;
      const bh = c.h / rowsOn;
      for (let k = 0; k < per; k += 1) {
        const idx = pi * per + k;
        if (idx >= cards) break;
        const x = c.x + (k % cols) * bw + 4;
        const y = c.y + Math.floor(k / cols) * bh + 2;
        const w = bw - 8;
        text(c, x + w / 2, y + 10, per === 4 ? 16 : 26, title, true, 'middle', INK);
        const size = Math.min(w, bh - 26);
        const cell = size / n;
        const gx = x + (w - size) / 2;
        const gy = y + 16;
        for (let i = 0; i <= n; i += 1) { line(c, gx + i * cell, gy, gx + i * cell, gy + size, c.weight * 1.4); line(c, gx, gy + i * cell, gx + size, gy + i * cell, c.weight * 1.4); }
        let used = 0;
        for (let i = 0; i < n * n; i += 1) {
          const cx = gx + (i % n) * cell; const cy = gy + Math.floor(i / n) * cell;
          if (free && i === Math.floor((n * n) / 2)) { fitText(c, cx + 1, cy + cell / 2 + 1, cell - 2, cell / 2, 'FREE', Math.min(14, cell * 0.4), true, 'middle'); continue; }
          const label = decks[idx]![used]; used += 1;
          if (label) fitText(c, cx + 1.5, cy + cell / 2 - 1, cell - 3, cell - 3, label, Math.min(14, cell * 0.4), true, 'middle');
        }
        text(c, x + w / 2, gy + size + 6, 7, `Card ${idx + 1}`, false, 'middle', GREY);
      }
    });
  },
};

/* ---------- OMR answer sheet ---------- */

const omrSheet: SheetDef = {
  id: 'omr-answer-sheet-printable', label: 'OMR answer sheet', hint: 'Bubbles for tests and quizzes', path: '/omr-answer-sheet-printable', landscape: false,
  fields: [
    { type: 'text', key: 'title', label: 'Test name', placeholder: 'Unit Test 2: Science', max: 50 },
    { type: 'number', key: 'questions', label: 'Questions', min: 10, max: 100, step: 5, unit: 'questions' },
    { type: 'select', key: 'options', label: 'Choices for each question', options: [{ value: '4', label: 'A to D' }, { value: '5', label: 'A to E' }, { value: '2', label: 'True or False' }] },
    { type: 'select', key: 'roll', label: 'Roll number bubbles', options: [{ value: '0', label: 'None' }, { value: '4', label: '4 digits' }, { value: '6', label: '6 digits' }, { value: '8', label: '8 digits' }] },
    { type: 'number', key: 'pages', label: 'Copies', min: 1, max: 10, step: 1, unit: 'pages' },
  ],
  defaults: { title: '', questions: 50, options: '4', roll: '6', pages: 1 },
  build: (v, common) => {
    const q = clamp(num(v, 'questions', 50), 10, 100);
    const opts = clamp(Number(sel(v, 'options', '4')), 2, 5);
    const rollDigits = clamp(Number(sel(v, 'roll', '6')), 0, 8);
    const labels = opts === 2 ? ['T', 'F'] : ['A', 'B', 'C', 'D', 'E'].slice(0, opts);
    return makePages(common, clamp(num(v, 'pages', 1), 1, 10), (c) => {
      let top = c.y + titleBar(c, str(v, 'title') || 'Answer sheet');
      blank(c, c.x, top + 1, c.w * 0.5, 'Name:'); blank(c, c.x + c.w * 0.54, top + 1, c.w * 0.22, 'Class:'); blank(c, c.x + c.w * 0.79, top + 1, c.w * 0.21, 'Date:');
      top += 12;
      text(c, c.x, top + 4, 7.5, 'Fill each bubble fully with a dark pen or pencil. One answer for each question.', false, 'start', GREY);
      top += 8;
      if (rollDigits > 0) {
        const bx = c.x; const spacing = 7; const by = top + 8;
        text(c, bx, top + 2, 8.5, 'Roll number', true, 'start', INK);
        for (let d = 0; d < rollDigits; d += 1) {
          const cx = bx + 4 + d * spacing * 1.15;
          line(c, cx - 3, by - 3, cx + 3, by - 3, c.weight); line(c, cx - 3, by - 3, cx - 3, by + 0.5, c.weight); line(c, cx + 3, by - 3, cx + 3, by + 0.5, c.weight); line(c, cx - 3, by + 0.5, cx + 3, by + 0.5, c.weight);
          for (let n = 0; n < 10; n += 1) {
            c.items.push({ t: 'ring', x: cx, y: by + 5 + n * 5.4, r: 2, w: c.weight, c: c.color });
            text(c, cx, by + 5 + n * 5.4 + 1, 5.5, String(n), false, 'middle', GREY);
          }
        }
        top += 70;
      }
      const perCol = 25;
      const colsN = Math.ceil(q / perCol);
      const cw = c.w / colsN;
      const gap = opts === 5 ? 7.2 : 8;
      const rh = Math.min(7.4, (c.y + c.h - top - 4) / Math.min(perCol, q));
      for (let i = 0; i < q; i += 1) {
        const col = Math.floor(i / perCol); const row = i % perCol;
        const x = c.x + col * cw; const y = top + row * rh + 4;
        text(c, x + 6, y + 1, 7.5, String(i + 1), true, 'end', INK);
        labels.forEach((lab, k) => {
          const cx = x + 12 + k * gap;
          c.items.push({ t: 'ring', x: cx, y, r: 2.4, w: c.weight, c: c.color });
          text(c, cx, y + 1, 5.5, lab, false, 'middle', GREY);
        });
      }
    });
  },
};

/* ---------- Rangoli and kolam dot grids ---------- */

function rangoliDots(pattern: string, n: number): [number, number][] {
  const pts: [number, number][] = [];
  if (pattern === 'square') { for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) pts.push([x, y]); }
  else if (pattern === 'triangle') { for (let y = 0; y < n; y += 1) for (let x = 0; x <= y; x += 1) pts.push([x - y / 2, y]); }
  else if (pattern === 'staggered') { for (let y = 0; y < n; y += 1) { const count = y % 2 === 0 ? n : n - 1; for (let x = 0; x < count; x += 1) pts.push([x + (y % 2 === 0 ? 0 : 0.5), y]); } }
  else if (pattern === 'hexagon') { const half = Math.floor(n / 2); for (let y = 0; y < n; y += 1) { const count = n - Math.abs(y - half); for (let x = 0; x < count; x += 1) pts.push([x - count / 2, y]); } }
  else { const mid = Math.floor(n / 2); for (let y = 0; y < n; y += 1) { const count = n - Math.abs(y - mid) * 2; if (count < 1) continue; for (let x = 0; x < count; x += 1) pts.push([x - (count - 1) / 2, y]); } }
  return pts;
}

const rangoliSheet: SheetDef = {
  id: 'rangoli-dot-grid-printable', label: 'Rangoli dot grids', hint: 'Dot patterns to join', path: '/rangoli-dot-grid-printable', landscape: false,
  fields: [
    { type: 'select', key: 'pattern', label: 'Pattern', options: [{ value: 'diamond', label: 'Diamond (1, 3, 5, 7, 5, 3, 1 dots)' }, { value: 'square', label: 'Square' }, { value: 'triangle', label: 'Triangle' }, { value: 'staggered', label: 'Staggered rows (kolam style)' }, { value: 'hexagon', label: 'Hexagon' }] },
    { type: 'number', key: 'size', label: 'Size (dots in the middle row)', min: 3, max: 15, step: 2, unit: 'dots' },
    { type: 'select', key: 'per', label: 'Grids on a page', options: [{ value: '1', label: 'One, large' }, { value: '2', label: 'Two' }, { value: '4', label: 'Four, small' }, { value: '6', label: 'Six, practice' }] },
    { type: 'select', key: 'dot', label: 'Dot size', options: [{ value: '0.6', label: 'Fine' }, { value: '0.9', label: 'Medium' }, { value: '1.3', label: 'Bold' }] },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 6, step: 1, unit: 'pages' },
  ],
  defaults: { pattern: 'diamond', size: 7, per: '2', dot: '0.9', pages: 1 },
  build: (v, common) => {
    const n = clamp(num(v, 'size', 7), 3, 15);
    const per = clamp(Number(sel(v, 'per', '2')), 1, 6);
    const dots = rangoliDots(sel(v, 'pattern', 'diamond'), n);
    const r = Number(sel(v, 'dot', '0.9')) || 0.9;
    const cols = per === 1 ? 1 : per === 6 ? 2 : per === 4 ? 2 : 1;
    const rowsOn = Math.ceil(per / cols);
    return makePages(common, clamp(num(v, 'pages', 1), 1, 6), (c) => {
      const bw = c.w / cols; const bh = c.h / rowsOn;
      const minX = Math.min(...dots.map((d) => d[0])); const maxX = Math.max(...dots.map((d) => d[0]));
      for (let k = 0; k < per; k += 1) {
        const x0 = c.x + (k % cols) * bw; const y0 = c.y + Math.floor(k / cols) * bh;
        const step = Math.min((bw - 16) / Math.max(1, maxX - minX), (bh - 16) / Math.max(1, n - 1), 22);
        const ox = x0 + bw / 2 - ((minX + maxX) / 2) * step; const oy = y0 + (bh - step * (n - 1)) / 2;
        dots.forEach(([dx, dy]) => c.items.push({ t: 'dot', x: ox + dx * step, y: oy + dy * step, r, c: c.color }));
      }
    });
  },
};

/* ---------- Recipe cards ---------- */

const recipeSheet: SheetDef = {
  id: 'recipe-card-printable', label: 'Recipe card', hint: 'Full page, half or quarter', path: '/recipe-card-printable', landscape: false,
  fields: [
    { type: 'text', key: 'dish', label: 'Dish name (optional)', placeholder: 'Rajma Chawal', max: 40 },
    { type: 'select', key: 'size', label: 'Card size', options: [{ value: '1', label: 'Full page' }, { value: '2', label: 'Two on a page' }, { value: '4', label: 'Four on a page (small cards)' }] },
    { type: 'select', key: 'layout', label: 'Layout', options: [{ value: 'side', label: 'Ingredients beside the method' }, { value: 'stack', label: 'Ingredients above the method' }] },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 12, step: 1, unit: 'pages' },
  ],
  defaults: { dish: '', size: '2', layout: 'side', pages: 1 },
  build: (v, common) => {
    const per = clamp(Number(sel(v, 'size', '2')), 1, 4);
    const side = sel(v, 'layout', 'side') === 'side';
    return makePages(common, clamp(num(v, 'pages', 1), 1, 12), (c) => {
      const cols = per === 4 ? 2 : 1;
      const rowsOn = Math.ceil(per / cols);
      const bw = c.w / cols; const bh = c.h / rowsOn;
      for (let k = 0; k < per; k += 1) {
        const x = c.x + (k % cols) * bw + 2; const y = c.y + Math.floor(k / cols) * bh + 2; const w = bw - 4; const h = bh - 4;
        line(c, x, y, x + w, y, c.weight * 1.6); line(c, x, y + h, x + w, y + h, c.weight * 1.6); line(c, x, y, x, y + h, c.weight * 1.6); line(c, x + w, y, x + w, y + h, c.weight * 1.6);
        const big = per === 4 ? 11 : 16;
        if (str(v, 'dish')) fitText(c, x + 3, y + big * 0.45 + 3, w - 6, big, str(v, 'dish'), big, true); else { text(c, x + 3, y + big * 0.45 + 3, 8, 'Dish:', true, 'start', INK); line(c, x + 14, y + big * 0.45 + 3.6, x + w - 3, y + big * 0.45 + 3.6, c.weight * 0.9); }
        if (common.heading.trim()) text(c, x + w - 3, y + big * 0.45 + 3, 7, common.heading.trim(), false, 'end', GREY);
        const meta = y + big * 0.45 + 11;
        const labels = ['Serves:', 'Prep time:', 'Cook time:'];
        labels.forEach((lab, i) => { const mx = x + 3 + (i * (w - 6)) / 3; text(c, mx, meta, 7, lab, true, 'start', INK); line(c, mx + lab.length * 1.5 + 2, meta + 0.7, mx + (w - 6) / 3 - 3, meta + 0.7, c.weight * 0.8); });
        const bodyTop = meta + 5; const step = per === 4 ? 6.2 : 7.2;
        if (side) {
          const split = x + w * 0.38;
          text(c, x + 3, bodyTop + 3, 8, 'Ingredients', true, 'start', INK); text(c, split + 3, bodyTop + 3, 8, 'Method', true, 'start', INK);
          line(c, split, bodyTop, split, y + h - 2, c.weight);
          for (let ly = bodyTop + 4 + step; ly < y + h - 2; ly += step) { line(c, x + 3, ly, split - 3, ly, c.weight * 0.7, '#999999'); line(c, split + 3, ly, x + w - 3, ly, c.weight * 0.7, '#999999'); }
        } else {
          const mid = bodyTop + (y + h - bodyTop) * 0.4;
          text(c, x + 3, bodyTop + 3, 8, 'Ingredients', true, 'start', INK); text(c, x + 3, mid + 3, 8, 'Method', true, 'start', INK);
          for (let ly = bodyTop + 4 + step; ly < mid - 1; ly += step) line(c, x + 3, ly, x + w - 3, ly, c.weight * 0.7, '#999999');
          for (let ly = mid + 4 + step; ly < y + h - 2; ly += step) line(c, x + 3, ly, x + w - 3, ly, c.weight * 0.7, '#999999');
        }
      }
    });
  },
};

export const PLAY_FAMILY: Family = {
  key: 'play',
  headingLabel: 'Name or title',
  headingPlaceholder: 'Aarav, Class 3  or  Diwali party',
  note: 'These sheets are made in your browser from the choices you type. Puzzles are made fresh from the puzzle number, so you can print the same one again.',
  sheets: [mathSheet, tablesSheet, wordSearchSheet, mazeSheet, sudokuSheet, tracingSheet, bingoSheet, omrSheet, rangoliSheet, recipeSheet],
};

