/** Study planner: spreads the hours each subject needs over the days left before its exam. */

export interface PlannerSubject {
  name: string;
  /** Exam date as YYYY-MM-DD. */
  examDate: string;
  /** Total study hours the subject still needs. */
  hoursNeeded: number;
}

export interface PlannerInput {
  subjects: PlannerSubject[];
  /** First day of the plan, YYYY-MM-DD. */
  startDate: string;
  /** Weekdays you can study, 0 = Sunday … 6 = Saturday. */
  studyWeekdays: number[];
  hoursPerDay: number;
  /** New material is finished this many days before the exam; the rest is revision. */
  revisionDays: number;
}

export interface PlanSlot {
  subject: string;
  hours: number;
}

export interface PlanDay {
  date: string;
  slots: PlanSlot[];
}

export interface PlanShortfall {
  subject: string;
  missingHours: number;
}

export interface StudyPlan {
  days: PlanDay[];
  shortfalls: PlanShortfall[];
  feasible: boolean;
  totalHours: number;
}

const BLOCK = 0.5;
const DAY_MS = 86_400_000;

const toUtc = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
};

const toIso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const valid = (iso: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(toUtc(iso));

/** Builds the plan. Each day goes, block by block, to the subject whose remaining work is most urgent. */
export function buildStudyPlan(input: PlannerInput): StudyPlan {
  const subjects = input.subjects.filter(
    (subject) => subject.name.trim() !== '' && subject.hoursNeeded > 0 && valid(subject.examDate),
  );
  const empty: StudyPlan = { days: [], shortfalls: [], feasible: true, totalHours: 0 };
  if (!subjects.length || !valid(input.startDate) || input.hoursPerDay <= 0 || !input.studyWeekdays.length) return empty;

  const start = toUtc(input.startDate);
  const revision = Math.max(0, Math.floor(input.revisionDays));
  const work = subjects.map((subject) => ({
    name: subject.name.trim(),
    remaining: subject.hoursNeeded,
    deadline: toUtc(subject.examDate) - revision * DAY_MS,
  }));
  const last = Math.max(...work.map((subject) => subject.deadline));
  const weekdays = new Set(input.studyWeekdays);
  const days: PlanDay[] = [];

  for (let ms = start; ms <= last; ms += DAY_MS) {
    if (!weekdays.has(new Date(ms).getUTCDay())) continue;
    const slots = new Map<string, number>();
    let capacity = input.hoursPerDay;
    while (capacity >= BLOCK) {
      const open = work.filter((subject) => subject.remaining > 0 && subject.deadline >= ms);
      if (!open.length) break;
      const urgency = (subject: (typeof work)[number]) => {
        const left = Math.round((subject.deadline - ms) / DAY_MS) + 1;
        return subject.remaining / left;
      };
      open.sort((a, b) => urgency(b) - urgency(a) || a.deadline - b.deadline);
      const pick = open[0];
      const step = Math.min(BLOCK, pick.remaining);
      pick.remaining -= step;
      capacity -= BLOCK;
      slots.set(pick.name, (slots.get(pick.name) ?? 0) + step);
    }
    if (slots.size) days.push({ date: toIso(ms), slots: [...slots].map(([subject, hours]) => ({ subject, hours })) });
  }

  const shortfalls = work
    .filter((subject) => subject.remaining > 0.001)
    .map((subject) => ({ subject: subject.name, missingHours: Math.round(subject.remaining * 10) / 10 }));
  const totalHours = days.reduce((sum, day) => sum + day.slots.reduce((inner, slot) => inner + slot.hours, 0), 0);
  return { days, shortfalls, feasible: shortfalls.length === 0, totalHours };
}

/** Plain-text version for copying. */
export function planToText(plan: StudyPlan): string {
  return plan.days
    .map((day) => `${day.date}: ${day.slots.map((slot) => `${slot.subject} ${slot.hours}h`).join(', ')}`)
    .join('\n');
}
