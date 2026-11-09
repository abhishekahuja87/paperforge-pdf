/** Month-by-month loan schedule with optional extra payments, and ways to pay less interest. All amounts are in rupees. */

export interface OneTimeExtra { month: number; amount: number }
export interface RepeatExtra { every: number; amount: number; start: number }
export interface Extras { oneTime: OneTimeExtra[]; repeat: RepeatExtra | null }

export interface ScheduleRow {
  month: number;
  /** The regular EMI paid this month (the last one may be smaller). */
  emi: number;
  principal: number;
  interest: number;
  /** Extra payment made this month, all of it against the balance. */
  extra: number;
  balance: number;
}

export interface Schedule {
  emi: number;
  rows: ScheduleRow[];
  /** Months until the loan is closed. */
  months: number;
  totalInterest: number;
  totalExtra: number;
  totalPaid: number;
}

export const NO_EXTRAS: Extras = { oneTime: [], repeat: null };
const MAX_MONTHS = 1200;

/** The regular monthly instalment for a loan. */
export function monthlyEmi(principal: number, annualRate: number, months: number): number {
  const n = Math.max(1, Math.round(months));
  const r = annualRate / 1200;
  return r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
}

/** Total extra money to pay in a given month (one-time payments and the repeating payment together). */
export function extraForMonth(extras: Extras, month: number): number {
  let total = 0;
  for (const item of extras.oneTime) if (item.month === month) total += item.amount;
  const repeat = extras.repeat;
  if (repeat && repeat.every > 0 && month >= repeat.start && (month - repeat.start) % repeat.every === 0) total += repeat.amount;
  return total;
}

/**
 * Builds the schedule. The EMI stays the same and extra payments shorten the loan. Interest each month is on the
 * balance left after the previous month, which is how banks usually charge it on a reducing-balance loan.
 */
export function buildSchedule(principal: number, annualRate: number, tenureMonths: number, extras: Extras = NO_EXTRAS): Schedule {
  const n = Math.max(1, Math.round(tenureMonths));
  const r = annualRate / 1200;
  const emi = monthlyEmi(principal, annualRate, n);
  const rows: ScheduleRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalExtra = 0;
  for (let month = 1; balance > 0.005 && month <= Math.min(MAX_MONTHS, n + 1); month += 1) {
    const interest = balance * r;
    const paid = Math.min(emi, balance + interest);
    const principalPart = Math.min(balance, paid - interest);
    const extra = Math.min(extraForMonth(extras, month), Math.max(0, balance - principalPart));
    balance = Math.max(0, balance - principalPart - extra);
    if (balance < 0.005) balance = 0;
    totalInterest += interest;
    totalExtra += extra;
    rows.push({ month, emi: paid, principal: principalPart, interest, extra, balance });
  }
  return { emi, rows, months: rows.length, totalInterest, totalExtra, totalPaid: principal + totalInterest };
}

export interface YearRow { year: number; principal: number; interest: number; extra: number; balance: number }

/** Adds the monthly rows up into loan years (months 1 to 12 are year 1, and so on). */
export function yearlyRows(rows: ScheduleRow[]): YearRow[] {
  const years: YearRow[] = [];
  for (const row of rows) {
    const year = Math.ceil(row.month / 12);
    let entry = years[years.length - 1];
    if (!entry || entry.year !== year) { entry = { year, principal: 0, interest: 0, extra: 0, balance: 0 }; years.push(entry); }
    entry.principal += row.principal + row.extra;
    entry.interest += row.interest;
    entry.extra += row.extra;
    entry.balance = row.balance;
  }
  return years;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Dec 2026" for month number `month` when the first EMI falls in `start` (yyyy-mm); otherwise "Month 5". */
export function monthLabel(start: string, month: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(start);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return `Month ${month}`;
  const index = Number(match[1]) * 12 + (Number(match[2]) - 1) + (month - 1);
  return `${MONTH_NAMES[index % 12]} ${Math.floor(index / 12)}`;
}

/** "17 years 3 months" style text. */
export function durationText(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : '', rest > 0 ? `${rest} ${rest === 1 ? 'month' : 'months'}` : ''].filter(Boolean);
  return parts.join(' ') || '0 months';
}

