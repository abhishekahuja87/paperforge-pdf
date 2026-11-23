/**
 * Fixed weekly plans for people who want to follow a routine that never changes. Plain data, no React.
 * Every move is an id from the Exercise Library (src/data), so it has pictures and steps there.
 * Each plan is set up so that, over its days, every main muscle is trained. scripts/check-weekly-plans.mjs tests it.
 */

export type PlanKind = 'gym' | 'home' | 'yoga';

/** A move: library id and a short note such as "3 x 10" or "Hold 5 breaths". */
export type Move = readonly [id: string, note: string];

export interface PlanDay {
  title: string;
  /** What the day trains, in a few words. */
  focus: string;
  warmup: Move[];
  main: Move[];
  cooldown: Move[];
}

export interface WeeklyPlan {
  id: string;
  kind: PlanKind;
  /** Training days per week. */
  days: 3 | 4 | 5;
  name: string;
  blurb: string;
  /** Which days of the week to train, so the rest days fall in the right place. */
  schedule: string;
  plan: PlanDay[];
}

export const KINDS: Array<{ id: PlanKind; label: string; blurb: string }> = [
  { id: 'gym', label: 'Gym', blurb: 'Barbells, dumbbells and machines.' },
  { id: 'home', label: 'At home', blurb: 'Your body weight and a pair of dumbbells.' },
  { id: 'yoga', label: 'Yoga', blurb: 'Poses and stretches, no equipment.' },
];

const SCHEDULE: Record<3 | 4 | 5, string> = {
  3: 'Monday, Wednesday and Friday, with a rest day between each.',
  4: 'Monday, Tuesday, Thursday and Friday, with rest on Wednesday and the weekend.',
  5: 'Monday to Friday, with the weekend off.',
};

const RAMP: Move[] = [['jogging-treadmill', '5 min easy'], ['arm-circles', '20 sec']];
const HOME_RAMP: Move[] = [['star-jump', '30 sec'], ['arm-circles', '20 sec']];
const COOL: Move[] = [['hamstring-stretch', '30 sec each leg'], ['chest-and-front-of-shoulder-stretch', '30 sec'], ['child-s-pose', '45 sec']];
const COOL_LEGS: Move[] = [['kneeling-hip-flexor', '30 sec each side'], ['standing-gastrocnemius-calf-stretch', '30 sec each leg'], ['child-s-pose', '45 sec']];
const COOL_UPPER: Move[] = [['triceps-stretch', '30 sec each arm'], ['chest-and-front-of-shoulder-stretch', '30 sec'], ['upper-back-stretch', '30 sec']];

const day = (title: string, focus: string, warmup: Move[], main: Move[], cooldown: Move[]): PlanDay => ({ title, focus, warmup, main, cooldown });

const GYM_3: PlanDay[] = [
  day('Day 1: Full body A', 'Legs, chest, back, shoulders, arms and core', RAMP, [
    ['barbell-squat', '3 x 8'], ['barbell-bench-press-medium-grip', '3 x 8'], ['bent-over-barbell-row', '3 x 8'], ['dumbbell-shoulder-press', '3 x 10'], ['dumbbell-bicep-curl', '2 x 12'], ['plank', '3 x 30 sec'],
  ], COOL),
  day('Day 2: Full body B', 'Legs, chest, back, shoulders, arms and core', RAMP, [
    ['leg-press', '3 x 10'], ['incline-dumbbell-press', '3 x 10'], ['wide-grip-lat-pulldown', '3 x 10'], ['romanian-deadlift', '3 x 8'], ['side-lateral-raise', '3 x 12'], ['triceps-pushdown', '3 x 12'], ['crunches', '3 x 15'],
  ], COOL),
  day('Day 3: Full body C', 'Legs, chest, back, shoulders, arms and core', RAMP, [
    ['dumbbell-lunges', '3 x 10 each leg'], ['dumbbell-bench-press', '3 x 10'], ['seated-cable-rows', '3 x 10'], ['face-pull', '3 x 12'], ['hammer-curls', '3 x 12'], ['standing-dumbbell-calf-raise', '3 x 15'], ['russian-twist', '3 x 20'],
  ], COOL),
];

