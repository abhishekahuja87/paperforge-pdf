import { addDays, addMonths, totalDays } from '../utilities/dates';

export interface NoticeInput {
  resignation: Date;
  noticeValue: number;
  noticeUnit: 'days' | 'months';
  /** 'calendar' counts every day; 'working' counts Monday to Friday only (days units only). */
  counting: 'calendar' | 'working';
  /** Some companies count the day you resign as day 1 of the notice. */
  countFirstDay: boolean;
  /** Days of notice you will pay to skip (buyout). */
  buyoutDays: number;
  /** Leave you plan to take during the notice, if your company extends the notice by that many days. */
  leaveDays: number;
  /** Monthly pay your company uses to price a buyout; 0 to skip the amount. */
  monthlyPay: number;
  joining: Date | null;
  asOf: Date;
}

export interface NoticeResult {
  lastDay: Date;
  /** Last day before any buyout, for showing what the buyout saves. */
  fullNoticeLastDay: Date;
  noticeDaysServed: number;
  buyoutAmount: number;
  /** Buyout days actually applied: never more than the notice itself, so the last day cannot fall before the resignation. */
  buyoutApplied: number;
  /** True when the requested buyout was longer than the notice and was reduced. */
  buyoutLimited: boolean;
  weekend: boolean;
  daysFromNow: number;
  gapDays: number | null;
  /** When joining is earlier than the last day: how many more days of notice you would have to cut. */
  daysToCut: number;
  cutAmount: number;
}

const isWeekend = (date: Date) => date.getUTCDay() === 0 || date.getUTCDay() === 6;

export function addWorkingDays(from: Date, count: number): Date {
  let current = from;
  let left = count;
  while (left > 0) {
    current = addDays(current, 1);
    if (!isWeekend(current)) left -= 1;
  }
  return current;
}

const perDay = (monthlyPay: number) => (monthlyPay > 0 ? monthlyPay / 30 : 0);

export function computeNotice(input: NoticeInput): NoticeResult {
  const value = Math.max(0, Math.floor(input.noticeValue));
  const requestedBuyout = Math.max(0, Math.floor(input.buyoutDays));
  const leave = Math.max(0, Math.floor(input.leaveDays));
  const shift = input.countFirstDay ? -1 : 0;

  let full: Date;
  if (input.noticeUnit === 'months') {
    full = addDays(addMonths(input.resignation, value), shift);
  } else if (input.counting === 'working') {
    full = addWorkingDays(input.resignation, Math.max(0, value + shift));
  } else {
    full = addDays(input.resignation, value + shift);
  }
  if (leave > 0) full = addDays(full, leave);

  // The buyout can only remove notice you would have served, so it cannot be longer than the notice.
  const buyout = Math.min(requestedBuyout, Math.max(0, totalDays(input.resignation, full)));
  const lastDay = buyout > 0 ? addDays(full, -buyout) : full;
  const day = perDay(input.monthlyPay);
  const gapDays = input.joining ? totalDays(lastDay, input.joining) - 1 : null;
  const daysToCut = input.joining && gapDays !== null && gapDays < 0 ? -gapDays : 0;

  return {
    lastDay,
    fullNoticeLastDay: full,
    noticeDaysServed: Math.max(0, totalDays(input.resignation, lastDay) + (input.countFirstDay ? 1 : 0)),
    buyoutAmount: Math.round(day * buyout),
    buyoutApplied: buyout,
    buyoutLimited: requestedBuyout > buyout,
    weekend: isWeekend(lastDay),
    daysFromNow: totalDays(input.asOf, lastDay),
    gapDays,
    daysToCut,
    cutAmount: Math.round(day * daysToCut),
  };
}
