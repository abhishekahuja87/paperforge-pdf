export interface GradeOption { label: string; points: number }
export interface GradeScale { id: 'ten' | 'four' | 'custom'; name: string; max: number; grades: GradeOption[] }

export const GRADE_SCALES: GradeScale[] = [
  { id: 'ten', name: '10-point scale (O, A+, A ...)', max: 10, grades: [
    { label: 'O (outstanding)', points: 10 }, { label: 'A+', points: 9 }, { label: 'A', points: 8 }, { label: 'B+', points: 7 },
    { label: 'B', points: 6 }, { label: 'C', points: 5 }, { label: 'P (pass)', points: 4 }, { label: 'F (fail)', points: 0 },
  ] },
  { id: 'four', name: '4.0 scale (A, B, C ...)', max: 4, grades: [
    { label: 'A', points: 4 }, { label: 'A-', points: 3.7 }, { label: 'B+', points: 3.3 }, { label: 'B', points: 3 }, { label: 'B-', points: 2.7 },
    { label: 'C+', points: 2.3 }, { label: 'C', points: 2 }, { label: 'C-', points: 1.7 }, { label: 'D+', points: 1.3 }, { label: 'D', points: 1 }, { label: 'F', points: 0 },
  ] },
  { id: 'custom', name: 'My own points (type them)', max: 10, grades: [] },
];

export interface CreditItem { credits: number; points: number }

/** Credit-weighted average: sum(credits x points) / sum(credits). Returns null when there are no credits. */
export function weightedAverage(items: CreditItem[]): { average: number; credits: number; weightedPoints: number } | null {
  const usable = items.filter((item) => Number.isFinite(item.credits) && Number.isFinite(item.points) && item.credits > 0 && item.points >= 0);
  const credits = usable.reduce((sum, item) => sum + item.credits, 0);
  if (credits <= 0) return null;
  const weightedPoints = usable.reduce((sum, item) => sum + item.credits * item.points, 0);
  return { average: weightedPoints / credits, credits, weightedPoints };
}

/** SGPA the next term must reach to lift the overall average to the target. */
export function requiredNextTerm(currentCgpa: number, creditsDone: number, targetCgpa: number, creditsNext: number, scaleMax: number) {
  if (![currentCgpa, creditsDone, targetCgpa, creditsNext].every(Number.isFinite) || creditsDone < 0 || creditsNext <= 0) return null;
  const required = (targetCgpa * (creditsDone + creditsNext) - currentCgpa * creditsDone) / creditsNext;
  return { required, status: required > scaleMax ? 'impossible' : required <= 0 ? 'already' : 'possible' } as const;
}

export type ConversionMethod = 'times95' | 'times10' | 'ratio';

export const CONVERSIONS: { id: ConversionMethod; name: string; note: string }[] = [
  { id: 'times95', name: 'CGPA × 9.5 (10-point scale, CBSE style)', note: 'Common for 10-point CGPA in school boards and some universities.' },
  { id: 'times10', name: 'CGPA × 10 (10-point scale)', note: 'Used by some universities; gives a slightly higher percentage.' },
  { id: 'ratio', name: '(CGPA ÷ scale maximum) × 100', note: 'Straight proportion; for 4.0, 5 or 7-point scales.' },
];

export function cgpaToPercent(cgpa: number, method: ConversionMethod, scaleMax: number): number {
  if (!Number.isFinite(cgpa)) return NaN;
  if (method === 'times95') return cgpa * 9.5;
  if (method === 'times10') return cgpa * 10;
  return (cgpa / scaleMax) * 100;
}

export function percentToCgpa(percent: number, method: ConversionMethod, scaleMax: number): number {
  if (!Number.isFinite(percent)) return NaN;
  if (method === 'times95') return percent / 9.5;
  if (method === 'times10') return percent / 10;
  return (percent / 100) * scaleMax;
}