const GYM_4: PlanDay[] = [
  day('Day 1: Upper body A', 'Chest, back, shoulders and arms', RAMP, [
    ['barbell-bench-press-medium-grip', '3 x 8'], ['bent-over-barbell-row', '3 x 8'], ['dumbbell-shoulder-press', '3 x 10'], ['wide-grip-lat-pulldown', '3 x 10'], ['dumbbell-bicep-curl', '3 x 12'], ['triceps-pushdown', '3 x 12'],
  ], COOL_UPPER),
  day('Day 2: Lower body A', 'Quads, hamstrings, glutes, calves and abs', RAMP, [
    ['barbell-squat', '3 x 8'], ['romanian-deadlift', '3 x 8'], ['leg-press', '3 x 10'], ['lying-leg-curls', '3 x 12'], ['standing-calf-raises', '3 x 15'], ['cable-crunch', '3 x 15'],
  ], COOL_LEGS),
  day('Day 3: Upper body B', 'Chest, back, shoulders and arms', RAMP, [
    ['incline-dumbbell-press', '3 x 10'], ['seated-cable-rows', '3 x 10'], ['side-lateral-raise', '3 x 12'], ['dumbbell-flyes', '3 x 12'], ['face-pull', '3 x 12'], ['hammer-curls', '3 x 12'], ['ez-bar-skullcrusher', '3 x 12'],
  ], COOL_UPPER),
  day('Day 4: Lower body B', 'Quads, hamstrings, glutes, calves and core', RAMP, [
    ['barbell-walking-lunge', '3 x 10 each leg'], ['hack-squat', '3 x 10'], ['seated-leg-curl', '3 x 12'], ['butt-lift-bridge', '3 x 15'], ['seated-calf-raise', '3 x 15'], ['hyperextensions-back-extensions', '3 x 12'], ['russian-twist', '3 x 20'],
  ], COOL_LEGS),
];

const GYM_5: PlanDay[] = [
  day('Day 1: Chest and triceps', 'Chest and triceps', RAMP, [
    ['barbell-bench-press-medium-grip', '4 x 8'], ['incline-dumbbell-press', '3 x 10'], ['dumbbell-flyes', '3 x 12'], ['cable-crossover', '3 x 12'], ['triceps-pushdown', '3 x 12'], ['ez-bar-skullcrusher', '3 x 12'],
  ], COOL_UPPER),
  day('Day 2: Back and biceps', 'Lats, mid back, lower back and biceps', RAMP, [
    ['bent-over-barbell-row', '4 x 8'], ['wide-grip-lat-pulldown', '3 x 10'], ['seated-cable-rows', '3 x 10'], ['one-arm-dumbbell-row', '3 x 10 each arm'], ['hyperextensions-back-extensions', '3 x 12'], ['dumbbell-bicep-curl', '3 x 12'], ['hammer-curls', '3 x 12'],
  ], COOL_UPPER),
  day('Day 3: Legs and glutes', 'Quads, hamstrings, glutes and calves', RAMP, [
    ['barbell-squat', '4 x 8'], ['leg-press', '3 x 10'], ['romanian-deadlift', '3 x 8'], ['lying-leg-curls', '3 x 12'], ['leg-extensions', '3 x 12'], ['butt-lift-bridge', '3 x 15'], ['standing-calf-raises', '4 x 15'],
  ], COOL_LEGS),
  day('Day 4: Shoulders and core', 'Shoulders, traps and abs', RAMP, [
    ['dumbbell-shoulder-press', '4 x 10'], ['side-lateral-raise', '3 x 12'], ['front-dumbbell-raise', '3 x 12'], ['cable-rear-delt-fly', '3 x 12'], ['dumbbell-shrug', '3 x 15'], ['plank', '3 x 40 sec'], ['cable-crunch', '3 x 15'],
  ], COOL_UPPER),
  day('Day 5: Full body and cardio', 'A lighter day for the whole body', [['rowing-stationary', '5 min easy'], ['arm-circles', '20 sec']], [
    ['goblet-squat', '3 x 12'], ['pushups', '3 x 12'], ['one-arm-dumbbell-row', '3 x 12 each arm'], ['dumbbell-lunges', '2 x 10 each leg'], ['mountain-climbers', '3 x 30 sec'], ['russian-twist', '3 x 20'], ['bicycling-stationary', '10 min steady'],
  ], COOL),
];

