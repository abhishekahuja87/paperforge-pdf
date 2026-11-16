import type { Ask } from './placeValue';

/**
 * Picture steps for long division by a one-digit number (the "bus stop" method).
 * Each round is: divide, multiply, subtract, then bring down the next digit.
 * Columns count from the left of the dividend.
 */
export interface DivRow {
  text: string;
  /** The column the last digit of this number sits under. */
  endCol: number;
  kind: 'product' | 'rem' | 'current';
}

export interface DivFrame {
  /** Digits in the number being divided. */
  n: number;
  /** The answer digits written above the number, one per column. */
  q: (number | null)[];
  rows: DivRow[];
  /** Columns of the number being divided that are in use, or -1. */
  hiFrom: number;
  hiTo: number;
  /** What is left over at the end, shown after the answer. */
  remainder: number | null;
  done: boolean;
  line: string;
  caption: string;
  ask?: Ask;
}

/** A number of at least 10 and at most 999, divided by a single digit from 2 to 9. */
export const isValidDiv = (x: number, y: number) => Number.isInteger(x) && Number.isInteger(y) && x >= 10 && x <= 999 && y >= 2 && y <= 9;

export const divFrames = (x: number, y: number): DivFrame[] => {
  const digits = String(x).split('').map(Number);
  const n = digits.length;
  const q: (number | null)[] = Array.from({ length: n }, () => null);
  let rows: DivRow[] = [];
  const frames: DivFrame[] = [];
  const push = (patch: Partial<DivFrame>, caption: string, line = '') =>
    frames.push({ n, q: [...q], rows: rows.map((row) => ({ ...row })), hiFrom: -1, hiTo: -1, remainder: null, done: false, caption, line, ...patch });

  // The first round uses as many digits from the left as it takes to reach the divisor.
  let start = 0;
  while (Number(digits.slice(0, start + 1).join('')) < y) start += 1;
  push({}, `${x} divided by ${y}.`, start > 0 ? `${digits.slice(0, start).join('')} is too small, so start with ${digits.slice(0, start + 1).join('')}` : `How many ${y}s are in ${x}?`);

  let rem = 0;
  for (let i = start; i < n; i += 1) {
    const current = i === start ? Number(digits.slice(0, start + 1).join('')) : rem * 10 + digits[i];
    const from = i === start ? 0 : i;
    if (i > start) {
      rows = rows.map((row, k) => (k === rows.length - 1 ? { text: String(current), endCol: i, kind: 'current' as const } : row));
      push({ hiFrom: from, hiTo: i }, `Bring down the ${digits[i]}.`, `Bring down the ${digits[i]}`);
    }
    const times = Math.floor(current / y);
    const product = times * y;
    q[i] = times;
    push({ hiFrom: from, hiTo: i, ask: { prompt: `How many ${y}s in ${current}?`, answers: [times] } }, `${y} goes into ${current} ${times} times.`, `${y} goes into ${current}, ${times} ${times === 1 ? 'time' : 'times'}`);
    rows.push({ text: String(product), endCol: i, kind: 'product' });
    push({ hiFrom: from, hiTo: i, ask: { prompt: `${times} × ${y} = ?`, answers: [product] } }, `${times} times ${y} is ${product}.`, `${times} × ${y} = ${product}`);
    rem = current - product;
    rows.push({ text: String(rem), endCol: i, kind: 'rem' });
    push({ hiFrom: from, hiTo: i, ask: { prompt: `${current} − ${product} = ?`, answers: [rem] } }, `${current} minus ${product} leaves ${rem}.`, `${current} − ${product} = ${rem}`);
  }
  const whole = Math.floor(x / y);
  push({ done: true, remainder: rem }, `${x} divided by ${y} is ${whole}${rem ? ` with ${rem} left over` : ''}.`, `${x} ÷ ${y} = ${whole}${rem ? `, ${rem} left over` : ''}`);
  return frames;
};

export const divResult = (x: number, y: number) => `${Math.floor(x / y)}${x % y ? ` r ${x % y}` : ''}`;

export const DIV_EXAMPLES = [{ x: 84, y: 4 }, { x: 85, y: 4 }, { x: 156, y: 6 }, { x: 612, y: 6 }, { x: 487, y: 5 }];

/** A random sum, often with something left over. */
export function randomDiv() {
  const y = 2 + Math.floor(Math.random() * 8);
  const x = 20 + Math.floor(Math.random() * 780);
  return { x, y };
}
