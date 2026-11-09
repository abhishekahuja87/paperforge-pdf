/**
 * Group settle-up: who paid what, who shared it, and the fewest payments that make everyone even.
 * All money is counted in hundredths ("minor units") as whole numbers, so shares always add up exactly.
 * No currency is assumed; amounts are plain numbers.
 */

export interface Person { id: string; name: string }

export interface Expense {
  id: string;
  label: string;
  /** Amount as typed, for example "1,250.50". */
  amount: string;
  payer: string;
  /** Ids of the people who share this cost. */
  shared: string[];
  /** 'equal' splits evenly; 'shares' uses `weights` (for example 2 portions for an adult and 1 for a child). */
  mode: 'equal' | 'shares';
  weights: Record<string, string>;
}

export interface Balance { id: string; name: string; paid: number; owed: number; net: number }
export interface Transfer { from: string; to: string; amount: number }

export interface Settlement {
  balances: Balance[];
  transfers: Transfer[];
  total: number;
  /** Expenses that were skipped, with the reason, so nothing disappears silently. */
  skipped: { label: string; reason: string }[];
}

export const MAX_PEOPLE = 30;
const MAX_AMOUNT = 1e12;

/** Typed text to hundredths. Empty, negative or invalid text gives 0. */
export function toMinor(text: string): number {
  const value = Number(text.replace(/,/g, '').trim());
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) return 0;
  return Math.round(value * 100);
}

/** Positive weight from text; empty means 1. Invalid or non-positive gives 0 (the person is left out). */
function toWeight(text: string | undefined): number {
  if (text === undefined || text.trim() === '') return 1;
  const value = Number(text.replace(/,/g, '').trim());
  return Number.isFinite(value) && value > 0 && value <= 1e6 ? value : 0;
}

/**
 * Splits `total` hundredths between the given weights. Each share is rounded down and the leftover hundredths go
 * to the largest remainders; `rotate` moves the tie-break around so the same person is not always charged the extra.
 */
export function allocate(total: number, weights: number[], rotate = 0): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const shares = exact.map(Math.floor);
  let left = total - shares.reduce((a, b) => a + b, 0);
  const n = weights.length;
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value), tie: (index + rotate) % n }))
    .filter((item) => weights[item.index]! > 0)
    .sort((a, b) => b.fraction - a.fraction || a.tie - b.tie);
  for (let i = 0; left > 0 && order.length > 0; i = (i + 1) % order.length) {
    shares[order[i]!.index]! += 1;
    left -= 1;
  }
  return shares;
}

/** Greedy payments inside one group: the biggest debtor pays the biggest creditor until all are even. */
function greedy(entries: { id: string; net: number }[]): Transfer[] {
  const owe = entries.filter((e) => e.net < 0).map((e) => ({ id: e.id, left: -e.net })).sort((a, b) => b.left - a.left);
  const get = entries.filter((e) => e.net > 0).map((e) => ({ id: e.id, left: e.net })).sort((a, b) => b.left - a.left);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < owe.length && j < get.length) {
    const amount = Math.min(owe[i]!.left, get[j]!.left);
    if (amount > 0) out.push({ from: owe[i]!.id, to: get[j]!.id, amount });
    owe[i]!.left -= amount;
    get[j]!.left -= amount;
    if (owe[i]!.left === 0) i += 1;
    if (get[j]!.left === 0) j += 1;
  }
  return out;
}

/** Largest number of people for which the exact search is used (2^16 subsets). */
const EXACT_LIMIT = 16;

/**
 * Fewest payments. A group of people whose balances add up to zero can settle among themselves with one payment
 * fewer than its size, so the best answer splits everyone into as many such groups as possible. For up to 16 people
 * with a balance this is found exactly; for larger sets the simple greedy method is used (never worse than n - 1).
 */
