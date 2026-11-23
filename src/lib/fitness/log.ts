/** A simple workout log kept on the device. Plain logic, no React. */
import { estimateOneRepMax } from './strength';

export interface LoggedSet { weight: number; reps: number }
export interface LogEntry {
  id: string;
  /** Date as yyyy-mm-dd. */
  date: string;
  exerciseId: string;
  sets: LoggedSet[];
}

export const volume = (sets: LoggedSet[]): number => sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

/** The heaviest set by estimated one-rep max. Sets with no weight (body weight moves) are compared by reps. */
export function bestSet(sets: LoggedSet[]): LoggedSet | null {
  let best: LoggedSet | null = null;
  let bestScore = -1;
  for (const set of sets) {
    if (set.reps <= 0) continue;
    const score = set.weight > 0 ? estimateOneRepMax(set.weight, set.reps) : set.reps;
    if (score > bestScore) { best = set; bestScore = score; }
  }
  return best;
}

export interface Progress { date: string; score: number; best: LoggedSet }

/** One point per day for an exercise: its best estimated one-rep max (or most reps for body weight moves), oldest first. */
export function progressFor(entries: LogEntry[], exerciseId: string): Progress[] {
  const byDate = new Map<string, Progress>();
  for (const entry of entries) {
    if (entry.exerciseId !== exerciseId) continue;
    const best = bestSet(entry.sets);
    if (!best) continue;
    const score = best.weight > 0 ? estimateOneRepMax(best.weight, best.reps) : best.reps;
    const current = byDate.get(entry.date);
    if (!current || score > current.score) byDate.set(entry.date, { date: entry.date, score, best });
  }
  return [...byDate.values()].sort((x, y) => x.date.localeCompare(y.date));
}

/** True if the newest day's score is the highest ever for that exercise and there were earlier days. */
export function isRecord(points: Progress[]): boolean {
  if (points.length < 2) return false;
  const last = points[points.length - 1].score;
  return points.slice(0, -1).every((point) => point.score < last);
}

export const exercisesUsed = (entries: LogEntry[]): string[] => [...new Set(entries.map((entry) => entry.exerciseId))];

/** Parse "60x8, 60x8, 65x6" or "60 x 8" into sets. Anything that is not a number pair is skipped. */
export function parseSets(text: string): LoggedSet[] {
  return text.split(/[,;\n]/).flatMap((part) => {
    const match = part.trim().match(/^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+)$/i);
    return match ? [{ weight: Number(match[1]), reps: Number(match[2]) }] : [];
  });
}

export const setsToText = (sets: LoggedSet[]): string => sets.map((set) => `${set.weight}×${set.reps}`).join(', ');
