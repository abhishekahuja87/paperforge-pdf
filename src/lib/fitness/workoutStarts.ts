import type { BlockId } from './workout';

/**
 * Quick starts for the Workout Planner: ready lists of exercise ids from the Exercise Library (src/data/exerciseLibrary.json).
 * Every id must exist in that file; scripts or tests should check this when the library changes.
 */
export interface QuickStart {
  id: string;
  label: string;
  blurb: string;
  title: string;
  blocks: Record<BlockId, string[]>;
}

export const QUICK_STARTS: QuickStart[] = [
  {
    id: 'mix-day', label: 'Mix day', blurb: 'Cardio, then a little of everything, then stretches.', title: 'Mix day',
    blocks: {
      warmup: ['rope-jumping', 'arm-circles', 'standing-hip-circles'],
      main: ['rowing-stationary', 'dumbbell-bench-press', 'goblet-squat', 'seated-cable-rows', 'dumbbell-shoulder-press', 'crunches'],
      cooldown: ['chest-and-front-of-shoulder-stretch', 'quad-stretch', 'hamstring-stretch', 'child-s-pose'],
    },
  },
  {
    id: 'push', label: 'Push day', blurb: 'Chest, shoulders and triceps.', title: 'Push day',
    blocks: {
      warmup: ['arm-circles', 'dynamic-chest-stretch', 'band-pull-apart'],
      main: ['dumbbell-bench-press', 'incline-dumbbell-press', 'dumbbell-shoulder-press', 'side-lateral-raise', 'triceps-pushdown', 'bench-dips'],
      cooldown: ['chest-and-front-of-shoulder-stretch', 'triceps-stretch', 'overhead-stretch'],
    },
  },
  {
    id: 'pull', label: 'Pull day', blurb: 'Back and biceps.', title: 'Pull day',
    blocks: {
      warmup: ['arm-circles', 'cat-stretch', 'band-pull-apart'],
      main: ['wide-grip-lat-pulldown', 'seated-cable-rows', 'one-arm-dumbbell-row', 'face-pull', 'dumbbell-bicep-curl', 'hammer-curls'],
      cooldown: ['upper-back-stretch', 'standing-biceps-stretch', 'child-s-pose'],
    },
  },
  {
    id: 'legs', label: 'Leg day', blurb: 'Legs, glutes and calves.', title: 'Leg day',
    blocks: {
      warmup: ['standing-hip-circles', 'ankle-circles', 'bodyweight-squat'],
      main: ['goblet-squat', 'leg-press', 'romanian-deadlift', 'dumbbell-lunges', 'lying-leg-curls', 'standing-calf-raises'],
      cooldown: ['quad-stretch', 'hamstring-stretch', 'standing-gastrocnemius-calf-stretch', 'kneeling-hip-flexor'],
    },
  },
  {
    id: 'full-body', label: 'Full body', blurb: 'One exercise for each main area.', title: 'Full body',
    blocks: {
      warmup: ['arm-circles', 'standing-hip-circles', 'jogging-treadmill'],
      main: ['goblet-squat', 'dumbbell-bench-press', 'one-arm-dumbbell-row', 'dumbbell-shoulder-press', 'plank'],
      cooldown: ['world-s-greatest-stretch', 'child-s-pose', 'hug-knees-to-chest'],
    },
  },
  {
    id: 'home', label: 'Home, no equipment', blurb: 'Bodyweight only.', title: 'Home workout',
    blocks: {
      warmup: ['arm-circles', 'standing-hip-circles', 'fast-skipping'],
      main: ['pushups', 'bodyweight-squat', 'bodyweight-walking-lunge', 'superman', 'plank', 'mountain-climbers'],
      cooldown: ['child-s-pose', 'hamstring-stretch', 'hug-knees-to-chest'],
    },
  },
  {
    id: 'cardio-core', label: 'Cardio and core', blurb: 'Raise the heart rate, then work the middle.', title: 'Cardio and core',
    blocks: {
      warmup: ['ankle-circles', 'fast-skipping'],
      main: ['rope-jumping', 'mountain-climbers', 'russian-twist', 'air-bike', 'plank', 'dead-bug'],
      cooldown: ['cat-stretch', 'spinal-stretch', 'child-s-pose'],
    },
  },
  {
    id: 'yoga-morning', label: 'Morning yoga', blurb: 'Gentle standing and floor poses to start the day.', title: 'Morning yoga',
    blocks: {
      warmup: ['yoga-easy-pose', 'cat-stretch', 'yoga-mountain-pose'],
      main: ['yoga-standing-forward-fold', 'yoga-chair-pose', 'yoga-warrior-one', 'yoga-warrior-two', 'yoga-triangle-pose', 'yoga-downward-facing-dog', 'yoga-cobra-pose'],
      cooldown: ['yoga-childs-pose', 'yoga-seated-forward-bend', 'yoga-corpse-pose'],
    },
  },
  {
    id: 'yoga-evening', label: 'Evening wind-down', blurb: 'Slow poses on the floor to relax before sleep.', title: 'Evening wind-down',
    blocks: {
      warmup: ['yoga-easy-pose', 'cat-stretch'],
      main: ['yoga-low-lunge', 'yoga-garland-pose', 'yoga-bridge-pose', 'yoga-happy-baby', 'yoga-seated-forward-bend'],
      cooldown: ['yoga-childs-pose', 'yoga-corpse-pose'],
    },
  },
];
