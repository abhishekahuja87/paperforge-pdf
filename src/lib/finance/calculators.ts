export interface EmiYear { year: number; principal: number; interest: number; balance: number }
export interface EmiResult { emi: number; totalInterest: number; totalPayment: number; years: EmiYear[] }

export function computeEmi(principal: number, annualRate: number, months: number): EmiResult {
  const n = Math.max(1, Math.round(months));
  const r = annualRate / 12 / 100;
  const emi = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const years: EmiYear[] = [];
  let balance = principal;
  let yearPrincipal = 0;
  let yearInterest = 0;
  for (let month = 1; month <= n; month += 1) {
    const interest = balance * r;
    const principalPart = Math.min(balance, emi - interest);
    balance = Math.max(0, balance - principalPart);
    yearPrincipal += principalPart;
    yearInterest += interest;
    if (month % 12 === 0 || month === n) {
      years.push({ year: Math.ceil(month / 12), principal: yearPrincipal, interest: yearInterest, balance });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }
  return { emi, totalInterest: emi * n - principal, totalPayment: emi * n, years };
}

export interface GrowthYear { year: number; invested: number; value: number }
export interface SipResult { invested: number; value: number; gains: number; years: GrowthYear[] }

/** Monthly SIP with an optional yearly step-up. Each instalment is made at the start of the month. */
export function computeSip(monthly: number, annualRate: number, years: number, stepUpPercent: number): SipResult {
  const months = Math.max(1, Math.round(years * 12));
  const i = annualRate / 12 / 100;
  let value = 0;
  let invested = 0;
  let instalment = monthly;
  const rows: GrowthYear[] = [];
  for (let month = 1; month <= months; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) instalment *= 1 + stepUpPercent / 100;
    value = (value + instalment) * (1 + i);
    invested += instalment;
    if (month % 12 === 0 || month === months) rows.push({ year: Math.ceil(month / 12), invested, value });
  }
  return { invested, value, gains: value - invested, years: rows };
}

export type Compounding = 'monthly' | 'quarterly' | 'halfYearly' | 'yearly';
const PERIODS_PER_YEAR: Record<Compounding, number> = { monthly: 12, quarterly: 4, halfYearly: 2, yearly: 1 };

export function computeFd(principal: number, annualRate: number, totalMonths: number, compounding: Compounding) {
  const n = PERIODS_PER_YEAR[compounding];
  const years = totalMonths / 12;
  const maturity = principal * (1 + annualRate / 100 / n) ** (n * years);
  return { maturity, interest: maturity - principal, effectiveYield: ((1 + annualRate / 100 / n) ** n - 1) * 100 };
}

export interface PpfYear { year: number; deposited: number; interest: number; balance: number }

/** Yearly PPF projection assuming the full deposit is made at the start of each year (before the 5th of April). */
export function computePpf(yearlyDeposit: number, annualRate: number, years: number) {
  let balance = 0;
  let deposited = 0;
  const rows: PpfYear[] = [];
  for (let year = 1; year <= years; year += 1) {
    const opening = balance + yearlyDeposit;
    const interest = opening * (annualRate / 100);
    deposited += yearlyDeposit;
    balance = opening + interest;
    rows.push({ year, deposited, interest, balance });
  }
  return { deposited, maturity: balance, interest: balance - deposited, years: rows };
}

export function computeGst(amount: number, ratePercent: number, mode: 'add' | 'remove') {
  const base = mode === 'add' ? amount : amount / (1 + ratePercent / 100);
  const gst = mode === 'add' ? (amount * ratePercent) / 100 : amount - base;
  return { base, gst, total: base + gst, half: gst / 2 };
}

export function computeHra(input: { monthlyBasic: number; monthlyHra: number; monthlyRent: number; metro: boolean }) {
  const { monthlyBasic, monthlyHra, monthlyRent, metro } = input;
  const rentOverTenPercent = Math.max(0, monthlyRent - 0.1 * monthlyBasic);
  const basicShare = (metro ? 0.5 : 0.4) * monthlyBasic;
  const exempt = Math.max(0, Math.min(monthlyHra, rentOverTenPercent, basicShare));
  return {
    monthly: { actual: monthlyHra, rentOverTenPercent, basicShare, exempt, taxable: Math.max(0, monthlyHra - exempt) },
    yearlyExempt: exempt * 12,
    yearlyTaxable: Math.max(0, monthlyHra - exempt) * 12,
  };
}
