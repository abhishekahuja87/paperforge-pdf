/** One-rep max estimates and barbell plate loading. Plain maths, no React. */

export type WeightUnit = 'kg' | 'lb';

/** Epley: weight x (1 + reps / 30). Good for sets of about 2 to 10 reps. */
export const epley = (weight: number, reps: number): number => (reps <= 1 ? weight : weight * (1 + reps / 30));

/** Brzycki: weight x 36 / (37 - reps). Not valid at 37 reps or more, and weak above about 12. */
export const brzycki = (weight: number, reps: number): number => (reps <= 1 ? weight : weight * 36 / (37 - reps));

/** The two formulas averaged, which is steadier than either alone. */
export const estimateOneRepMax = (weight: number, reps: number): number => (epley(weight, reps) + brzycki(weight, reps)) / 2;

/** How many reps you can usually do at a share of your one-rep max. These are common rough guides, not exact for everyone. */
export const PERCENT_ROWS: Array<{ percent: number; reps: string }> = [
  { percent: 100, reps: '1' }, { percent: 95, reps: '2' }, { percent: 90, reps: '4' }, { percent: 85, reps: '6' },
  { percent: 80, reps: '8' }, { percent: 75, reps: '10' }, { percent: 70, reps: '12' }, { percent: 65, reps: '15' },
  { percent: 60, reps: '20' }, { percent: 50, reps: '30 or more' },
];

/** Plates people commonly have, heaviest first. */
export const PLATES: Record<WeightUnit, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};
export const BARS: Record<WeightUnit, Array<{ id: string; label: string; weight: number }>> = {
  kg: [{ id: 'olympic', label: 'Standard bar, 20 kg', weight: 20 }, { id: 'women', label: 'Women’s bar, 15 kg', weight: 15 }, { id: 'light', label: 'Light bar, 10 kg', weight: 10 }, { id: 'none', label: 'No bar', weight: 0 }],
  lb: [{ id: 'olympic', label: 'Standard bar, 45 lb', weight: 45 }, { id: 'women', label: 'Women’s bar, 35 lb', weight: 35 }, { id: 'light', label: 'Light bar, 25 lb', weight: 25 }, { id: 'none', label: 'No bar', weight: 0 }],
};

const round = (value: number): number => Math.round(value * 1000) / 1000;

export interface PlateLoad {
  /** Plates on each side, heaviest first, as [plate, count]. */
  perSide: Array<[number, number]>;
  /** The weight actually loaded, which can be a little under the target if the plates do not fit it exactly. */
  loaded: number;
  /** How far under the target the bar is. */
  short: number;
}

/** The plates for each side of the bar. Greedy from the heaviest plate, which is exact for these plate sets. */
export function plateLoad(target: number, bar: number, unit: WeightUnit): PlateLoad {
  let left = Math.max(0, (target - bar) / 2);
  const perSide: Array<[number, number]> = [];
  let sideTotal = 0;
  for (const plate of PLATES[unit]) {
    const count = Math.floor(round(left / plate) + 1e-9);
    if (count > 0) {
      perSide.push([plate, count]);
      left = round(left - count * plate);
      sideTotal += count * plate;
    }
  }
  const loaded = round(bar + 2 * sideTotal);
  return { perSide, loaded, short: round(Math.max(0, target - loaded)) };
}

export const formatWeight = (value: number): string => (Math.round(value * 100) / 100).toString();
