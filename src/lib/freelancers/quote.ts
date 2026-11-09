/** Quotation maths: line items, discount, tax, deposit and milestone split. */

export interface QuoteLine { description: string; quantity: number; unitPrice: number }

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
  deposit: number;
  balance: number;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function quoteTotals(lines: QuoteLine[], discountPercent: number, taxPercent: number, depositPercent: number): QuoteTotals {
  const subtotal = round2(lines.reduce((sum, line) => sum + (Number.isFinite(line.quantity) && Number.isFinite(line.unitPrice) ? line.quantity * line.unitPrice : 0), 0));
  const discount = round2(subtotal * (Math.min(Math.max(discountPercent || 0, 0), 100) / 100));
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * (Math.max(taxPercent || 0, 0) / 100));
  const total = round2(taxable + tax);
  const deposit = round2(total * (Math.min(Math.max(depositPercent || 0, 0), 100) / 100));
  return { subtotal, discount, taxable, tax, total, deposit, balance: round2(total - deposit) };
}

/** Splits an amount into milestones by percentage; the last one absorbs rounding so the parts add up exactly. */
export function splitMilestones(total: number, percents: number[]): number[] {
  const parts = percents.map((percent) => round2(total * (percent / 100)));
  if (parts.length > 1) parts[parts.length - 1] = round2(total - parts.slice(0, -1).reduce((sum, part) => sum + part, 0));
  return parts;
}

/** Date `days` after an ISO date, as an ISO date. Empty when the input is not a date. */
export function addDays(iso: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(days)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + Math.round(days))).toISOString().slice(0, 10);
}
