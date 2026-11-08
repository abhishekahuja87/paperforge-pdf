const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

/** Whole number in words using lakh and crore (for example 12,34,567). */
export function integerToIndianWords(value: number): string {
  if (value === 0) return 'Zero';
  const parts: string[] = [];
  let n = Math.floor(value);
  const crore = Math.floor(n / 1e7);
  if (crore > 0) {
    parts.push(`${integerToIndianWords(crore)} Crore`);
    n %= 1e7;
  }
  const lakh = Math.floor(n / 1e5);
  if (lakh > 0) {
    parts.push(`${below1000(lakh)} Lakh`);
    n %= 1e5;
  }
  const thousand = Math.floor(n / 1e3);
  if (thousand > 0) {
    parts.push(`${below1000(thousand)} Thousand`);
    n %= 1e3;
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(' ');
}

/** Whole number in words using thousand, million and billion. */
export function integerToInternationalWords(value: number): string {
  if (value === 0) return 'Zero';
  const scales: [number, string][] = [[1e12, 'Trillion'], [1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']];
  const parts: string[] = [];
  let n = Math.floor(value);
  for (const [size, name] of scales) {
    const chunk = Math.floor(n / size);
    if (chunk > 0) {
      parts.push(`${below1000(chunk % 1000 === chunk ? chunk : chunk % 1000)} ${name}`);
      n %= size;
    }
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(' ');
}

export const MAX_WORDS_VALUE = 999_999_999_999;

/** "Rupees ... and ... Paise Only" for a cheque or invoice. Returns null for invalid input. */
export function amountToRupeeWords(amount: number, system: 'indian' | 'international'): string | null {
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_WORDS_VALUE) return null;
  const totalPaise = Math.round(amount * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const toWords = system === 'indian' ? integerToIndianWords : integerToInternationalWords;
  const rupeeText = `${toWords(rupees)} ${rupees === 1 ? 'Rupee' : 'Rupees'}`;
  return paise > 0 ? `${rupeeText} and ${toWords(paise)} Paise Only` : `${rupeeText} Only`;
}
