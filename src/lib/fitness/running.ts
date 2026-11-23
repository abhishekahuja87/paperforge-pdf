/** Running pace, speed, time and distance, plus race time predictions. Plain maths, no React. */

export type DistanceUnit = 'km' | 'mi';

export const KM_PER_MILE = 1.609344;

export const RACES: Array<{ id: string; label: string; km: number }> = [
  { id: '1k', label: '1 km', km: 1 }, { id: '5k', label: '5K', km: 5 }, { id: '10k', label: '10K', km: 10 },
  { id: 'half', label: 'Half marathon', km: 21.0975 }, { id: 'full', label: 'Marathon', km: 42.195 },
];

export const toKm = (distance: number, unit: DistanceUnit): number => (unit === 'mi' ? distance * KM_PER_MILE : distance);
export const fromKm = (km: number, unit: DistanceUnit): number => (unit === 'mi' ? km / KM_PER_MILE : km);

/** Hours, minutes and seconds to seconds. */
export const toSeconds = (hours: number, minutes: number, seconds: number): number => hours * 3600 + minutes * 60 + seconds;

/** 3725 -> "1:02:05", 305 -> "5:05". Seconds are rounded to the nearest whole second. */
export function formatClock(totalSeconds: number): string {
  const whole = Math.round(totalSeconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

/** Seconds to cover one unit of distance. */
export const paceSeconds = (totalSeconds: number, km: number, unit: DistanceUnit): number => totalSeconds / fromKm(km, unit);

/** Speed in kilometres or miles an hour. */
export const speed = (totalSeconds: number, km: number, unit: DistanceUnit): number => fromKm(km, unit) / (totalSeconds / 3600);

/**
 * Riegel's formula: t2 = t1 x (d2 / d1) ^ 1.06. It predicts a time for another distance from a recent hard effort.
 * It works best between about 1500 m and a marathon, and it is more hopeful than real life for the marathon if the training is short.
 */
export const riegel = (seconds: number, fromKmValue: number, toKmValue: number): number => seconds * Math.pow(toKmValue / fromKmValue, 1.06);

export interface Split { mark: number; elapsed: number; label: string }

/** Time at each whole kilometre or mile for an even pace, with a last part-split if the distance is not a whole number. */
export function splits(totalSeconds: number, km: number, unit: DistanceUnit): Split[] {
  const total = fromKm(km, unit);
  const perUnit = totalSeconds / total;
  const out: Split[] = [];
  for (let mark = 1; mark <= Math.floor(total + 1e-9); mark += 1) out.push({ mark, elapsed: mark * perUnit, label: `${mark} ${unit}` });
  if (total - Math.floor(total + 1e-9) > 0.005) out.push({ mark: total, elapsed: totalSeconds, label: `${Math.round(total * 100) / 100} ${unit} (finish)` });
  return out;
}
