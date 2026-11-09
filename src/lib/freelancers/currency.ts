/** Currencies offered by the freelancer tools. Codes are ISO 4217; Intl supplies the symbol and grouping. */
export const CURRENCIES = [
  { code: 'USD', name: 'US dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British pound' },
  { code: 'INR', name: 'Indian rupee' }, { code: 'AUD', name: 'Australian dollar' }, { code: 'CAD', name: 'Canadian dollar' },
  { code: 'SGD', name: 'Singapore dollar' }, { code: 'AED', name: 'UAE dirham' }, { code: 'CHF', name: 'Swiss franc' },
  { code: 'JPY', name: 'Japanese yen' }, { code: 'ZAR', name: 'South African rand' }, { code: 'NZD', name: 'New Zealand dollar' },
] as const;

export const formatMoney = (value: number, currency: string, fractionDigits?: number): string => {
  if (!Number.isFinite(value)) return '-';
  const digits = fractionDigits ?? (currency === 'JPY' ? 0 : 2);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  } catch {
    return `${currency} ${value.toFixed(digits)}`;
  }
};
