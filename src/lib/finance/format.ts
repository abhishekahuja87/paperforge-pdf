const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Whole rupees with Indian digit grouping, for example ₹12,34,567. */
export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return '₹0';
  return `${value < 0 ? '-' : ''}₹${inr.format(Math.abs(Math.round(value)))}`;
}

/** Rupees and paise, for example ₹1,234.50. */
export function formatInrPaise(value: number): string {
  if (!Number.isFinite(value)) return '₹0.00';
  return `${value < 0 ? '-' : ''}₹${inr2.format(Math.abs(value))}`;
}

/** Short Indian wording such as "12.5 lakh" or "1.2 crore" to help people check a typed amount. */
export function amountInWords(value: number): string {
  const v = Math.abs(value);
  if (!Number.isFinite(v) || v < 1000) return '';
  const trim = (n: number) => String(Number(n.toFixed(2)));
  if (v >= 1e7) return `${trim(v / 1e7)} crore`;
  if (v >= 1e5) return `${trim(v / 1e5)} lakh`;
  return `${trim(v / 1e3)} thousand`;
}

/** Turns the text of a number field into a safe, non-negative number (0 when empty or invalid). */
export function parseAmount(text: string): number {
  const value = Number(text.replace(/,/g, '').trim());
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
