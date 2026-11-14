/** Problem generators for the Kids Maths Practice tool. Every problem has one whole-number answer. */

export type MathTopic = 'add' | 'subtract' | 'multiply' | 'divide' | 'money' | 'mixed';
export type MathLevel = 1 | 2 | 3;

export interface MathProblem { text: string; answer: number; rupees?: boolean }

export const MATH_TOPICS: { id: MathTopic; label: string }[] = [
  { id: 'mixed', label: 'A bit of everything' },
  { id: 'add', label: 'Adding' },
  { id: 'subtract', label: 'Taking away' },
  { id: 'multiply', label: 'Times tables' },
  { id: 'divide', label: 'Sharing (dividing)' },
  { id: 'money', label: 'Money in rupees' },
];

export const MATH_LEVELS: { id: MathLevel; label: string; hint: string }[] = [
  { id: 1, label: 'Easy', hint: 'Small numbers, tables of 2, 5 and 10' },
  { id: 2, label: 'Medium', hint: 'Numbers to 100, tables to 10' },
  { id: 3, label: 'Hard', hint: 'Numbers to 1000, tables to 12' },
];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(items: readonly T[]): T => items[rand(0, items.length - 1)];

const NAMES = ['Priya', 'Amit', 'Monika', 'Kunal', 'Sonia', 'Rahul', 'Meera', 'Arjun', 'Diya', 'Kabir'] as const;
const ITEMS: { one: string; many: string }[] = [
  { one: 'notebook', many: 'notebooks' }, { one: 'toy car', many: 'toy cars' }, { one: 'kite', many: 'kites' },
  { one: 'chocolate', many: 'chocolates' }, { one: 'ball', many: 'balls' }, { one: 'pencil box', many: 'pencil boxes' },
  { one: 'lunch box', many: 'lunch boxes' }, { one: 'storybook', many: 'storybooks' }, { one: 'water bottle', many: 'water bottles' },
];

/** Prices are friendly: multiples of 5 on Easy, of 1 or 5 on higher levels. */
const price = (level: MathLevel) => (level === 1 ? rand(1, 10) * 5 : level === 2 ? rand(4, 40) * 5 : rand(20, 200) * 5);
const small = (level: MathLevel) => (level === 1 ? rand(1, 4) * 5 : level === 2 ? rand(2, 20) * 5 : rand(10, 100) * 5);
const twoItems = () => { const a = pick(ITEMS); let b = pick(ITEMS); while (b === a) b = pick(ITEMS); return [a, b] as const; };
const twoNames = () => { const a = pick(NAMES); let b = pick(NAMES); while (b === a) b = pick(NAMES); return [a, b] as const; };

function add(level: MathLevel): MathProblem {
  const [lo, hi] = level === 1 ? [1, 9] : level === 2 ? [10, 99] : [100, 899];
  const a = rand(lo, hi); const b = rand(lo, hi);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

function subtract(level: MathLevel): MathProblem {
  const [lo, hi] = level === 1 ? [1, 20] : level === 2 ? [10, 99] : [100, 999];
  const a = rand(lo, hi); const b = rand(lo, a);
  return { text: `${a} − ${b} = ?`, answer: a - b };
}

const tables = (level: MathLevel) => (level === 1 ? [2, 5, 10] : level === 2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

function multiply(level: MathLevel): MathProblem {
  const a = pick(tables(level)); const b = rand(1, level === 3 ? 12 : 10);
  return { text: `${a} × ${b} = ?`, answer: a * b };
}

function divide(level: MathLevel): MathProblem {
  const a = pick(tables(level)); const b = rand(1, level === 3 ? 12 : 10);
  return { text: `${a * b} ÷ ${a} = ?`, answer: b };
}

function money(level: MathLevel): MathProblem {
  const kind = rand(1, 5);
  const [i1, i2] = twoItems();
  const [n1, n2] = twoNames();
  const p = price(level);
  if (kind === 1) { const d = small(level); return { text: `A ${i1.one} costs ₹${p}. A ${i2.one} costs ₹${d} more than the ${i1.one}. How much does the ${i2.one} cost?`, answer: p + d, rupees: true }; }
  if (kind === 2) { const d = small(level); return { text: `${n1} has ₹${p}. ${n2} has ₹${d} more than ${n1}. How much money do they have together?`, answer: p + p + d, rupees: true }; }
  if (kind === 3) { const q = price(level); return { text: `${n1} bought a ${i1.one} for ₹${p} and a ${i2.one} for ₹${q}. How much did ${n1} pay in all?`, answer: p + q, rupees: true }; }
  if (kind === 4) {
    const each = level === 1 ? rand(1, 5) * 5 : rand(2, level === 2 ? 20 : 60) * 5;
    const n = rand(2, level === 1 ? 3 : 5);
    const have = each * n + small(level);
    return { text: `${n1} had ₹${have}. ${n1} bought ${n} ${i1.many} at ₹${each} each. How much money is left?`, answer: have - each * n, rupees: true };
  }
  const pay = Math.ceil((p + 5) / (level === 3 ? 100 : 50)) * (level === 3 ? 100 : 50);
  return { text: `A ${i1.one} costs ₹${p}. ${n1} pays ₹${pay}. How much change does ${n1} get back?`, answer: pay - p, rupees: true };
}

export function makeProblem(topic: MathTopic, level: MathLevel): MathProblem {
  const chosen = topic === 'mixed' ? pick(['add', 'subtract', 'multiply', 'divide', 'money'] as const) : topic;
  switch (chosen) {
    case 'add': return add(level);
    case 'subtract': return subtract(level);
    case 'multiply': return multiply(level);
    case 'divide': return divide(level);
    default: return money(level);
  }
}

/** A set of different problems, with no repeats. */
export function makeSet(topic: MathTopic, level: MathLevel, count: number): MathProblem[] {
  const seen = new Set<string>();
  const out: MathProblem[] = [];
  for (let tries = 0; out.length < count && tries < count * 30; tries += 1) {
    const problem = makeProblem(topic, level);
    if (seen.has(problem.text)) continue;
    seen.add(problem.text);
    out.push(problem);
  }
  return out;
}

export const formatAnswer = (problem: MathProblem) => (problem.rupees ? `₹${problem.answer}` : String(problem.answer));
