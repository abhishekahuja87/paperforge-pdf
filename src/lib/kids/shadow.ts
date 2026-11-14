/** Shadow maths and questions for the Shadow and Sun Explorer. The sun angle runs from 0 (sunrise, left) to 180 (sunset, right). */

export const SCENE = { width: 400, height: 240, ground: 190, cx: 200, radius: 165, minAlpha: 6, maxAlpha: 174, minX: 40, maxX: 360, maxShadow: 340 };

export type SubjectId = 'person' | 'tree' | 'pole';
export const SUBJECTS: { id: SubjectId; label: string; height: number }[] = [
  { id: 'person', label: 'Person', height: 70 },
  { id: 'tree', label: 'Tree', height: 105 },
  { id: 'pole', label: 'Flagpole', height: 130 },
];

export type Side = 'left' | 'right' | 'under';

/** Height of the sun above the horizon, in degrees. */
export const elevation = (alpha: number) => (alpha <= 90 ? alpha : 180 - alpha);

/** Clock time for the sun position, 6:00 in the morning to 18:00 in the evening. */
export const sunTime = (alpha: number) => {
  const minutes = Math.round((360 + (alpha / 180) * 720) / 5) * 5;
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const sunPoint = (alpha: number) => {
  const rad = (alpha * Math.PI) / 180;
  return { x: SCENE.cx - SCENE.radius * Math.cos(rad), y: SCENE.ground - SCENE.radius * Math.sin(rad) };
};

/** Which side the shadow falls on. The sun on the left throws the shadow to the right. */
export const shadowSide = (alpha: number): Side => (elevation(alpha) >= 84 ? 'under' : alpha < 90 ? 'right' : 'left');

export const shadowLength = (height: number, alpha: number) => {
  const e = elevation(alpha);
  if (e >= 84) return 0;
  return Math.min(SCENE.maxShadow, height / Math.tan((e * Math.PI) / 180));
};

export const shadowKind = (alpha: number): 'long' | 'short' | 'medium' => {
  const e = elevation(alpha);
  return e <= 35 ? 'long' : e >= 60 ? 'short' : 'medium';
};

export const describe = (alpha: number) => {
  const side = shadowSide(alpha);
  const kind = shadowKind(alpha);
  if (side === 'under') return 'The sun is right overhead, so the shadow is just a small patch under the feet.';
  const where = side === 'left' ? 'to the left' : 'to the right';
  const size = kind === 'long' ? 'long, because the sun is low in the sky' : kind === 'short' ? 'short, because the sun is high in the sky' : 'a medium length';
  return `The sun is on the ${side === 'left' ? 'right' : 'left'}, so the shadow falls ${where} and is ${size}.`;
};

export const angleFromPoint = (x: number, y: number) => {
  const dx = x - SCENE.cx;
  const dy = SCENE.ground - y;
  const deg = dy <= 0 ? (dx < 0 ? 180 : 0) : (Math.atan2(dy, dx) * 180) / Math.PI;
  return Math.min(SCENE.maxAlpha, Math.max(SCENE.minAlpha, 180 - deg));
};

export type QuestionKind = 'side' | 'length' | 'set';
export interface ShadowQuestion {
  kind: QuestionKind;
  subject: SubjectId;
  personX: number;
  alpha: number;
  prompt: string;
  /** For side and length: the choices and the right one. */
  options: { id: string; label: string }[];
  answer: string;
  /** For set: a check on the sun position. */
  target?: { test: (alpha: number) => boolean; hint: string };
}

export const SHADOW_LEVELS = [
  { id: 1, label: 'Easy', hint: 'Which side does the shadow fall?' },
  { id: 2, label: 'Medium', hint: 'Side, and long or short' },
  { id: 3, label: 'Hard', hint: 'Also move the sun to make a shadow' },
] as const;
export type ShadowLevel = (typeof SHADOW_LEVELS)[number]['id'];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

const SET_TARGETS: { prompt: string; hint: string; test: (alpha: number) => boolean }[] = [
  { prompt: 'Move the sun so the shadow falls to the left and is long.', hint: 'Put the sun low on the right.', test: (a) => a >= 130 && a <= 172 },
  { prompt: 'Move the sun so the shadow falls to the right and is long.', hint: 'Put the sun low on the left.', test: (a) => a >= 8 && a <= 50 },
  { prompt: 'Move the sun so the shadow falls to the left and is short.', hint: 'Put the sun high, on the right side.', test: (a) => a >= 101 && a <= 124 },
  { prompt: 'Move the sun so the shadow falls to the right and is short.', hint: 'Put the sun high, on the left side.', test: (a) => a >= 56 && a <= 79 },
  { prompt: 'Make the shadow as small as you can.', hint: 'Put the sun right overhead, at noon.', test: (a) => elevation(a) >= 84 },
];

export const makeShadowQuestion = (level: ShadowLevel): ShadowQuestion => {
  const subject = pick(SUBJECTS).id;
  const personX = Math.round(rand(110, 290));
  const roll = level === 1 ? 0 : level === 2 ? Math.random() : 0.3 + Math.random() * 0.7;
  const sideOptions = [{ id: 'left', label: 'To the left' }, { id: 'right', label: 'To the right' }];
  if (level >= 2 && roll < 0.2) {
    return { kind: 'side', subject, personX, alpha: rand(88, 92), prompt: 'Where does the shadow fall?', options: [...sideOptions, { id: 'under', label: 'Right under the feet' }], answer: 'under' };
  }
  if (level >= 2 && roll < 0.6) {
    const long = Math.random() < 0.5;
    const e = long ? rand(10, 30) : rand(62, 78);
    const a = Math.random() < 0.5 ? e : 180 - e;
    return { kind: 'length', subject, personX, alpha: a, prompt: 'Is the shadow long or short?', options: [{ id: 'long', label: 'Long' }, { id: 'short', label: 'Short' }], answer: long ? 'long' : 'short' };
  }
  if (level === 3 && roll >= 0.6) {
    const target = pick(SET_TARGETS);
    return { kind: 'set', subject, personX, alpha: 90, prompt: target.prompt, options: [], answer: '', target: { test: target.test, hint: target.hint } };
  }
  const e = rand(14, 70);
  const alpha = Math.random() < 0.5 ? e : 180 - e;
  return { kind: 'side', subject, personX, alpha, prompt: 'Where does the shadow fall?', options: sideOptions, answer: shadowSide(alpha) };
};
