export function simpleInterest(principal: number, ratePercent: number, years: number) {
  const interest = (principal * ratePercent * years) / 100;
  return { interest, total: principal + interest };
}

export function compoundInterest(principal: number, ratePercent: number, years: number, perYear: number) {
  const total = principal * (1 + ratePercent / 100 / perYear) ** (perYear * years);
  return { interest: total - principal, total };
}

/** Recurring deposit with interest compounded quarterly, the usual method at Indian banks. */
export function recurringDeposit(monthly: number, ratePercent: number, months: number) {
  let total = 0;
  for (let i = 1; i <= months; i += 1) {
    total += monthly * (1 + ratePercent / 400) ** ((months - i + 1) / 3);
  }
  const deposited = monthly * months;
  return { deposited, total, interest: total - deposited };
}

export function cagr(initial: number, final: number, years: number): number {
  if (initial <= 0 || final <= 0 || years <= 0) return NaN;
  return ((final / initial) ** (1 / years) - 1) * 100;
}
