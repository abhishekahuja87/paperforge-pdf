import { SPORTS, type Margin, type Sport, type Variant } from './courtData';

export interface Space { length: number; width: number }

export interface FitResult {
  sport: Sport;
  variant: Variant;
  margin: Margin;
  /** Space the court needs with its clear space and any extra: [long side, short side]. */
  need: [number, number];
  fits: boolean;
  /** Spare space on the long and short sides when it fits, or how much is missing (negative) when it does not. */
  spare: [number, number];
  /** How many courts fit if each keeps its own clear space. 0 when one does not fit. */
  count: number;
}

const EPS = 1e-6;
const sorted = (a: number, b: number): [number, number] => (a >= b ? [a, b] : [b, a]);

/** Space one court needs: its size plus the clear space on each side, never less than the rules' overall minimum. */
export function spaceNeeded(variant: Variant, margin: Margin, extra: number): [number, number] {
  let [long, short] = sorted(variant.length + 2 * (margin.ends + extra), variant.width + 2 * (margin.sides + extra));
  if (variant.minOverall) {
    long = Math.max(long, variant.minOverall[0] + 2 * extra);
    short = Math.max(short, variant.minOverall[1] + 2 * extra);
  }
  return [long, short];
}

/** Whole courts of this size in a space, trying both ways round. Each court keeps its own clear space. */
export function courtCount(space: Space, need: [number, number]): number {
  const [sLong, sShort] = sorted(space.length, space.width);
  const along = Math.floor(sLong / need[0] + EPS) * Math.floor(sShort / need[1] + EPS);
  // Turn the courts the other way: the long side of a court runs along the short side of the space.
  const across = Math.floor(sLong / need[1] + EPS) * Math.floor(sShort / need[0] + EPS);
  return Math.max(along, across);
}

/** Every court and ground against a space. `extra` is clear space in metres you want on every side on top of what the rules ask. */
export function checkAll(space: Space, extra: number, marginOf: (variant: Variant) => Margin = (variant) => variant.margins[0]): FitResult[] {
  const [sLong, sShort] = sorted(space.length, space.width);
  const results: FitResult[] = [];
  for (const sport of SPORTS) {
    for (const variant of sport.variants) {
      const margin = marginOf(variant);
      const need = spaceNeeded(variant, margin, extra);
      const spare: [number, number] = [sLong - need[0], sShort - need[1]];
      const fits = spare[0] >= -EPS && spare[1] >= -EPS;
      results.push({ sport, variant, margin, need, fits, spare, count: fits ? courtCount(space, need) : 0 });
    }
  }
  return results;
}
