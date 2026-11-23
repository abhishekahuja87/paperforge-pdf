import library from '../../data/exerciseLibrary.json';
import yoga from '../../data/yogaLibrary.json';

export type ExerciseGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio' | 'stretching' | 'yoga';
export type ExerciseEquipment = 'bodyweight' | 'dumbbell' | 'barbell' | 'machine' | 'other';
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  group: ExerciseGroup;
  muscles: string[];
  secondary: string[];
  equipment: ExerciseEquipment;
  level: ExerciseLevel;
  /** How many pictures there are: 2 (start and end) when left out, 4 for yoga poses (start, hold and two between). */
  frames?: number;
  steps: string[];
}

/**
 * Exercises and stretches from the open free-exercise-db dataset (scripts/build-exercise-library.py, scripts/build-more-exercises.py),
 * then the yoga poses, which have pictures we drew ourselves (scripts/build-yoga-library.py). The order is the order in the lists.
 */
export const EXERCISES = [...(library as Exercise[]), ...(yoga as Exercise[])];

export const GROUPS: Array<{ id: ExerciseGroup; label: string; blurb: string }> = [
  { id: 'chest', label: 'Chest', blurb: 'Pressing and fly movements for the chest.' },
  { id: 'back', label: 'Back', blurb: 'Pulling movements for the lats, mid back, lower back and traps.' },
  { id: 'shoulders', label: 'Shoulders', blurb: 'Presses and raises for the front, side and rear of the shoulder.' },
  { id: 'arms', label: 'Arms', blurb: 'Biceps, triceps and forearms.' },
  { id: 'legs', label: 'Legs and glutes', blurb: 'Quads, hamstrings, glutes, calves and hips.' },
  { id: 'core', label: 'Core', blurb: 'Abs, obliques and the muscles that keep your trunk steady.' },
  { id: 'cardio', label: 'Cardio', blurb: 'Machines and jumping or skipping moves that raise your heart rate.' },
  { id: 'stretching', label: 'Stretching', blurb: 'Stretches and mobility moves for warming up and cooling down.' },
  { id: 'yoga', label: 'Yoga', blurb: 'Yoga poses drawn as four pictures that move from the start into the hold and back. Move slowly, never force a pose and skip any that hurts.' },
];

export const EQUIPMENT: Array<{ id: ExerciseEquipment; label: string }> = [
  { id: 'bodyweight', label: 'No equipment' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'machine', label: 'Machine or cable' },
  { id: 'other', label: 'Bands, kettlebell, ball or other' },
];

export const LEVELS: Array<{ id: ExerciseLevel; label: string }> = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export const imageUrl = (id: string, frame: 0 | 1 | 2 | 3): string => `/exercises/${id}/${frame}.webp`;

const FRAMES = new Map(EXERCISES.map((item) => [item.id, item.frames ?? 2]));
/** The number of pictures an exercise has. */
export const framesOf = (id: string): number => FRAMES.get(id) ?? 2;

export interface ExerciseFilter { group: ExerciseGroup | 'all'; equipment: ExerciseEquipment | 'all'; level: ExerciseLevel | 'all'; query: string }

export function filterExercises(filter: ExerciseFilter, list: Exercise[] = EXERCISES): Exercise[] {
  const query = filter.query.trim().toLowerCase();
  return list.filter((item) => (
    (filter.group === 'all' || item.group === filter.group)
    && (filter.equipment === 'all' || item.equipment === filter.equipment)
    && (filter.level === 'all' || item.level === filter.level)
    && (query === '' || item.name.toLowerCase().includes(query) || item.muscles.some((muscle) => muscle.includes(query)) || item.secondary.some((muscle) => muscle.includes(query)))
  ));
}
