/** Gratuity for an employee. Years are rounded up when the last part-year is 6 months or more. */
export function gratuity(lastMonthlyPay: number, years: number, months: number, coveredByAct: boolean) {
  const served = years + (months >= 6 ? 1 : 0);
  const amount = coveredByAct ? (lastMonthlyPay * 15 * served) / 26 : (lastMonthlyPay * 15 * years) / 30;
  return { served, amount, taxFreeLimit: 2_000_000, taxable: Math.max(0, amount - 2_000_000) };
}

export function lumpsum(amount: number, ratePercent: number, years: number) {
  const total = amount * (1 + ratePercent / 100) ** years;
  return { total, gain: total - amount };
}

export function inflation(amount: number, ratePercent: number, years: number) {
  const factor = (1 + ratePercent / 100) ** years;
  return { futureCost: amount * factor, todayValue: amount / factor };
}

export type BmiScale = 'who' | 'asian';

export function bmi(weightKg: number, heightCm: number) {
  return weightKg / (heightCm / 100) ** 2;
}

export function bmiCategory(value: number, scale: BmiScale): string {
  const [overweight, obese] = scale === 'asian' ? [23, 25] : [25, 30];
  if (value < 18.5) return 'Underweight';
  if (value < overweight) return 'Normal weight';
  if (value < obese) return 'Overweight';
  return 'Obese';
}

/** Weight range (kg) that gives a BMI of 18.5 up to the overweight threshold for the height. */
export function healthyRange(heightCm: number, scale: BmiScale): [number, number] {
  const m2 = (heightCm / 100) ** 2;
  return [18.5 * m2, (scale === 'asian' ? 22.9 : 24.9) * m2];
}

export function splitBill(total: number, tipPercent: number, people: number) {
  const tip = (total * tipPercent) / 100;
  const grand = total + tip;
  return { tip, grand, perPerson: grand / people };
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
const ACTIVITY: Record<ActivityLevel, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };

/** Mifflin-St Jeor estimate of resting energy use and daily calories to maintain weight. */
export function dailyCalories(weightKg: number, heightCm: number, age: number, male: boolean, activity: ActivityLevel) {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (male ? 5 : -161);
  return { bmr, maintain: bmr * ACTIVITY[activity] };
}

export function yearlyGrowth(principal: number, ratePercent: number, years: number) {
  const rows: { year: number; value: number }[] = [];
  for (let year = 1; year <= Math.min(Math.ceil(years), 60); year += 1) {
    rows.push({ year, value: principal * (1 + ratePercent / 100) ** Math.min(year, years) });
  }
  return rows;
}
