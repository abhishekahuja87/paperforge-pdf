/**
 * Picture steps for column addition (carrying) and column subtraction (borrowing).
 * Column 0 is the ones, 1 the tens, 2 the hundreds. A token is one block of that column:
 * a dot for ones, a rod for tens and a flat square for hundreds.
 */
export type Op = 'add' | 'sub';

/** A question the child answers in "You try" before this step is shown. */
export interface Ask {
  /** For example "8 + 7 = ?". */
  prompt: string;
  /** One label per box when there is more than one, for example "write" and "carry". */
  labels?: string[];
  /** The right number for each box. */
  answers: number[];
}

export interface Frame {
  op: Op;
  cols: number;
  /** Tokens in the top number's cells. In subtraction this changes as tens and hundreds are broken. */
  a: number[];
  /** Tokens in the second number's cells. */
  b: number[];
  /** Addition: carried tokens above each column. */
  carry: number[];
  /** Tokens in each answer cell. */
  ans: number[];
  /** The answer digit once a column is finished. */
  ansDigits: (number | null)[];
  /** Column being worked on, or -1. */
  col: number;
  /** Addition: ring ten tokens in this column's answer cell. */
  group: boolean;
  /** Addition: show the carry arrow from this column to the next. */
  carryArrow: boolean;
  /** Subtraction: how many tokens at the end of each top cell just arrived from a broken block. */
  fresh: number[];
  /** Subtraction: the column whose last token is being broken, or -1. */
  breaking: number;
  /** Subtraction: tokens crossed out at the end of each top cell. */
  crossed: number[];
  /** The last picture. */
  done: boolean;
  /** In "You try" the child answers this before the step appears. */
  ask?: Ask;
  /** The working for this step, in numbers: for example "7 + 5 = 12" or "Write 2, carry 1". */
  line: string;
  /** For screen readers. */
  caption: string;
}

export const COLUMN_NAMES = ['ones', 'tens', 'hundreds'];

export const digitsOf = (value: number, cols: number): number[] =>
  Array.from({ length: cols }, (_, i) => Math.floor(value / 10 ** i) % 10);

const zeros = (n: number) => Array.from({ length: n }, () => 0);

export const columnsFor = (op: Op, x: number, y: number) => Math.min(3, Math.max(String(x).length, String(y).length, String(op === 'add' ? x + y : x - y).length));

export function addFrames(x: number, y: number): Frame[] {
  const cols = columnsFor('add', x, y);
  const A = digitsOf(x, cols);
  const B = digitsOf(y, cols);
  const ans = zeros(cols);
  const carry = zeros(cols);
  const ansDigits: (number | null)[] = Array.from({ length: cols }, () => null);
  const frames: Frame[] = [];
  const push = (patch: Partial<Frame>, caption: string, line = '') =>
    frames.push({ op: 'add', cols, a: A, b: B, carry: [...carry], ans: [...ans], ansDigits: [...ansDigits], col: -1, group: false, carryArrow: false, fresh: zeros(cols), breaking: -1, crossed: zeros(cols), done: false, caption, line, ...patch });

  push({}, `${x} plus ${y}.`, `Add the ${COLUMN_NAMES[0]} first`);
  let carryIn = 0;
  for (let c = 0; c < cols; c += 1) {
    const total = A[c] + B[c] + carryIn;
    ans[c] = total;
    const sum = `${carryIn ? '1 + ' : ''}${A[c]} + ${B[c]} = ${total}`;
    if (total < 10) {
      ansDigits[c] = total;
      push({ col: c, ask: { prompt: sum.replace(/= \d+$/, '= ?'), answers: [total] } }, `${COLUMN_NAMES[c]}: ${A[c]} and ${B[c]}${carryIn ? ' and the carried one' : ''} make ${total}.`, sum);
      carryIn = 0;
      continue;
    }
    push({ col: c, ask: { prompt: sum.replace(/= \d+$/, '= ?'), answers: [total] } }, `${COLUMN_NAMES[c]}: ${A[c]} and ${B[c]}${carryIn ? ' and the carried one' : ''} make ${total}.`, sum);
    const carried = total - 10;
    push({ col: c, group: true }, `Ten of them make a group.`, `${total} = 10 + ${total - 10}`);
    ans[c] = total - 10;
    ansDigits[c] = total - 10;
    if (c + 1 < cols) carry[c + 1] = 1;
    push({ col: c, carryArrow: true, ask: { prompt: `${total}`, labels: ['write', 'carry'], answers: [carried, 1] } }, `The group of ten becomes one ${COLUMN_NAMES[c + 1] ?? 'next'} block, carried to the next column.`, `Write ${total - 10}, carry 1`);
    carryIn = 1;
  }
  push({ done: true }, `${x} plus ${y} is ${x + y}.`, `${x} + ${y} = ${x + y}`);
  return frames;
}

