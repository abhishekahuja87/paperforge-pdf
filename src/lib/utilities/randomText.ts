/**
 * Random text for mock-ups and tests: readable English sentences, random words and random characters.
 * All of it comes from Math.random, so it is for layouts and test data, never for passwords or secrets.
 */

type Random = () => number;

const pickFrom = <T,>(list: readonly T[], random: Random): T => list[Math.floor(random() * list.length)];

const ADJECTIVES = ['quiet', 'bright', 'old', 'small', 'busy', 'gentle', 'tall', 'clever', 'warm', 'distant', 'simple', 'steady', 'curious', 'narrow', 'golden', 'fresh', 'patient', 'lively', 'modest', 'sharp'] as const;
const NOUNS = ['river', 'market', 'teacher', 'garden', 'engine', 'neighbour', 'window', 'story', 'bridge', 'traveller', 'kitchen', 'library', 'train', 'farmer', 'lantern', 'harbour', 'painter', 'village', 'notebook', 'mountain', 'bakery', 'clock', 'student', 'road'] as const;
const VERBS = ['carries', 'watches', 'follows', 'remembers', 'repairs', 'crosses', 'greets', 'builds', 'explores', 'guides', 'paints', 'visits', 'protects', 'describes', 'measures', 'collects'] as const;
const PLACES = ['near the station', 'after the rain', 'before sunrise', 'at the edge of town', 'on a cool morning', 'beside the old wall', 'during the festival', 'without any hurry', 'in the evening light', 'across the valley'] as const;
const OPENERS = ['Every morning', 'Sometimes', 'At the end of the week', 'For a while', 'Later that day', 'Without warning', 'In the beginning'] as const;

const capitalise = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** One readable, harmless sentence built from small word lists. */
export function englishSentence(random: Random = Math.random): string {
  const subject = `the ${pickFrom(ADJECTIVES, random)} ${pickFrom(NOUNS, random)}`;
  const object = `a ${pickFrom(ADJECTIVES, random)} ${pickFrom(NOUNS, random)}`;
  const verb = pickFrom(VERBS, random);
  const place = pickFrom(PLACES, random);
  switch (Math.floor(random() * 4)) {
    case 0: return `${capitalise(subject)} ${verb} ${object} ${place}.`;
    case 1: return `${pickFrom(OPENERS, random)}, ${subject} ${verb} ${object}.`;
    case 2: return `${capitalise(subject)} ${verb} the ${pickFrom(NOUNS, random)} ${place}, and nobody minds.`;
    default: return `${capitalise(object)} ${place} ${verb.replace(/s$/, '')}s ${subject}.`;
  }
}

export function englishParagraphs(count: number, sentencesPer: number, random: Random = Math.random): string[] {
  return Array.from({ length: count }, () => Array.from({ length: sentencesPer }, () => englishSentence(random)).join(' '));
}

const WORDS = [...ADJECTIVES, ...NOUNS, 'about', 'always', 'between', 'coffee', 'dream', 'early', 'family', 'happy', 'island', 'journey', 'kind', 'listen', 'music', 'number', 'orange', 'paper', 'question', 'result', 'simple', 'table', 'under', 'visit', 'water', 'yellow', 'zebra', 'answer', 'budget', 'camera', 'doctor', 'energy', 'friend', 'ground', 'honest', 'idea', 'jacket', 'knowledge', 'letter', 'moment', 'nature', 'office', 'planet', 'quality', 'reason', 'season', 'ticket', 'union', 'valley', 'window'] as const;

export function randomWords(count: number, random: Random = Math.random): string[] {
  return Array.from({ length: count }, () => pickFrom(WORDS, random));
}

export interface CharacterSets { lower: boolean; upper: boolean; digits: boolean; symbols: boolean }

const SET_CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
} as const;

/** A string of random characters from the chosen sets. Returns an empty string when no set is chosen. */
export function randomCharacters(length: number, sets: CharacterSets, random: Random = Math.random): string {
  const pool = (Object.keys(SET_CHARS) as Array<keyof CharacterSets>).filter((key) => sets[key]).map((key) => SET_CHARS[key]).join('');
  if (pool.length === 0) return '';
  return Array.from({ length }, () => pool.charAt(Math.floor(random() * pool.length))).join('');
}
