/** Rupee notes and coins, shop items and question makers for the Money Shop. All amounts are whole rupees. */

export interface Denomination { value: number; kind: 'note' | 'coin' }

/** Biggest first. The ten rupee coin and note are both shown as a note to keep the tray simple. */
export const DENOMINATIONS: Denomination[] = [
  { value: 500, kind: 'note' }, { value: 200, kind: 'note' }, { value: 100, kind: 'note' }, { value: 50, kind: 'note' },
  { value: 20, kind: 'note' }, { value: 10, kind: 'note' },
  { value: 5, kind: 'coin' }, { value: 2, kind: 'coin' }, { value: 1, kind: 'coin' },
];

/** Plain colour blocks. They hint at the real colours and are labelled play money; they are not copies of notes. */
export const NOTE_STYLE: Record<number, { bg: string; fg: string }> = {
  500: { bg: '#b8b2a6', fg: '#1c1917' },
  200: { bg: '#f4c430', fg: '#1c1917' },
  100: { bg: '#b9a6e8', fg: '#1e1b4b' },
  50: { bg: '#6cc4ee', fg: '#0c4a6e' },
  20: { bg: '#c9e265', fg: '#365314' },
  10: { bg: '#a9744a', fg: '#ffffff' },
};

export interface ShopItem { id: string; name: string; emoji: string; price: number }

export const DEFAULT_SHOP: ShopItem[] = [
  { id: 'pencil', name: 'Pencil', emoji: '✏️', price: 10 },
  { id: 'notebook', name: 'Notebook', emoji: '📒', price: 35 },
  { id: 'balloon', name: 'Balloon', emoji: '🎈', price: 5 },
  { id: 'chocolate', name: 'Chocolate', emoji: '🍫', price: 20 },
  { id: 'juice', name: 'Juice', emoji: '🧃', price: 25 },
  { id: 'ball', name: 'Ball', emoji: '⚽', price: 90 },
];

export type MoneyLevel = 1 | 2 | 3;
export const MONEY_LEVELS: { id: MoneyLevel; label: string; hint: string }[] = [
  { id: 1, label: 'Easy', hint: 'Prices up to ₹50' },
  { id: 2, label: 'Medium', hint: 'Prices up to ₹200' },
  { id: 3, label: 'Hard', hint: 'Prices up to ₹500, odd amounts' },
];

const QUESTION_ITEMS: Omit<ShopItem, 'price' | 'id'>[] = [
  { name: 'pencil', emoji: '✏️' }, { name: 'notebook', emoji: '📒' }, { name: 'balloon', emoji: '🎈' }, { name: 'chocolate', emoji: '🍫' },
  { name: 'juice', emoji: '🧃' }, { name: 'ball', emoji: '⚽' }, { name: 'kite', emoji: '🪁' }, { name: 'biscuits', emoji: '🍪' },
  { name: 'ice cream', emoji: '🍦' }, { name: 'apple', emoji: '🍎' }, { name: 'banana', emoji: '🍌' }, { name: 'toy car', emoji: '🚗' },
];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function randomPrice(level: MoneyLevel): number {
  if (level === 1) return rand(1, 10) * 5;
  if (level === 2) return rand(2, 40) * 5;
  return rand(6, 99) * 5 + rand(0, 1) * rand(1, 4);
}

export interface PayQuestion { name: string; emoji: string; price: number }

export function makePayQuestion(level: MoneyLevel, previous?: number): PayQuestion {
  const item = QUESTION_ITEMS[rand(0, QUESTION_ITEMS.length - 1)];
  let price = randomPrice(level);
  while (price === previous) price = randomPrice(level);
  return { ...item, price };
}

export interface ChangeQuestion extends PayQuestion { paid: number; change: number }

const NOTES_UP = [10, 20, 50, 100, 200, 500];

/** The customer hands over the smallest note that covers the price, so the change is always something a child can make. */
export function makeChangeQuestion(level: MoneyLevel, previous?: number): ChangeQuestion {
  const item = QUESTION_ITEMS[rand(0, QUESTION_ITEMS.length - 1)];
  for (;;) {
    const price = randomPrice(level);
    const paid = NOTES_UP.find((note) => note > price);
    if (!paid || price === previous) continue;
    return { ...item, price, paid, change: paid - price };
  }
}

/** The fewest notes and coins that make an amount. */
export function breakdown(amount: number): number[] {
  const out: number[] = [];
  let left = amount;
  for (const { value } of DENOMINATIONS) {
    while (left >= value) { out.push(value); left -= value; }
  }
  return out;
}

export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
export const rupees = (amount: number) => `₹${amount}`;
