/** Freelance rate maths: turns the income you want into the rate you must charge, and back. */

export interface RateInput {
  /** Take-home income wanted per year, after tax. */
  targetIncome: number;
  /** Business costs per year: software, equipment, insurance, co-working, accounting. */
  overhead: number;
  /** Things an employer would normally pay: health cover, retirement saving, training. Per year. */
  benefits: number;
  /** Share of revenue you set aside for tax, 0-60. */
  taxPercent: number;
  /** Weeks per year you do not work: holidays, public holidays, sick days. */
  weeksOff: number;
  daysPerWeek: number;
  hoursPerWeek: number;
  /** Share of working hours you can actually bill (the rest is admin, sales, learning), 1-100. */
  billablePercent: number;
  /** Extra margin on top for slow months and growth, 0-100. */
  bufferPercent: number;
}

export interface RateResult {
  billableHours: number;
  billableDays: number;
  /** Revenue to bring in over the year before tax, overhead and buffer are covered. */
  revenueNeeded: number;
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
}

export function computeRate(input: RateInput): RateResult | null {
  const values = Object.values(input);
  if (!values.every(Number.isFinite)) return null;
  const { targetIncome, overhead, benefits, taxPercent, weeksOff, daysPerWeek, hoursPerWeek, billablePercent, bufferPercent } = input;
  if (targetIncome < 0 || overhead < 0 || benefits < 0 || taxPercent < 0 || taxPercent >= 100) return null;
  if (weeksOff < 0 || weeksOff >= 52 || daysPerWeek <= 0 || daysPerWeek > 7 || hoursPerWeek <= 0 || billablePercent <= 0 || billablePercent > 100 || bufferPercent < 0) return null;
  const weeks = 52 - weeksOff;
  const billableHours = weeks * hoursPerWeek * (billablePercent / 100);
  const billableDays = weeks * daysPerWeek * (billablePercent / 100);
  const afterTax = targetIncome / (1 - taxPercent / 100);
  const revenueNeeded = (afterTax + overhead + benefits) * (1 + bufferPercent / 100);
  const hourly = revenueNeeded / billableHours;
  return { billableHours, billableDays, revenueNeeded, hourly, daily: revenueNeeded / billableDays, weekly: revenueNeeded / weeks, monthly: revenueNeeded / 12 };
}

/** Take-home income per year if you charge a given hourly rate, using the same assumptions. */
export function incomeAtRate(rate: number, input: RateInput): number | null {
  const result = computeRate(input);
  if (!result || !Number.isFinite(rate) || rate < 0) return null;
  const revenue = rate * result.billableHours;
  return Math.max(0, revenue - input.overhead - input.benefits) * (1 - input.taxPercent / 100);
}

/** A project price from the hours you expect it to take, with a cushion for scope creep. */
export function projectPrice(hours: number, hourly: number, cushionPercent: number): number | null {
  if (![hours, hourly, cushionPercent].every(Number.isFinite) || hours <= 0 || hourly < 0 || cushionPercent < 0) return null;
  return hours * (1 + cushionPercent / 100) * hourly;
}