export interface TenureOption { months: number; emi: number; extraPerMonth: number; totalInterest: number; interestSaved: number }
export interface ExtraOption { label: string; months: number; monthsSaved: number; interestSaved: number }
export interface LoanOption { label: string; principal: number; rate: number; emi: number; totalInterest: number; interestSaved: number; upfront: number }

export interface Advice {
  base: Schedule;
  /** Shorter terms, from the current tenure down. */
  tenures: TenureOption[];
  /** The shortest term whose EMI is no more than 20% above today's, or null. */
  pick: TenureOption | null;
  extras: ExtraOption[];
  borrowLess: LoanOption[];
  lowerRate: LoanOption[];
}

const roundTo = (value: number, step: number) => Math.max(step, Math.round(value / step) * step);

/** Alternatives worth comparing with the loan as asked. Each one changes a single thing. */
export function adviseLoan(principal: number, annualRate: number, tenureMonths: number): Advice {
  const n = Math.max(1, Math.round(tenureMonths));
  const base = buildSchedule(principal, annualRate, n);

  const tenures: TenureOption[] = [];
  for (const cut of [0, 12, 24, 36, 60, 120]) {
    const months = n - cut;
    if (months < 12 && cut > 0) continue;
    if (months < 1) continue;
    const schedule = buildSchedule(principal, annualRate, months);
    tenures.push({ months, emi: schedule.emi, extraPerMonth: schedule.emi - base.emi, totalInterest: schedule.totalInterest, interestSaved: base.totalInterest - schedule.totalInterest });
  }
  const pick = [...tenures].filter((item) => item.months < n && item.emi <= base.emi * 1.2).sort((a, b) => a.months - b.months)[0] ?? null;

  const extraRules: { label: string; extras: Extras }[] = [5, 10, 20].map((percent) => {
    const amount = roundTo((base.emi * percent) / 100, 100);
    return { label: `Extra ${amount.toLocaleString('en-IN')} every month (${percent}% of the EMI)`, extras: { oneTime: [], repeat: { every: 1, amount, start: 1 } } };
  });
  extraRules.push({ label: 'One extra EMI every year', extras: { oneTime: [], repeat: { every: 12, amount: Math.round(base.emi), start: 12 } } });
  const extras: ExtraOption[] = extraRules.map((rule) => {
    const schedule = buildSchedule(principal, annualRate, n, rule.extras);
    return { label: rule.label, months: schedule.months, monthsSaved: base.months - schedule.months, interestSaved: base.totalInterest - schedule.totalInterest };
  });

  const loanOption = (label: string, amount: number, rate: number): LoanOption => {
    const schedule = buildSchedule(amount, rate, n);
    return { label, principal: amount, rate, emi: schedule.emi, totalInterest: schedule.totalInterest, interestSaved: base.totalInterest - schedule.totalInterest, upfront: principal - amount };
  };
  const borrowLess = [5, 10, 20].map((percent) => loanOption(`${percent}% less`, Math.round(principal * (1 - percent / 100)), annualRate));
  const lowerRate = annualRate > 1 ? [0.25, 0.5, 1].filter((cut) => annualRate - cut > 0).map((cut) => loanOption(`${cut}% lower`, principal, annualRate - cut)) : [];

  return { base, tenures, pick, extras, borrowLess, lowerRate };
}

/** What the person typed for extra payments. Text, so a half-typed number is not thrown away. */
export interface ExtraInputs {
  /** Repeating payment: every N months, this amount, from this month number. */
  every: string;
  amount: string;
  start: string;
  /** One-time payments. */
  rows: { id: string; month: string; amount: string }[];
}

const whole = (text: string): number => {
  const value = Number(text.replace(/,/g, '').trim());
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};
const money = (text: string): number => {
  const value = Number(text.replace(/,/g, '').trim());
  return Number.isFinite(value) && value > 0 ? value : 0;
};

/** Turns the typed values into extra payments. Rows that are empty or have a month or amount of 0 are left out. */
export function parseExtras(input: ExtraInputs): Extras {
  const every = whole(input.every);
  const amount = money(input.amount);
  return {
    oneTime: input.rows.map((row) => ({ month: whole(row.month), amount: money(row.amount) })).filter((item) => item.month > 0 && item.amount > 0),
    repeat: every > 0 && amount > 0 ? { every, amount, start: Math.max(1, whole(input.start) || 1) } : null,
  };
}

export const hasExtras = (extras: Extras): boolean => extras.oneTime.length > 0 || extras.repeat !== null;