export function subFrames(x: number, y: number): Frame[] {
  const cols = columnsFor('sub', x, y);
  const B = digitsOf(y, cols);
  const d = digitsOf(x, cols);
  const ans = zeros(cols);
  const crossed = zeros(cols);
  const ansDigits: (number | null)[] = Array.from({ length: cols }, () => null);
  const frames: Frame[] = [];
  const push = (patch: Partial<Frame>, caption: string, line = '') =>
    frames.push({ op: 'sub', cols, a: [...d], b: B, carry: zeros(cols), ans: [...ans], ansDigits: [...ansDigits], col: -1, group: false, carryArrow: false, fresh: zeros(cols), breaking: -1, crossed: [...crossed], done: false, caption, line, ...patch });

  push({}, `${x} minus ${y}.`, `Take away the ${COLUMN_NAMES[0]} first`);
  for (let c = 0; c < cols; c += 1) {
    if (d[c] < B[c]) {
      let j = c + 1;
      while (j < cols && d[j] === 0) j += 1;
      for (let k = j; k > c; k -= 1) {
        push({ col: c, breaking: k }, `Not enough ${COLUMN_NAMES[c]}. Break one ${COLUMN_NAMES[k]} block.`, `${d[c]} is too small for ${B[c]}. Borrow from the ${d[k]}`);
        const before = [d[k], d[k - 1]];
        d[k] -= 1;
        d[k - 1] += 10;
        const fresh = zeros(cols);
        fresh[k - 1] = 10;
        push({ col: c, fresh, ask: { prompt: 'Borrow', labels: [`${before[0]} becomes`, `${before[1]} becomes`], answers: [d[k], d[k - 1]] } }, `It becomes ten ${COLUMN_NAMES[k - 1]} blocks.`, `${before[0]} \u2192 ${d[k]}   and   ${before[1]} \u2192 ${d[k - 1]}`);
      }
    }
    if (B[c] > 0) {
      crossed[c] = B[c];
      push({ col: c, ask: { prompt: `${d[c]} \u2212 ${B[c]} = ?`, answers: [d[c] - B[c]] } }, `Take away ${B[c]} ${COLUMN_NAMES[c]}.`, `${d[c]} \u2212 ${B[c]} = ?`);
    }
    ans[c] = d[c] - B[c];
    ansDigits[c] = d[c] - B[c];
    push({ col: c }, `${d[c] - B[c]} ${COLUMN_NAMES[c]} left.`, `${d[c]} \u2212 ${B[c]} = ${d[c] - B[c]}`);
  }
  push({ done: true }, `${x} minus ${y} is ${x - y}.`, `${x} \u2212 ${y} = ${x - y}`);
  return frames;
}

export const makeFrames = (op: Op, x: number, y: number): Frame[] => (op === 'add' ? addFrames(x, y) : subFrames(x, y));

export interface Example { op: Op; x: number; y: number }

/** Worked examples, from no carry or borrow to carrying twice and borrowing across a zero. */
export const EXAMPLES: Example[] = [
  { op: 'add', x: 23, y: 14 }, { op: 'add', x: 27, y: 15 }, { op: 'add', x: 58, y: 67 }, { op: 'add', x: 146, y: 278 }, { op: 'add', x: 365, y: 287 },
  { op: 'sub', x: 48, y: 23 }, { op: 'sub', x: 52, y: 27 }, { op: 'sub', x: 91, y: 58 }, { op: 'sub', x: 421, y: 186 }, { op: 'sub', x: 304, y: 158 },
];

/** Whether the numbers can be shown: at most three digits, and a sum under 1000 or a difference that is not negative. */
export const isValid = (op: Op, x: number, y: number) =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 1 && y >= 1 && x <= 999 && (op === 'add' ? y <= 999 && x + y <= 999 : y <= x);

/** A random example that needs a carry (addition) or a borrow (subtraction). */
export function randomExample(op: Op): Example {
  for (let i = 0; i < 200; i += 1) {
    const x = 10 + Math.floor(Math.random() * 890);
    const y = 5 + Math.floor(Math.random() * 890);
    if (!isValid(op, x, y)) continue;
    const a = digitsOf(x, 3);
    const b = digitsOf(y, 3);
    const needs = op === 'add' ? a.some((v, k) => v + b[k] >= 10) : a.some((v, k) => v < b[k]);
    if (needs) return { op, x, y };
  }
  return op === 'add' ? { op, x: 27, y: 15 } : { op, x: 52, y: 27 };
}