const HOME_3: PlanDay[] = [
  day('Day 1: Full body A', 'Legs, chest, back, shoulders, arms and core', HOME_RAMP, [
    ['bodyweight-squat', '3 x 15'], ['pushups', '3 x 10'], ['one-arm-dumbbell-row', '3 x 10 each arm'], ['dumbbell-shoulder-press', '3 x 10'], ['dumbbell-bicep-curl', '3 x 12'], ['plank', '3 x 30 sec'],
  ], COOL),
  day('Day 2: Full body B', 'Legs, chest, back, shoulders, arms and core', HOME_RAMP, [
    ['bodyweight-walking-lunge', '3 x 10 each leg'], ['push-up-wide', '3 x 10'], ['bent-over-two-dumbbell-row', '3 x 10'], ['side-lateral-raise', '3 x 12'], ['bench-dips', '3 x 10'], ['standing-dumbbell-calf-raise', '3 x 15'], ['crunches', '3 x 15'],
  ], COOL),
  day('Day 3: Full body C', 'Legs, chest, back, shoulders, arms and core', HOME_RAMP, [
    ['dumbbell-squat', '3 x 12'], ['decline-push-up', '3 x 8'], ['superman', '3 x 12'], ['single-leg-glute-bridge', '3 x 12 each leg'], ['hammer-curls', '3 x 12'], ['tricep-dumbbell-kickback', '3 x 12'], ['russian-twist', '3 x 20'],
  ], COOL),
];

const HOME_4: PlanDay[] = [
  day('Day 1: Upper body A', 'Chest, back, shoulders and arms', HOME_RAMP, [
    ['pushups', '3 x 12'], ['one-arm-dumbbell-row', '3 x 10 each arm'], ['dumbbell-shoulder-press', '3 x 10'], ['dumbbell-bicep-curl', '3 x 12'], ['bench-dips', '3 x 10'], ['plank', '3 x 30 sec'],
  ], COOL_UPPER),
  day('Day 2: Lower body A', 'Quads, hamstrings, glutes, calves and abs', HOME_RAMP, [
    ['bodyweight-squat', '3 x 15'], ['bodyweight-walking-lunge', '3 x 10 each leg'], ['single-leg-glute-bridge', '3 x 12 each leg'], ['standing-dumbbell-calf-raise', '3 x 15'], ['reverse-crunch', '3 x 15'], ['side-bridge', '3 x 20 sec each side'],
  ], COOL_LEGS),
  day('Day 3: Upper body B', 'Chest, back, shoulders and arms', HOME_RAMP, [
    ['push-up-wide', '3 x 10'], ['bent-over-two-dumbbell-row', '3 x 10'], ['side-lateral-raise', '3 x 12'], ['hammer-curls', '3 x 12'], ['tricep-dumbbell-kickback', '3 x 12'], ['superman', '3 x 12'],
  ], COOL_UPPER),
  day('Day 4: Lower body B', 'Quads, hamstrings, glutes, calves and core', HOME_RAMP, [
    ['dumbbell-squat', '3 x 12'], ['split-squat-with-dumbbells', '3 x 10 each leg'], ['butt-lift-bridge', '3 x 15'], ['dumbbell-seated-one-leg-calf-raise', '3 x 15 each leg'], ['russian-twist', '3 x 20'], ['dead-bug', '3 x 12'],
  ], COOL_LEGS),
];

