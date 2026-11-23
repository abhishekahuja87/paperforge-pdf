/**
 * Checks the fixed weekly plans: every id exists and has four or two pictures, no move repeats inside a day,
 * every non-yoga plan trains all main muscles, home plans need only body weight, dumbbells or a band, and gym 4 and 5 day plans have the right day count.
 * Usage: node --experimental-strip-types scripts/check-weekly-plans.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { WEEKLY_PLANS } from '../src/lib/fitness/weeklyPlans.ts';

const library = [...JSON.parse(readFileSync('src/data/exerciseLibrary.json', 'utf8')), ...JSON.parse(readFileSync('src/data/yogaLibrary.json', 'utf8'))];
const byId = new Map(library.map((entry) => [entry.id, entry]));
const MUSCLES = ['chest', 'lats', 'mid back', 'lower back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];
let problems = 0;
const fail = (text) => { problems += 1; console.log('PROBLEM:', text); };

for (const plan of WEEKLY_PLANS) {
  if (plan.plan.length !== plan.days) fail(`${plan.id}: ${plan.plan.length} days, expected ${plan.days}`);
  const trained = new Set();
  plan.plan.forEach((day, index) => {
    const seen = new Set();
    for (const [id] of [...day.warmup, ...day.main, ...day.cooldown]) {
      const entry = byId.get(id);
      if (!entry) { fail(`${plan.id} day ${index + 1}: unknown id ${id}`); continue; }
      if (seen.has(id)) fail(`${plan.id} day ${index + 1}: ${id} repeats`);
      seen.add(id);
      const frames = entry.frames ?? 2;
      for (let frame = 0; frame < frames; frame += 1) if (!existsSync(`public/exercises/${id}/${frame}.webp`)) fail(`missing picture ${id}/${frame}`);
      if (plan.kind === 'yoga' && !(entry.group === 'yoga' || entry.group === 'stretching')) fail(`${plan.id}: ${id} is not yoga or a stretch`);
      if (plan.kind === 'home' && !['bodyweight', 'dumbbell', 'other'].includes(entry.equipment)) fail(`${plan.id}: ${id} needs ${entry.equipment}`);
      if (plan.kind === 'gym' && entry.group === 'yoga') fail(`${plan.id}: has yoga ${id}`);
    }
    for (const id of day.main) {
      const entry = byId.get(id[0]);
      if (entry) for (const muscle of [...entry.muscles, ...entry.secondary]) trained.add(muscle);
    }
    if (day.main.length < 5 || day.main.length > 8) fail(`${plan.id} day ${index + 1}: ${day.main.length} main moves`);
  });
  if (plan.kind !== 'yoga') {
    const missing = MUSCLES.filter((muscle) => !trained.has(muscle));
    if (missing.length) fail(`${plan.id}: does not train ${missing.join(', ')}`);
  }
  console.log(`${plan.id}: ${plan.plan.map((day) => day.main.length).join('/')} main moves`);
}
console.log(problems ? `${problems} problem(s)` : 'All plans OK');
process.exit(problems ? 1 : 0);