export function minimalTransfers(nets: { id: string; net: number }[]): Transfer[] {
  const people = nets.filter((e) => e.net !== 0);
  const n = people.length;
  if (n === 0) return [];
  if (n > EXACT_LIMIT) return greedy(people);
  const size = 1 << n;
  const sums = new Float64Array(size);
  for (let mask = 1; mask < size; mask += 1) {
    const low = 31 - Math.clz32(mask & -mask);
    sums[mask] = sums[mask & (mask - 1)]! + people[low]!.net;
  }
  const best = new Int16Array(size);
  const pick = new Int8Array(size);
  for (let mask = 1; mask < size; mask += 1) {
    let top = -1;
    let which = 0;
    for (let bit = 0; bit < n; bit += 1) {
      if (!(mask & (1 << bit))) continue;
      const value = best[mask ^ (1 << bit)]!;
      if (value > top) { top = value; which = bit; }
    }
    best[mask] = top + (sums[mask] === 0 ? 1 : 0);
    pick[mask] = which;
  }
  // Walk back from the full set to learn the order people were added; a running total of zero ends a group.
  const order: number[] = [];
  for (let mask = size - 1; mask > 0; mask ^= 1 << pick[mask]!) order.push(pick[mask]!);
  order.reverse();
  const groups: { id: string; net: number }[][] = [[]];
  let running = 0;
  for (const bit of order) {
    const entry = people[bit]!;
    groups[groups.length - 1]!.push(entry);
    running += entry.net;
    if (running === 0) groups.push([]);
  }
  return groups.filter((g) => g.length > 0).flatMap(greedy);
}

export function computeSettlement(people: Person[], expenses: Expense[]): Settlement {
  const index = new Map(people.map((p, i) => [p.id, i]));
  const paid = people.map(() => 0);
  const owed = people.map(() => 0);
  const skipped: Settlement['skipped'] = [];
  let total = 0;
  expenses.forEach((expense, position) => {
    const label = expense.label.trim() || `Expense ${position + 1}`;
    const amount = toMinor(expense.amount);
    if (amount === 0 && expense.amount.trim() === '') return;
    if (amount === 0) { skipped.push({ label, reason: 'amount is not a positive number' }); return; }
    const payer = index.get(expense.payer);
    if (payer === undefined) { skipped.push({ label, reason: 'no one is marked as the payer' }); return; }
    const members = expense.shared.filter((id) => index.has(id));
    const weights = members.map((id) => (expense.mode === 'shares' ? toWeight(expense.weights[id]) : 1));
    if (weights.every((w) => w === 0)) { skipped.push({ label, reason: 'no one is sharing it' }); return; }
    const parts = allocate(amount, weights, position);
    members.forEach((id, k) => { owed[index.get(id)!]! += parts[k]!; });
    paid[payer]! += amount;
    total += amount;
  });
  const balances = people.map((p, i) => ({ id: p.id, name: p.name, paid: paid[i]!, owed: owed[i]!, net: paid[i]! - owed[i]! }));
  return { balances, transfers: minimalTransfers(balances), total, skipped };
}

/** Plain number with grouping; whole amounts have no decimals. Optional label such as "$", "EUR" or "Rs". */
export function formatMoney(minor: number, label = ''): string {
  const whole = minor % 100 === 0;
  const text = (minor / 100).toLocaleString(undefined, { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
  const tag = label.trim();
  if (!tag) return text;
  return /^[\p{L}]{2,}$/u.test(tag) ? `${tag} ${text}` : `${tag}${text}`;
}

export function settlementText(title: string, people: Person[], result: Settlement, label: string): string {
  const name = new Map(people.map((p) => [p.id, p.name]));
  const head = title.trim() || 'Group settle-up';
  const lines = [head, `Total spent: ${formatMoney(result.total, label)}`];
  if (result.transfers.length === 0) lines.push('Everyone is even. No payments needed.');
  else {
    lines.push('', 'Payments:');
    for (const t of result.transfers) lines.push(`${name.get(t.from)} pays ${name.get(t.to)} ${formatMoney(t.amount, label)}`);
  }
  lines.push('', 'mydailyutils.in/bill-splitter');
  return lines.join('\n');
}