const HOME_5: PlanDay[] = [
  day('Day 1: Chest and triceps', 'Chest and triceps', HOME_RAMP, [
    ['pushups', '4 x 12'], ['decline-push-up', '3 x 8'], ['push-up-wide', '3 x 10'], ['push-ups-close-triceps-position', '3 x 8'], ['bench-dips', '3 x 10'], ['tricep-dumbbell-kickback', '3 x 12'],
  ], COOL_UPPER),
  day('Day 2: Back and biceps', 'Lats, mid back, lower back and biceps', HOME_RAMP, [
    ['one-arm-dumbbell-row', '4 x 10 each arm'], ['bent-over-two-dumbbell-row', '3 x 10'], ['superman', '3 x 12'], ['hyperextensions-with-no-hyperextension-bench', '3 x 12'], ['dumbbell-bicep-curl', '3 x 12'], ['hammer-curls', '3 x 12'], ['dumbbell-shrug', '3 x 15'],
  ], COOL_UPPER),
  day('Day 3: Legs and glutes', 'Quads, hamstrings, glutes and calves', HOME_RAMP, [
    ['bodyweight-squat', '4 x 15'], ['bodyweight-walking-lunge', '3 x 10 each leg'], ['split-squat-with-dumbbells', '3 x 10 each leg'], ['single-leg-glute-bridge', '3 x 12 each leg'], ['butt-lift-bridge', '3 x 15'], ['standing-dumbbell-calf-raise', '4 x 15'], ['side-leg-raises', '3 x 15 each leg'],
  ], COOL_LEGS),
  day('Day 4: Shoulders and core', 'Shoulders and abs', HOME_RAMP, [
    ['dumbbell-shoulder-press', '4 x 10'], ['side-lateral-raise', '3 x 12'], ['front-dumbbell-raise', '3 x 12'], ['alternating-deltoid-raise', '3 x 12'], ['plank', '3 x 40 sec'], ['russian-twist', '3 x 20'], ['dead-bug', '3 x 12'],
  ], COOL_UPPER),
  day('Day 5: Full body and cardio', 'A lighter day for the whole body', HOME_RAMP, [
    ['freehand-jump-squat', '3 x 10'], ['pushups', '3 x 12'], ['mountain-climbers', '3 x 30 sec'], ['bodyweight-squat', '2 x 15'], ['plank', '3 x 30 sec'], ['fast-skipping', '3 x 45 sec'],
  ], COOL),
];

const FLOW_WARM: Move[] = [['yoga-easy-pose', 'Hold 5 breaths'], ['cat-stretch', '8 slow rounds']];
const REST_END: Move[] = [['yoga-childs-pose', 'Hold 8 breaths'], ['yoga-corpse-pose', 'Rest 2 min']];

const YOGA_3: PlanDay[] = [
  day('Day 1: Wake up and stretch', 'Whole-body flow', FLOW_WARM, [
    ['yoga-mountain-pose', 'Hold 5 breaths'], ['yoga-standing-forward-fold', 'Hold 5 breaths'], ['yoga-low-lunge', 'Hold 5 breaths each side'], ['yoga-downward-facing-dog', 'Hold 5 breaths'], ['yoga-cobra-pose', 'Hold 5 breaths'], ['yoga-seated-forward-bend', 'Hold 8 breaths'],
  ], REST_END),
  day('Day 2: Strength and balance', 'Legs, core and balance', FLOW_WARM, [
    ['yoga-chair-pose', 'Hold 5 breaths'], ['yoga-warrior-one', 'Hold 5 breaths each side'], ['yoga-warrior-two', 'Hold 5 breaths each side'], ['yoga-triangle-pose', 'Hold 5 breaths each side'], ['yoga-tree-pose', 'Hold 5 breaths each side'], ['yoga-boat-pose', 'Hold 3 breaths, twice'],
  ], REST_END),
  day('Day 3: Hips and relax', 'Hips, back and calm', FLOW_WARM, [
    ['yoga-garland-pose', 'Hold 5 breaths'], ['yoga-sphinx-pose', 'Hold 8 breaths'], ['yoga-locust-pose', 'Hold 3 breaths, twice'], ['yoga-bridge-pose', 'Hold 5 breaths, twice'], ['yoga-happy-baby', 'Hold 8 breaths'], ['hug-knees-to-chest', 'Hold 30 sec'],
  ], [['yoga-childs-pose', 'Hold 8 breaths'], ['yoga-corpse-pose', 'Rest 3 min']]),
];

