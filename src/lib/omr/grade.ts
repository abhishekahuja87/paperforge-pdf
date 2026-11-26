/** The answer key and the marks. */
import { LETTERS } from './layout';
import type { Mark } from './scan';

/** Reads a key typed as letters (ABCDDCBA) or as pairs (1 A, 2-B, 3:C, 4. D). Gives the option number for each question, or -1 where nothing was given. */
export function parseKey(text: string, questions: number, options: number): number[] {
  const out = new Array<number>(questions).fill(-1), upper = text.toUpperCase(), valid = LETTERS.slice(0, options);
  const pairs = [...upper.matchAll(/(\d{1,3})\s*[-:.)=,\s]*\s*([A-E])(?![A-Z])/g)];
  if (/\d/.test(upper) && pairs.length > 0) {
    for (const [, n, letter] of pairs) { const q = Number(n) - 1, o = valid.indexOf(letter!); if (q >= 0 && q < questions && o >= 0) out[q] = o; }
    return out;
  }
  const letters = [...upper].filter((c) => /[A-E]/.test(c));
  letters.slice(0, questions).forEach((c, q) => { const o = valid.indexOf(c); if (o >= 0) out[q] = o; });
  return out;
}

export interface Marking { perRight: number; perWrong: number }
export interface Graded { right: number; wrong: number; blank: number; multiple: number; score: number; total: number; percent: number; verdict: ('right' | 'wrong' | 'blank' | 'multiple' | 'nokey')[] }

/** Marks for one sheet. A blank answer or two marks on one question earns nothing and loses nothing. Questions with no key are left out. */
export function gradeSheet(answers: Mark[], key: number[], marking: Marking): Graded {
  let right = 0, wrong = 0, blank = 0, multiple = 0, counted = 0; const verdict: Graded['verdict'] = [];
  answers.forEach((mark, q) => {
    if (key[q] === undefined || key[q]! < 0) { verdict.push('nokey'); return; }
    counted += 1;
    if (mark.multiple) { multiple += 1; verdict.push('multiple'); } else if (mark.chosen < 0) { blank += 1; verdict.push('blank'); } else if (mark.chosen === key[q]) { right += 1; verdict.push('right'); } else { wrong += 1; verdict.push('wrong'); }
  });
  const score = Math.round((right * marking.perRight - wrong * marking.perWrong) * 100) / 100, total = Math.round(counted * marking.perRight * 100) / 100;
  return { right, wrong, blank, multiple, score, total, percent: total > 0 ? Math.round((score / total) * 1000) / 10 : 0, verdict };
}
