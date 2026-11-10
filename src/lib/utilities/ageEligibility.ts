import { addMonths } from './dates';

export type UpperLimitRule = 'below' | 'upTo';

export interface EligibilityInput {
  birth: Date;
  asOf: Date;
  /** Lowest age allowed, in whole years. Null when there is none. */
  minYears: number | null;
  /** Highest age in the notice, in whole years. Null when there is none. */
  maxYears: number | null;
  /** Extra years of relaxation added to the upper limit, for example for a reserved category. */
  relaxation: number;
  /**
   * "below": the person must be younger than the limit (not yet turned it).
   * "upTo": the limit year may be completed in full, so the person must not have turned limit + 1.
   */
  rule: UpperLimitRule;
}

export interface EligibilityResult {
  eligible: boolean;
  /** Reason in plain words when not eligible. */
  reason: string;
  /** First day the minimum age is met, when a minimum is set. */
  eligibleFrom: Date | null;
  /** Last day on which the upper limit is still met, when a maximum is set. */
  eligibleUntil: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Date on which a person born on `birth` completes `years` years (29 February counts as 1 March). */
export function completesAge(birth: Date, years: number): Date {
  const date = addMonths(birth, years * 12);
  if (birth.getUTCMonth() === 1 && birth.getUTCDate() === 29 && date.getUTCDate() === 28) {
    return new Date(date.getTime() + DAY_MS);
  }
  return date;
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const { birth, asOf, minYears, maxYears, relaxation, rule } = input;
  const eligibleFrom = minYears === null ? null : completesAge(birth, minYears);
  let eligibleUntil: Date | null = null;
  if (maxYears !== null) {
    const limit = maxYears + Math.max(0, relaxation);
    const firstTooOld = completesAge(birth, rule === 'below' ? limit : limit + 1);
    eligibleUntil = new Date(firstTooOld.getTime() - DAY_MS);
  }
  if (eligibleFrom && asOf.getTime() < eligibleFrom.getTime()) {
    return { eligible: false, reason: 'Too young on this date.', eligibleFrom, eligibleUntil };
  }
  if (eligibleUntil && asOf.getTime() > eligibleUntil.getTime()) {
    return { eligible: false, reason: 'Over the upper age limit on this date.', eligibleFrom, eligibleUntil };
  }
  return { eligible: true, reason: '', eligibleFrom, eligibleUntil };
}
