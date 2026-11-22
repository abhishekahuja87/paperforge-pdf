import { shuffled } from '../toolkit/pick';

/** Classroom seating plan logic. A plan is a grid of seats; each seat holds a name or is empty ('' ). */
export type SeatMode = 'listed' | 'shuffled' | 'alphabetical';

export function seatNames(names: readonly string[], mode: SeatMode): string[] {
  if (mode === 'shuffled') return shuffled(names);
  if (mode === 'alphabetical') return [...names].sort((a, b) => a.localeCompare(b));
  return [...names];
}

/** Fills rows left to right; the last row may have empty seats. Seats are numbered from the front row. */
export function seatGrid(names: readonly string[], columns: number): string[][] {
  const width = Math.max(1, Math.min(12, Math.floor(columns)));
  const rows: string[][] = [];
  for (let start = 0; start < names.length; start += width) {
    const row = names.slice(start, start + width);
    while (row.length < width) row.push('');
    rows.push(row);
  }
  return rows;
}

/** Swaps two seats and returns a new grid. */
export function swapSeats(grid: readonly string[][], a: [number, number], b: [number, number]): string[][] {
  const copy = grid.map((row) => [...row]);
  const first = copy[a[0]]?.[a[1]];
  const second = copy[b[0]]?.[b[1]];
  if (first === undefined || second === undefined) return copy;
  copy[a[0]]![a[1]] = second;
  copy[b[0]]![b[1]] = first;
  return copy;
}

/** A plain text plan, one line per row. */
export function seatText(grid: readonly string[][]): string {
  return grid.map((row, index) => `Row ${index + 1}: ${row.map((name) => name || '—').join(' | ')}`).join('\n');
}