const YOGA_4: PlanDay[] = [
  day('Day 1: Whole-body flow', 'Everything, gently', FLOW_WARM, [
    ['yoga-mountain-pose', 'Hold 5 breaths'], ['yoga-standing-forward-fold', 'Hold 5 breaths'], ['yoga-downward-facing-dog', 'Hold 5 breaths'], ['yoga-cobra-pose', 'Hold 5 breaths'], ['yoga-low-lunge', 'Hold 5 breaths each side'], ['yoga-seated-forward-bend', 'Hold 8 breaths'],
  ], REST_END),
  day('Day 2: Legs and balance', 'Quads, glutes and balance', FLOW_WARM, [
    ['yoga-chair-pose', 'Hold 5 breaths'], ['yoga-warrior-one', 'Hold 5 breaths each side'], ['yoga-warrior-two', 'Hold 5 breaths each side'], ['yoga-triangle-pose', 'Hold 5 breaths each side'], ['yoga-tree-pose', 'Hold 5 breaths each side'], ['yoga-garland-pose', 'Hold 5 breaths'],
  ], REST_END),
  day('Day 3: Back and core', 'Spine, abs and back', FLOW_WARM, [
    ['yoga-sphinx-pose', 'Hold 8 breaths'], ['yoga-cobra-pose', 'Hold 5 breaths'], ['yoga-locust-pose', 'Hold 3 breaths, twice'], ['yoga-boat-pose', 'Hold 3 breaths, twice'], ['yoga-bridge-pose', 'Hold 5 breaths, twice'], ['yoga-standing-side-bend', 'Hold 5 breaths each side'],
  ], REST_END),
  day('Day 4: Hips and relax', 'Hips, hamstrings and calm', FLOW_WARM, [
    ['yoga-low-lunge', 'Hold 8 breaths each side'], ['yoga-garland-pose', 'Hold 8 breaths'], ['yoga-seated-forward-bend', 'Hold 8 breaths'], ['yoga-happy-baby', 'Hold 8 breaths'], ['one-knee-to-chest', 'Hold 30 sec each leg'],
  ], [['yoga-childs-pose', 'Hold 8 breaths'], ['yoga-corpse-pose', 'Rest 3 min']]),
];

