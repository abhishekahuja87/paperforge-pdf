import { EXERCISES, type Exercise, type ExerciseGroup, type ExerciseLevel } from './exercises';
import { INTRO_SECONDS, type BlockId } from './workout';

/**
 * "Build me a workout": picks a warm-up, a main part and a cool-down from the Exercise Library so the whole routine fits the time
 * the person chose. No React here, so it can be tested on its own. The same options and seed always give the same workout.
 */
export type BuildEquipment = 'none' | 'home' | 'gym';
export type BuildFocus = 'full' | 'upper' | 'lower' | 'core' | 'cardio' | 'stretch' | 'yoga';

export interface BuildOptions {
  minutes: number;
  equipment: BuildEquipment;
  focus: BuildFocus;
  level: ExerciseLevel;
  /** Changes which exercises are picked. Use a new number to get another workout with the same settings. */
  seed: number;
}

export interface BuiltWorkout {
  title: string;
  blocks: Record<BlockId, string[]>;
  /** Seconds on each exercise and rest between them, to set on the planner so the total matches the minutes. */
  work: number;
  rest: number;
  /** Seconds on screen with these timings. */
  seconds: number;
}

export const MINUTE_CHOICES = [5, 10, 15, 20, 30, 45];

export const EQUIPMENT_CHOICES: Array<{ id: BuildEquipment; label: string; hint: string }> = [
  { id: 'none', label: 'No equipment', hint: 'Your body weight only, nothing to buy.' },
  { id: 'home', label: 'Home equipment', hint: 'Body weight, dumbbells, bands, a kettlebell or a ball.' },
  { id: 'gym', label: 'Full gym', hint: 'Anything in the list, including barbells and machines.' },
];

