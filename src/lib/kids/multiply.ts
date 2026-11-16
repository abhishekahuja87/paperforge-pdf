import type { Ask } from './placeValue';

/**
 * Picture steps for column multiplication. Column 0 is the ones. The second number is multiplied one digit at a
 * time, each time giving a row. With two digits, the second row starts with a 0 and the rows are added at the end.
 */
export interface MulFrame {
  cols: number;
  /** Carried number shown above each digit of the first number. */
  carry: (number | null)[];
  /** The rows written so far, one digit per column; null means empty. */
  rows: (number | null)[][];
  /** The digits of the answer once the rows are added. */
  product: (number | null)[];
  /** The digit of the first number and of the second number being used, or -1. */
  activeX: number;
  activeY: number;
  /** The row being written, or -1. */
  activeRow: number;
  done: boolean;
  line: string;
  caption: string;
  ask?: Ask;
}

export const digitsOf = (value: number): number[] => String(value).split('').reverse().map(Number);

/** At most three digits times at most two digits, with a product under 100000. */
export const isValidMul = (x: number, y: number) => Number.isInteger(x) && Number.isInteger(y) && x >= 2 && x <= 999 && y >= 2 && y <= 99;

export const mulFrames = (x: number, y: number): MulFrame[] => {
  const xs = digitsOf(x);
  const ys = digitsOf(y);
  const product = x * y;
  const cols = Math.max(xs.length, ys.length, String(product).length);
  const empty = () => Array.from({ length: cols }, () => null as number | null);
  const rows: (number | null)[][] = ys.map(() => empty());
  const carry = empty();
  const out = empty();
  const frames: MulFrame[] = [];
  const push = (patch: Partial<MulFrame>, caption: string, line = '') =>
    frames.push({ cols, carry: [...carry], rows: rows.map((row) => [...row]), product: [...out], activeX: -1, activeY: -1, activeRow: -1, done: false, caption, line, ...patch });

  push({}, `${x} times ${y}.`, ys.length === 1 ? `Multiply each digit by ${y}` : 'Multiply by the ones, then the tens');
  for (let j = 0; j < ys.length; j += 1) {
    const yd = ys[j];
    for (let k = 0; k < j; k += 1) rows[j][k] = 0;
    if (j > 0) push({ activeY: j, activeRow: j }, `Second row: start with a zero because we are multiplying by tens.`, 'Start with a 0');
    if (yd === 0) {
      for (let i = 0; i < xs.length; i += 1) rows[j][i + j] = 0;
      push({ activeY: j, activeRow: j }, `Anything times zero is zero.`, `${x} × 0 = 0`);
      continue;
    }
    let carryIn = 0;
    for (let i = 0; i < xs.length; i += 1) {
      const total = xs[i] * yd + carryIn;
      const sum = `${xs[i]} × ${yd}${carryIn ? ` + ${carryIn}` : ''} = ${total}`;
      const prompt = sum.replace(/= \d+$/, '= ?');
      const column = i + j;
      const lastDigit = i === xs.length - 1;
      carry[i] = carryIn > 0 ? carryIn : null;
      if (total < 10) {
        rows[j][column] = total;
        push({ activeX: i, activeY: j, activeRow: j, ask: { prompt, answers: [total] } }, `${xs[i]} times ${yd}${carryIn ? ` plus ${carryIn}` : ''} is ${total}.`, sum);
        carryIn = 0;
        continue;
      }
      push({ activeX: i, activeY: j, activeRow: j, ask: { prompt, answers: [total] } }, `${xs[i]} times ${yd}${carryIn ? ` plus ${carryIn}` : ''} is ${total}.`, sum);
      const tens = Math.floor(total / 10);
      rows[j][column] = total % 10;
      if (lastDigit) {
        rows[j][column + 1] = tens;
        push({ activeX: i, activeY: j, activeRow: j }, `Write both digits of ${total}.`, `Write ${total}`);
        carryIn = 0;
      } else {
        carry[i + 1] = tens;
        push({ activeX: i, activeY: j, activeRow: j, ask: { prompt: `${total}`, labels: ['write', 'carry'], answers: [total % 10, tens] } }, `Write ${total % 10} and carry ${tens}.`, `Write ${total % 10}, carry ${tens}`);
        carryIn = tens;
      }
    }
    carry.fill(null);
    if (j < ys.length - 1) push({ activeY: j, activeRow: j }, `That row is done.`, `${x} \u00d7 ${yd} = ${x * yd}`);
  }

  if (ys.length > 1) {
    const rowValues = ys.map((digit, j) => x * digit * 10 ** j);
    const prompt = `${rowValues.join(' + ')} = ?`;
    push({ ask: { prompt, answers: [product] } }, `Add the rows.`, `${rowValues.join(' + ')} = ${product}`);
  }
  digitsOf(product).forEach((digit, c) => { out[c] = digit; });
  push({ done: true }, `${x} times ${y} is ${product}.`, `${x} × ${y} = ${product}`);
  return frames;
};

export interface MulExample { x: number; y: number }

export const MUL_EXAMPLES: MulExample[] = [
  { x: 23, y: 4 }, { x: 47, y: 6 }, { x: 156, y: 7 }, { x: 34, y: 12 }, { x: 46, y: 23 },
];

/** A random sum that needs a carry. */
export function randomMul(): MulExample {
  for (let i = 0; i < 200; i += 1) {
    const twoDigit = Math.random() < 0.4;
    const x = twoDigit ? 12 + Math.floor(Math.random() * 88) : 12 + Math.floor(Math.random() * 400);
    const y = twoDigit ? 11 + Math.floor(Math.random() * 40) : 3 + Math.floor(Math.random() * 7);
    if (!isValidMul(x, y)) continue;
    if (digitsOf(x).some((digit) => digit * (y % 10) >= 10)) return { x, y };
  }
  return { x: 47, y: 6 };
}