const YOGA_5: PlanDay[] = [
  day('Day 1: Sun-up flow', 'Whole-body wake-up', FLOW_WARM, [
    ['yoga-mountain-pose', 'Hold 5 breaths'], ['yoga-standing-side-bend', 'Hold 5 breaths each side'], ['yoga-standing-forward-fold', 'Hold 5 breaths'], ['yoga-downward-facing-dog', 'Hold 5 breaths'], ['yoga-cobra-pose', 'Hold 5 breaths'],
  ], REST_END),
  day('Day 2: Strength', 'Legs, shoulders and core', FLOW_WARM, [
    ['yoga-chair-pose', 'Hold 8 breaths'], ['yoga-warrior-one', 'Hold 5 breaths each side'], ['yoga-warrior-two', 'Hold 5 breaths each side'], ['yoga-boat-pose', 'Hold 3 breaths, twice'], ['yoga-locust-pose', 'Hold 3 breaths, twice'],
  ], REST_END),
  day('Day 3: Hips and hamstrings', 'Open the hips and the back of the legs', FLOW_WARM, [
    ['yoga-low-lunge', 'Hold 8 breaths each side'], ['yoga-garland-pose', 'Hold 8 breaths'], ['yoga-seated-forward-bend', 'Hold 8 breaths'], ['yoga-happy-baby', 'Hold 8 breaths'], ['world-s-greatest-stretch', '3 each side'],
  ], REST_END),
  day('Day 4: Balance and core', 'Balance, abs and back', FLOW_WARM, [
    ['yoga-tree-pose', 'Hold 5 breaths each side'], ['yoga-triangle-pose', 'Hold 5 breaths each side'], ['yoga-boat-pose', 'Hold 3 breaths, twice'], ['yoga-bridge-pose', 'Hold 5 breaths, twice'], ['yoga-sphinx-pose', 'Hold 8 breaths'],
  ], REST_END),
  day('Day 5: Slow stretch and calm', 'Wind down the week', FLOW_WARM, [
    ['yoga-standing-forward-fold', 'Hold 8 breaths'], ['yoga-low-lunge', 'Hold 5 breaths each side'], ['yoga-seated-forward-bend', 'Hold 8 breaths'], ['yoga-happy-baby', 'Hold 8 breaths'], ['hug-knees-to-chest', 'Hold 30 sec'],
  ], [['yoga-childs-pose', 'Hold 10 breaths'], ['yoga-corpse-pose', 'Rest 5 min']]),
];

const make = (kind: PlanKind, days: 3 | 4 | 5, plan: PlanDay[], blurb: string): WeeklyPlan => ({
  id: `${days}-day-${kind}`, kind, days,
  name: `${days}-day ${kind === 'gym' ? 'gym' : kind === 'home' ? 'home' : 'yoga'} plan`,
  blurb, schedule: SCHEDULE[days], plan,
});

export const WEEKLY_PLANS: WeeklyPlan[] = [
  make('gym', 3, GYM_3, 'Three full-body days. Every muscle is trained each session, so it suits beginners and busy weeks.'),
  make('gym', 4, GYM_4, 'Two upper-body and two lower-body days. Each muscle is trained twice a week.'),
  make('gym', 5, GYM_5, 'One muscle area a day, plus a lighter full-body day. For people who like to train most days.'),
  make('home', 3, HOME_3, 'Three full-body days with your body weight and a pair of dumbbells.'),
  make('home', 4, HOME_4, 'Two upper-body and two lower-body days at home. Each muscle is trained twice a week.'),
  make('home', 5, HOME_5, 'One muscle area a day at home, plus a lighter full-body day.'),
  make('yoga', 3, YOGA_3, 'Three yoga days: a flow, a strength and balance day and a hips and relax day.'),
  make('yoga', 4, YOGA_4, 'Four yoga days: flow, legs and balance, back and core, then hips and relax.'),
  make('yoga', 5, YOGA_5, 'Five yoga days from a morning flow to a slow evening stretch.'),
];

export const planById = (id: string): WeeklyPlan | undefined => WEEKLY_PLANS.find((entry) => entry.id === id);

/** Number of moves in a day, warm-up and cool-down included. */
export const dayMoveCount = (entry: PlanDay): number => entry.warmup.length + entry.main.length + entry.cooldown.length;

/** Rough length in minutes: about 45 seconds a strength move per set is hard to know, so this is a friendly guide only. */
export function dayMinutes(entry: PlanDay, kind: PlanKind): number {
  if (kind === 'yoga') return Math.round(dayMoveCount(entry) * 1.6 / 5) * 5;
  return Math.round((entry.main.length * 6 + entry.warmup.length * 3 + entry.cooldown.length * 1.5) / 5) * 5;
}