export const FOCUS_CHOICES: Array<{ id: BuildFocus; label: string }> = [
  { id: 'full', label: 'Full body' }, { id: 'upper', label: 'Upper body' }, { id: 'lower', label: 'Lower body' }, { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' }, { id: 'stretch', label: 'Stretching' }, { id: 'yoga', label: 'Yoga' },
];

const FOCUS_GROUPS: Record<BuildFocus, ExerciseGroup[]> = {
  full: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'],
  upper: ['chest', 'back', 'shoulders', 'arms'],
  lower: ['legs'],
  core: ['core'],
  cardio: ['cardio'],
  stretch: ['stretching'],
  yoga: ['yoga'],
};

const TITLES: Record<BuildFocus, string> = { full: 'Full body', upper: 'Upper body', lower: 'Lower body', core: 'Core', cardio: 'Cardio', stretch: 'Stretching', yoga: 'Yoga' };

/** Easy moves that raise the heart rate or loosen the joints. Every id is in the library; a test checks this. */
const WARMUP_IDS = ['arm-circles', 'shoulder-circles', 'standing-hip-circles', 'torso-rotation', 'knee-circles', 'ankle-circles', 'fast-skipping', 'inchworm', 'windmills', 'world-s-greatest-stretch', 'bodyweight-squat', 'mountain-climbers'];
const WARMUP_FOR: Partial<Record<BuildFocus, string[]>> = {
  lower: ['standing-hip-circles', 'knee-circles', 'ankle-circles', 'bodyweight-squat', 'fast-skipping', 'world-s-greatest-stretch'],
  upper: ['arm-circles', 'shoulder-circles', 'torso-rotation', 'elbow-circles', 'inchworm', 'windmills'],
  stretch: ['arm-circles', 'standing-hip-circles', 'torso-rotation', 'shoulder-circles'],
  yoga: ['yoga-easy-pose', 'cat-stretch', 'yoga-mountain-pose', 'shoulder-circles'],
};

const COOLDOWN_FOR: Record<BuildFocus, string[]> = {
  full: ['child-s-pose', 'hamstring-stretch', 'quad-stretch', 'chest-and-front-of-shoulder-stretch', 'hug-knees-to-chest', 'kneeling-hip-flexor', 'triceps-stretch', 'standing-gastrocnemius-calf-stretch', 'cat-stretch', 'knee-across-the-body'],
  upper: ['chest-and-front-of-shoulder-stretch', 'triceps-stretch', 'standing-biceps-stretch', 'upper-back-stretch', 'overhead-stretch', 'shoulder-stretch', 'child-s-pose'],
  lower: ['quad-stretch', 'hamstring-stretch', 'standing-gastrocnemius-calf-stretch', 'kneeling-hip-flexor', 'seated-glute', 'lying-glute', 'child-s-pose'],
  core: ['cat-stretch', 'child-s-pose', 'spinal-stretch', 'yoga-cobra-pose', 'hug-knees-to-chest', 'knee-across-the-body'],
  cardio: ['quad-stretch', 'hamstring-stretch', 'standing-gastrocnemius-calf-stretch', 'kneeling-hip-flexor', 'hug-knees-to-chest', 'child-s-pose'],
  stretch: ['child-s-pose', 'hug-knees-to-chest', 'knee-across-the-body', 'cat-stretch', 'overhead-stretch'],
  yoga: ['yoga-childs-pose', 'yoga-happy-baby', 'yoga-seated-forward-bend', 'yoga-bridge-pose', 'yoga-corpse-pose'],
};

/** Names of moves that need a bar, a bench, a box, a rope or a machine, so they are left out when the person has no equipment. */
const NEEDS_KIT = /pull-?up|chin-?up|bench|\bbox\b|\bdips?\b|\bbar\b|rope|inverted|\bring|\bsled|swiss|\bball\b|roller|\broll\b|stability|\bstep[- ]?up|platform|bicycl|elliptical|treadmill|rowing|recumbent|stationary|stair|ergometer|parallel|jungle|monkey|wheel/i;
/** Mobility moves and drills that are good in a warm-up but not as the main part of a workout. */
const NOT_MAIN = /circles|technique|drill|\bstart\b/i;
const MACHINES = /bicycl|elliptical|treadmill|rowing|recumbent|stationary|stair|ergometer/i;

/** A small seeded random number generator, so a workout can be repeated and tested. */
export function seeded(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

const levelOk = (exercise: Exercise, level: ExerciseLevel): boolean => (level === 'advanced' ? true : level === 'intermediate' ? exercise.level !== 'advanced' : exercise.level === 'beginner');

export function equipmentOk(exercise: Exercise, equipment: BuildEquipment): boolean {
  if (equipment === 'gym') return true;
  if (MACHINES.test(exercise.name) || exercise.equipment === 'machine' || exercise.equipment === 'barbell') return false;
  if (equipment === 'home') return true;
  return exercise.equipment === 'bodyweight' && !NEEDS_KIT.test(exercise.name);
}

/** The seconds on the screen for a plan of this many exercises, the same sum the planner uses. */
export const screenSeconds = (count: number, work: number, rest: number): number => (count === 0 ? 0 : INTRO_SECONDS + count * work + (count - 1) * rest);

/** Longer holds for yoga and stretches, shorter bursts for a very short workout. */
export function timingFor(minutes: number, focus: BuildFocus): { work: number; rest: number } {
  if (focus === 'yoga' || focus === 'stretch') return { work: 45, rest: 5 };
  if (minutes <= 5) return { work: 30, rest: 10 };
  return { work: 40, rest: 15 };
}

export function exerciseCount(minutes: number, work: number, rest: number): number {
  return Math.max(3, Math.floor((minutes * 60 - INTRO_SECONDS + rest) / (work + rest)));
}

export function buildWorkout(options: BuildOptions, library: Exercise[] = EXERCISES): BuiltWorkout {
  const random = seeded(options.seed * 7919 + options.minutes * 31 + options.focus.length);
  const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
  const usable = (id: string): Exercise | undefined => {
    const exercise = byId.get(id);
    return exercise && equipmentOk(exercise, options.equipment) && levelOk(exercise, options.level === 'beginner' ? 'intermediate' : options.level) ? exercise : undefined;
  };
  const { work, rest } = timingFor(options.minutes, options.focus);
  const total = exerciseCount(options.minutes, work, rest);
  const short = total < 5;
  const warmCount = short ? 0 : Math.max(1, Math.round(total * 0.2));
  const coolCount = short ? 0 : Math.max(1, Math.round(total * 0.2));
  const mainCount = total - warmCount - coolCount;
  const taken = new Set<string>();
  const take = (ids: string[], count: number, keepOrder = false): string[] => {
    const picked: string[] = [];
    for (const id of keepOrder ? ids : shuffled(ids, random)) {
      if (picked.length >= count) break;
      if (taken.has(id) || !usable(id)) continue;
      picked.push(id);
      taken.add(id);
    }
    return picked;
  };

  // Warm-up and cool-down first, so the main part does not use up the stretches they need.
  const warmup = take(WARMUP_FOR[options.focus] ?? WARMUP_IDS, warmCount);
  if (warmup.length < warmCount) warmup.push(...take(WARMUP_IDS, warmCount - warmup.length));
  const cooldown = take(COOLDOWN_FOR[options.focus], coolCount, options.focus === 'yoga');
  if (options.focus === 'yoga' && coolCount > 0 && !cooldown.includes('yoga-corpse-pose') && usable('yoga-corpse-pose')) { cooldown[cooldown.length - 1] = 'yoga-corpse-pose'; taken.add('yoga-corpse-pose'); }

  // Main part: one move for each muscle in turn, so the workout is balanced and nothing repeats.
  const groups = FOCUS_GROUPS[options.focus];
  const pool = library.filter((exercise) => groups.includes(exercise.group) && !WARMUP_IDS.includes(exercise.id) && !NOT_MAIN.test(exercise.name) && equipmentOk(exercise, options.equipment) && levelOk(exercise, options.level) && !(options.focus !== 'stretch' && options.focus !== 'yoga' && exercise.group === 'stretching'));
  const bucketKey = (exercise: Exercise) => (options.focus === 'full' ? exercise.group : exercise.muscles[0] ?? exercise.group);
  const buckets = new Map<string, Exercise[]>();
  shuffled(pool, random).forEach((exercise) => { const key = bucketKey(exercise); buckets.set(key, [...(buckets.get(key) ?? []), exercise]); });
  const order = shuffled([...buckets.keys()], random);
  const main: string[] = [];
  for (let round = 0; main.length < mainCount && round < 50; round += 1) {
    let any = false;
    for (const key of order) {
      const next = buckets.get(key)?.[round];
      if (!next) continue;
      any = true;
      if (main.length < mainCount && !taken.has(next.id)) { main.push(next.id); taken.add(next.id); }
    }
    if (!any) break;
  }

  // A long session may need more moves than the list has for this level, so go round again (the other side, or a second round).
  const unique = main.length;
  while (unique > 0 && main.length < mainCount) main.push(main[main.length % unique]);

  const blocks = { warmup, main, cooldown };
  const count = warmup.length + main.length + cooldown.length;
  const equipmentLabel = options.equipment === 'none' ? 'no equipment' : options.equipment === 'home' ? 'home equipment' : 'gym';
  return { title: `${options.minutes} minute ${TITLES[options.focus].toLowerCase()} (${equipmentLabel})`, blocks, work, rest, seconds: screenSeconds(count, work, rest) };
}
