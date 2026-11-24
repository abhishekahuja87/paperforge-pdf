/** Quick scoreboard for games where points are added a few at a time. Plain logic, no React. */

export type Side = 0 | 1;
export interface Entry { side: Side; points: number }

export interface QuickGame {
  id: string;
  label: string;
  /** Buttons that add points. */
  buttons: number[];
  /** Names of the periods, such as quarters or halves. */
  periods: string[];
  /** Show a foul counter for each side. */
  fouls: boolean;
  /** Short help shown under the buttons. */
  help: string;
}

export const QUICK_GAMES: QuickGame[] = [
  { id: 'basketball', label: 'Basketball', buttons: [1, 2, 3], periods: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'], fouls: true, help: '1 for a free throw, 2 for a shot, 3 for a shot from outside the arc.' },
  { id: 'football', label: 'Football', buttons: [1], periods: ['1st half', '2nd half', 'Extra time', 'Penalties'], fouls: false, help: 'Tap +1 for each goal.' },
  { id: 'hockey', label: 'Hockey', buttons: [1], periods: ['Q1', 'Q2', 'Q3', 'Q4', 'Extra time'], fouls: false, help: 'Tap +1 for each goal.' },
  { id: 'kabaddi', label: 'Kabaddi', buttons: [1, 2], periods: ['1st half', '2nd half', 'Extra time'], fouls: false, help: '1 for each touch, tackle or bonus point, 2 for an All Out or a super tackle.' },
  { id: 'handball', label: 'Handball', buttons: [1], periods: ['1st half', '2nd half', 'Extra time'], fouls: false, help: 'Tap +1 for each goal.' },
  { id: 'any', label: 'Any other game', buttons: [1, 2, 3, 5], periods: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'], fouls: false, help: 'Add any score. Use Undo for a mistake.' },
];

export const gameInfo = (id: string): QuickGame => QUICK_GAMES.find((game) => game.id === id) ?? QUICK_GAMES[0];

export const totals = (log: Entry[]): [number, number] => {
  const sum: [number, number] = [0, 0];
  for (const entry of log) sum[entry.side] += entry.points;
  return sum;
};

/** The leader, or null when level. */
export const leader = (score: [number, number]): Side | null => (score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1);

/** 125 -> "02:05", 3725 -> "1:02:05". Time is in whole seconds. */
export function clockText(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${two(m)}:${two(sec)}`;
}

/** Elapsed seconds of a stopwatch that may be running: time banked before, plus time since it was started. */
export const elapsed = (banked: number, startedAt: number | null, now: number): number => banked + (startedAt === null ? 0 : Math.max(0, (now - startedAt) / 1000));
