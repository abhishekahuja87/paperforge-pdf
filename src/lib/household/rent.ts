/** Logic for the rent receipt generator: the months in a range, an amount written in words and a PAN format check. */

export const MAX_RECEIPT_MONTHS = 36;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface RentMonth {
  /** Number used on the receipt, starting at 1. */
  index: number;
  /** For example "April 2026". */
  label: string;
  /** First and last day of the month, as yyyy-mm-dd. */
  from: string;
  to: string;
  /** The date the rent was paid, as yyyy-mm-dd. */
  paidOn: string;
}

const pad = (value: number) => String(value).padStart(2, '0');
const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate();

/** Parses "2026-04" into a year and month, or null when it is not a valid month. */
export function parseMonth(text: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 && year >= 1990 && year <= 2100 ? { year, month } : null;
}

/** Every month from start to end, both included. Empty when a month is invalid or the end is before the start; capped at MAX_RECEIPT_MONTHS. */
export function rentMonths(start: string, end: string, payDay: number): RentMonth[] {
  const from = parseMonth(start);
  const to = parseMonth(end);
  if (!from || !to) return [];
  const result: RentMonth[] = [];
  let { year, month } = from;
  const day = Math.min(Math.max(Math.floor(payDay) || 1, 1), 28);
  while ((year < to.year || (year === to.year && month <= to.month)) && result.length < MAX_RECEIPT_MONTHS) {
    result.push({
      index: result.length + 1,
      label: `${MONTHS[month - 1]} ${year}`,
      from: `${year}-${pad(month)}-01`,
      to: `${year}-${pad(month)}-${pad(daysIn(year, month))}`,
      paidOn: `${year}-${pad(month)}-${pad(day)}`,
    });
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return result;
}

/** How many months lie between the two months, counting both ends, without the cap. 0 when invalid. */
export function monthSpan(start: string, end: string): number {
  const from = parseMonth(start);
  const to = parseMonth(end);
  if (!from || !to) return 0;
  const span = (to.year - from.year) * 12 + (to.month - from.month) + 1;
  return span > 0 ? span : 0;
}

/** 15 Apr 2026 style date from yyyy-mm-dd. */
export function formatDay(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1].slice(0, 3)} ${match[1]}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) { parts.push(`${ONES[Math.floor(n / 100)]} Hundred`); n %= 100; }
  if (n >= 20) { parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')); } else if (n > 0) parts.push(ONES[n]);
  return parts.join(' ');
}

/** A whole number in words using the Indian system (thousand, lakh, crore). 0 gives "Zero". */
export function numberToWordsIndian(value: number): string {
  let n = Math.floor(Math.abs(value));
  if (!Number.isFinite(n)) return '';
  if (n === 0) return 'Zero';
  const units: Array<[number, string]> = [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']];
  const parts: string[] = [];
  for (const [size, name] of units) {
    if (n >= size) {
      const count = Math.floor(n / size);
      parts.push(`${count >= 100 ? numberToWordsIndian(count) : below1000(count)} ${name}`);
      n %= size;
    }
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(' ');
}

/** "Rupees Twelve Thousand Only", with paise when the amount has them. */
export function rupeesInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const cents = Math.round(amount * 100);
  const rupees = Math.floor(cents / 100);
  const paise = cents % 100;
  const main = rupees > 0 ? `Rupees ${numberToWordsIndian(rupees)}` : '';
  const small = paise > 0 ? `${rupees > 0 ? ' and ' : ''}${numberToWordsIndian(paise)} Paise` : '';
  return `${main}${small} Only`.trim();
}

/** Shape check only (five letters, four digits, one letter). It does not prove the PAN exists. */
export const isPanShape = (pan: string): boolean => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase());

/** Rent above this a year needs the landlord's PAN for an HRA claim (Rs 1 lakh, as per current Income Tax rules). */
export const HRA_PAN_LIMIT = 100000;
