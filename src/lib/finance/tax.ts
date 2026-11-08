/**
 * Indicative income tax for a resident individual, FY 2026-27 (AY 2027-28).
 * Covers salary and other income taxed at slab rates only. It does not model capital gains,
 * business income, AMT, or the special rules for non-residents. Always confirm on incometax.gov.in.
 */
export type Regime = 'new' | 'old';
export type AgeGroup = 'below60' | 'senior' | 'superSenior';

interface Slab { upTo: number; rate: number }

const NEW_SLABS: Slab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

function oldSlabs(age: AgeGroup): Slab[] {
  const exempt = age === 'superSenior' ? 500000 : age === 'senior' ? 300000 : 250000;
  return [
    { upTo: exempt, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ].filter((slab, index, all) => index === 0 || slab.upTo > all[index - 1].upTo);
}

export const STANDARD_DEDUCTION = { new: 75000, old: 50000 } as const;
export const NEW_REBATE = { incomeLimit: 1200000, maxRebate: 60000 } as const;
export const OLD_REBATE = { incomeLimit: 500000, maxRebate: 12500 } as const;
export const CESS_RATE = 0.04;
export const OLD_LIMITS = { section80C: 150000, nps80CCD1B: 50000, homeLoanInterest: 200000, section80D: 100000 } as const;

function slabTax(taxable: number, slabs: Slab[]): number {
  let tax = 0;
  let lower = 0;
  for (const slab of slabs) {
    if (taxable > lower) tax += (Math.min(taxable, slab.upTo) - lower) * slab.rate;
    lower = slab.upTo;
  }
  return tax;
}

/** Surcharge rate bands: income above `over` pays `rate` on the tax. */
function surchargeBands(regime: Regime): { over: number; rate: number }[] {
  const bands = [
    { over: 5000000, rate: 0.1 },
    { over: 10000000, rate: 0.15 },
    { over: 20000000, rate: 0.25 },
  ];
  return regime === 'old' ? [...bands, { over: 50000000, rate: 0.37 }] : bands;
}

function surchargeRate(income: number, regime: Regime): number {
  let rate = 0;
  for (const band of surchargeBands(regime)) if (income > band.over) rate = band.rate;
  return rate;
}

export interface TaxInput {
  regime: Regime;
  age: AgeGroup;
  /** Gross salary for the year, before the standard deduction. */
  salary: number;
  /** Interest, rent and other income taxed at slab rates. */
  otherIncome: number;
  /** Employer NPS contribution, deductible in both regimes. */
  employerNps: number;
  /** Old regime only. */
  section80C: number;
  nps80CCD1B: number;
  section80D: number;
  homeLoanInterest: number;
  hraExemption: number;
  otherDeductions: number;
}

export interface TaxResult {
  regime: Regime;
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  slabTax: number;
  rebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
}

export function computeTax(input: TaxInput): TaxResult {
  const { regime } = input;
  const slabs = regime === 'new' ? NEW_SLABS : oldSlabs(input.age);
  const grossIncome = input.salary + input.otherIncome;
  const standard = input.salary > 0 ? Math.min(input.salary, STANDARD_DEDUCTION[regime]) : 0;

  let deductions = standard + input.employerNps;
  if (regime === 'old') {
    deductions += Math.min(input.section80C, OLD_LIMITS.section80C)
      + Math.min(input.nps80CCD1B, OLD_LIMITS.nps80CCD1B)
      + Math.min(input.section80D, OLD_LIMITS.section80D)
      + Math.min(input.homeLoanInterest, OLD_LIMITS.homeLoanInterest)
      + input.hraExemption
      + input.otherDeductions;
  }
  const taxable = Math.max(0, Math.floor((grossIncome - deductions) / 10) * 10);
  const totalDeductions = Math.min(grossIncome, deductions);

  let tax = slabTax(taxable, slabs);
  let rebate = 0;
  if (regime === 'new') {
    if (taxable <= NEW_REBATE.incomeLimit) {
      rebate = Math.min(tax, NEW_REBATE.maxRebate);
    } else {
      // Marginal relief: tax cannot exceed the income earned above the rebate limit.
      const capped = taxable - NEW_REBATE.incomeLimit;
      if (tax > capped) rebate = tax - capped;
    }
  } else if (taxable <= OLD_REBATE.incomeLimit) {
    rebate = Math.min(tax, OLD_REBATE.maxRebate);
  }
  tax -= rebate;

  // Surcharge with marginal relief against every threshold the income has crossed.
  const rate = surchargeRate(taxable, regime);
  let surcharge = tax * rate;
  if (rate > 0) {
    for (const band of surchargeBands(regime)) {
      if (taxable <= band.over) continue;
      const atThreshold = slabTax(band.over, slabs);
      const base = atThreshold * (1 + surchargeRate(band.over, regime));
      const limit = base + (taxable - band.over);
      surcharge = Math.min(surcharge, Math.max(0, limit - tax));
    }
  }

  const cess = (tax + surcharge) * CESS_RATE;
  const totalTax = Math.round(tax + surcharge + cess);
  return {
    regime,
    grossIncome,
    totalDeductions,
    taxableIncome: taxable,
    slabTax: Math.round(tax + rebate),
    rebate: Math.round(rebate),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    totalTax,
    effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
  };
}
