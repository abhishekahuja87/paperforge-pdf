/** Clock maths and wording for the Learn the Clock tool. Times are a 12-hour hour (0-11, where 0 is twelve) and a minute (0-59). */

export interface ClockTime { h: number; m: number }

export type ClockLevel = 'oclock' | 'half' | 'quarter' | 'five' | 'any';

export const CLOCK_LEVELS: { id: ClockLevel; label: string; hint: string; minutes: number[] }[] = [
  { id: 'oclock', label: "O'clock", hint: 'Whole hours, like 3:00', minutes: [0] },
  { id: 'half', label: 'Half past', hint: 'Hours and half hours, like 3:30', minutes: [0, 30] },
  { id: 'quarter', label: 'Quarters', hint: 'Quarter past and quarter to, like 3:15', minutes: [0, 15, 30, 45] },
  { id: 'five', label: 'Five minutes', hint: 'Every five minutes, like 3:25', minutes: Array.from({ length: 12 }, (_, i) => i * 5) },
  { id: 'any', label: 'Any minute', hint: 'Every minute, like 3:47', minutes: Array.from({ length: 60 }, (_, i) => i) },
];

export const hour12 = (h: number) => (h % 12) || 12;
export const pad = (n: number) => String(n).padStart(2, '0');
export const digital = (t: ClockTime) => `${hour12(t.h)}:${pad(t.m)}`;
export const sameTime = (a: ClockTime, b: ClockTime) => a.h % 12 === b.h % 12 && a.m === b.m;

export const minuteAngle = (t: ClockTime) => t.m * 6;
/** The hour hand creeps forward with the minutes, as on a real clock. */
export const hourAngle = (t: ClockTime) => (t.h % 12) * 30 + t.m * 0.5;

const NUMBER_WORDS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
const FIVES: Record<number, string> = { 5: 'five', 10: 'ten', 20: 'twenty', 25: 'twenty-five' };

const hourWord = (h: number) => NUMBER_WORDS[h % 12];

/** "half past three", "quarter to five", "twenty-five past ten", "23 minutes past four". */
export function timeWords(t: ClockTime): string {
  const { h, m } = t;
  if (m === 0) return `${hourWord(h)} o'clock`;
  if (m === 15) return `quarter past ${hourWord(h)}`;
  if (m === 30) return `half past ${hourWord(h)}`;
  if (m === 45) return `quarter to ${hourWord(h + 1)}`;
  if (m < 30) return `${FIVES[m] ?? `${m} ${m === 1 ? 'minute' : 'minutes'}`} past ${hourWord(h)}`;
  const left = 60 - m;
  return `${FIVES[left] ?? `${left} ${left === 1 ? 'minute' : 'minutes'}`} to ${hourWord(h + 1)}`;
}

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const levelOf = (id: ClockLevel) => CLOCK_LEVELS.find((item) => item.id === id) ?? CLOCK_LEVELS[0];

export function randomTime(level: ClockLevel, avoid?: ClockTime): ClockTime {
  const minutes = levelOf(level).minutes;
  for (let tries = 0; tries < 20; tries += 1) {
    const t = { h: Math.floor(Math.random() * 12), m: minutes[Math.floor(Math.random() * minutes.length)] };
    if (!avoid || !sameTime(t, avoid)) return t;
  }
  return { h: 3, m: minutes[0] };
}

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** The right time plus three believable wrong answers, including the classic mix-up of the two hands. */
export function readOptions(answer: ClockTime, level: ClockLevel): ClockTime[] {
  const minutes = levelOf(level).minutes;
  const candidates: ClockTime[] = [
    { h: (answer.h + 1) % 12, m: answer.m },
    { h: (answer.h + 11) % 12, m: answer.m },
    // Hands swapped: reading the long hand as the hour and the short hand as the minutes.
    { h: Math.floor(answer.m / 5) % 12, m: (hour12(answer.h) * 5) % 60 },
    { h: answer.h, m: minutes[(minutes.indexOf(answer.m) + 1) % minutes.length] ?? 0 },
    { h: answer.h, m: (60 - answer.m) % 60 },
  ];
  const chosen: ClockTime[] = [];
  for (const candidate of shuffle(candidates)) {
    if (sameTime(candidate, answer) || chosen.some((item) => sameTime(item, candidate))) continue;
    chosen.push(candidate);
    if (chosen.length === 3) break;
  }
  while (chosen.length < 3) {
    const extra = randomTime(level, answer);
    if (!chosen.some((item) => sameTime(item, extra))) chosen.push(extra);
  }
  return shuffle([answer, ...chosen]);
}

/** Angle in degrees, clockwise from 12 o'clock, of a point relative to the centre. */
export const pointAngle = (dx: number, dy: number) => ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
