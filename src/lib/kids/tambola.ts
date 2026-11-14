/**
 * Tambola (housie) tickets and calls.
 *
 * A book is 6 tickets that together use every number from 1 to 90 exactly once, as in a printed tambola book.
 * Each ticket has 3 rows and 9 columns; every row has 5 numbers and 4 blanks, every column holds numbers from its
 * own band (1-9, 10-19, ... 80-90) in rising order, and every column of every ticket has at least one number.
 */

export type TambolaTicket = (number | null)[][];

const ROWS = 3;
const COLS = 9;
const TICKETS = 6;
const COLUMN_SIZE = [9, 10, 10, 10, 10, 10, 10, 10, 11];

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** How many numbers each ticket takes from each column: 1 to 3 each, 15 per ticket, column totals as above. */
function columnCounts(): number[][] | null {
  const counts = Array.from({ length: TICKETS }, () => Array<number>(COLS).fill(1));
  const rowExtra = Array<number>(TICKETS).fill(6);
  for (let c = 0; c < COLS; c += 1) {
    let extras = COLUMN_SIZE[c] - TICKETS;
    const order = shuffle(Array.from({ length: TICKETS }, (_, t) => t));
    // Give extras to the tickets that still need the most, at most two extra in a column per ticket.
    for (let round = 0; round < 2 && extras > 0; round += 1) {
      order.sort((a, b) => rowExtra[b] - rowExtra[a] || Math.random() - 0.5);
      for (const t of order) {
        if (extras === 0) break;
        if (rowExtra[t] > 0 && counts[t][c] < 1 + (round + 1)) { counts[t][c] += 1; rowExtra[t] -= 1; extras -= 1; }
      }
    }
    if (extras > 0) return null;
  }
  return rowExtra.every((left) => left === 0) ? counts : null;
}

/** Chooses which rows each column's numbers sit in, so that every row has exactly five. */
function placeRows(counts: number[]): number[][] | null {
  const rowTotals = [0, 0, 0];
  const chosen: number[][] = Array.from({ length: COLS }, () => []);
  const options = (n: number): number[][] => (n === 1 ? [[0], [1], [2]] : n === 2 ? [[0, 1], [0, 2], [1, 2]] : [[0, 1, 2]]);
  const order = shuffle(Array.from({ length: COLS }, (_, c) => c));
  const go = (index: number): boolean => {
    if (index === COLS) return rowTotals.every((total) => total === 5);
    const c = order[index];
    for (const rows of shuffle(options(counts[c]))) {
      if (rows.some((r) => rowTotals[r] >= 5)) continue;
      rows.forEach((r) => { rowTotals[r] += 1; });
      chosen[c] = rows;
      if (go(index + 1)) return true;
      rows.forEach((r) => { rowTotals[r] -= 1; });
    }
    return false;
  };
  return go(0) ? chosen : null;
}

export function makeBook(): TambolaTicket[] {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const counts = columnCounts();
    if (!counts) continue;
    const layouts = counts.map((row) => placeRows(row));
    if (layouts.some((layout) => layout === null)) continue;
    const tickets: TambolaTicket[] = Array.from({ length: TICKETS }, () => Array.from({ length: ROWS }, () => Array<number | null>(COLS).fill(null)));
    for (let c = 0; c < COLS; c += 1) {
      const low = c === 0 ? 1 : c * 10;
      const high = c === 8 ? 90 : c * 10 + 9;
      const pool = shuffle(Array.from({ length: high - low + 1 }, (_, i) => low + i));
      for (let t = 0; t < TICKETS; t += 1) {
        const take = pool.splice(0, counts[t][c]).sort((a, b) => a - b);
        (layouts[t] as number[][])[c].slice().sort((a, b) => a - b).forEach((row, i) => { tickets[t][row][c] = take[i]; });
      }
    }
    return tickets;
  }
  throw new Error('Could not make a tambola book');
}

/** Family-friendly traditional calls for some numbers. */
export const NICKNAMES: Record<number, string> = {
  1: 'Kelly’s eye', 2: 'One little duck', 3: 'Cup of tea', 4: 'Knock at the door', 5: 'Man alive', 6: 'Tom Mix', 7: 'Lucky seven', 8: 'Garden gate',
  9: 'Doctor’s orders', 10: 'Top of the class', 11: 'Legs eleven', 12: 'One dozen', 13: 'Unlucky for some', 14: 'Valentine’s day', 15: 'Young and keen',
  16: 'Sweet sixteen', 17: 'Dancing queen', 18: 'Coming of age', 19: 'Goodbye teens', 20: 'One score', 21: 'Key of the door', 22: 'Two little ducks',
  24: 'Two dozen', 25: 'Duck and dive', 27: 'Gateway to heaven', 29: 'Rise and shine', 33: 'All the threes', 44: 'All the fours', 45: 'Halfway there',
  50: 'Half a century', 55: 'Snakes alive', 57: 'Heinz varieties', 60: 'Five dozen', 66: 'Clickety click', 72: 'Six dozen', 77: 'Sunset strip',
  88: 'Double eight', 90: 'Top of the shop',
};

/** "Fifty-four. Five, four." for the speaker and the screen reader. */
export function spokenNumber(n: number): string {
  const nick = NICKNAMES[n];
  const digits = String(n).split('').join(', ');
  return `${nick ? `${nick}. ` : ''}${n}. ${n > 9 ? digits : ''}`.trim();
}
