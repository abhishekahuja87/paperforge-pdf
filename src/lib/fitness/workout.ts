import type { Exercise } from './exercises';

/** Logic for the Workout Planner and Gym Display. No React and no data files here, so it can be tested on its own. */

export type BlockId = 'warmup' | 'main' | 'cooldown';

export const BLOCKS: Array<{ id: BlockId; label: string; hint: string }> = [
  { id: 'warmup', label: 'Warm-up', hint: 'Easy cardio and mobility to get ready.' },
  { id: 'main', label: 'Main workout', hint: 'The cardio or muscle work for the day.' },
  { id: 'cooldown', label: 'Cool-down', hint: 'Slow stretches to finish.' },
];

export interface WorkoutItem {
  key: string;
  /** Library id when the exercise comes from the Exercise Library (it has pictures and steps). Absent for your own entries. */
  exerciseId?: string;
  name: string;
  /** Free text such as "3 x 12" or the reason an exercise is not in the library. Shown on the slide. */
  detail: string;
}

export interface WorkoutPlan {
  title: string;
  place: string;
  /** YYYY-MM-DD, kept as text so the plan can be saved and shown without time zone surprises. */
  date: string;
  blocks: Record<BlockId, WorkoutItem[]>;
}

export interface Timing { work: number; rest: number }

export type Slide =
  | { kind: 'intro'; seconds: number }
  | { kind: 'exercise'; seconds: number; block: BlockId; item: WorkoutItem; number: number; total: number; next?: WorkoutItem }
  | { kind: 'rest'; seconds: number; next: WorkoutItem; block: BlockId }
  | { kind: 'end'; seconds: 0 };

export const INTRO_SECONDS = 8;

/** The browser storage key the Workout Planner keeps its plan under. Other tools write a plan here to open it in the planner. */
export const PLAN_STORAGE_KEY = 'mdu-workout-plan-v1';

let counter = 0;
export const newKey = (): string => `w${Date.now().toString(36)}${(counter += 1).toString(36)}`;

export const itemFromExercise = (exercise: Pick<Exercise, 'id' | 'name'>, detail = ''): WorkoutItem => ({ key: newKey(), exerciseId: exercise.id, name: exercise.name, detail });

export const customItem = (name: string, detail = ''): WorkoutItem => ({ key: newKey(), name: name.trim(), detail: detail.trim() });

export const todayIso = (now = new Date()): string => {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export const emptyPlan = (): WorkoutPlan => ({ title: 'Today’s workout', place: '', date: todayIso(), blocks: { warmup: [], main: [], cooldown: [] } });

export const clampSeconds = (value: number, min: number, max: number, fallback: number): number => (Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback);

export const planItemCount = (plan: WorkoutPlan): number => BLOCKS.reduce((sum, block) => sum + plan.blocks[block.id].length, 0);

/** The slides in play order: an intro, each exercise with a rest slide between exercises, and a closing slide. */
export function buildSlides(plan: WorkoutPlan, timing: Timing): Slide[] {
  const all = BLOCKS.flatMap((block) => plan.blocks[block.id].map((item) => ({ block: block.id, item })));
  const slides: Slide[] = [{ kind: 'intro', seconds: INTRO_SECONDS }];
  all.forEach((entry, index) => {
    const next = all[index + 1];
    slides.push({ kind: 'exercise', seconds: timing.work, block: entry.block, item: entry.item, number: index + 1, total: all.length, next: next?.item });
    if (next && timing.rest > 0) slides.push({ kind: 'rest', seconds: timing.rest, next: next.item, block: next.block });
  });
  slides.push({ kind: 'end', seconds: 0 });
  return slides;
}

export const totalSeconds = (slides: Slide[]): number => slides.reduce((sum, slide) => sum + slide.seconds, 0);

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function formatPlanDate(iso: string, locale = 'en-IN'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Plain text of the plan, for pasting into a chat. */
export function planToText(plan: WorkoutPlan, locale = 'en-IN'): string {
  const lines = [plan.title.trim() || 'Workout', formatPlanDate(plan.date, locale)];
  if (plan.place.trim()) lines.push(plan.place.trim());
  BLOCKS.forEach((block) => {
    const items = plan.blocks[block.id];
    if (items.length === 0) return;
    lines.push('', `${block.label}:`);
    items.forEach((item, index) => lines.push(`${index + 1}. ${item.name}${item.detail.trim() ? ` (${item.detail.trim()})` : ''}`));
  });
  return lines.join('\n');
}

/** Checks a saved plan before it is used, so a damaged or old entry in the browser never breaks the page. */
export function readSavedPlan(value: unknown): WorkoutPlan | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const blocks = raw.blocks as Record<string, unknown> | undefined;
  if (typeof raw.title !== 'string' || typeof raw.place !== 'string' || typeof raw.date !== 'string' || typeof blocks !== 'object' || blocks === null) return null;
  const read = (id: BlockId): WorkoutItem[] => {
    const list = blocks[id];
    if (!Array.isArray(list)) return [];
    return list.flatMap((entry): WorkoutItem[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const item = entry as Record<string, unknown>;
      if (typeof item.name !== 'string' || item.name.trim() === '') return [];
      return [{ key: newKey(), exerciseId: typeof item.exerciseId === 'string' ? item.exerciseId : undefined, name: item.name, detail: typeof item.detail === 'string' ? item.detail : '' }];
    });
  };
  return { title: raw.title, place: raw.place, date: raw.date, blocks: { warmup: read('warmup'), main: read('main'), cooldown: read('cooldown') } };
}
