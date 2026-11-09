export interface GradeComponent { name: string; weight: number; /** Percentage scored, or null when not taken yet. */ score: number | null }

export interface GradeStatus {
  totalWeight: number;
  gradedWeight: number;
  remainingWeight: number;
  /** Points of the final grade already earned. */
  earned: number;
  /** Average of the finished parts only, as a percentage. */
  currentAverage: number | null;
  /** Best and worst final grade still possible. */
  best: number;
  worst: number;
}

export function gradeStatus(parts: GradeComponent[]): GradeStatus {
  const valid = parts.filter((part) => Number.isFinite(part.weight) && part.weight > 0);
  const totalWeight = valid.reduce((sum, part) => sum + part.weight, 0);
  const graded = valid.filter((part) => part.score !== null && Number.isFinite(part.score));
  const gradedWeight = graded.reduce((sum, part) => sum + part.weight, 0);
  const earned = graded.reduce((sum, part) => sum + ((part.score as number) * part.weight) / 100, 0);
  const remainingWeight = Math.max(0, totalWeight - gradedWeight);
  return {
    totalWeight, gradedWeight, remainingWeight, earned,
    currentAverage: gradedWeight > 0 ? (earned / gradedWeight) * 100 : null,
    best: earned + remainingWeight, worst: earned,
  };
}

export type NeededResult = { kind: 'done' } | { kind: 'none-left' } | { kind: 'impossible'; needed: number } | { kind: 'possible'; needed: number };

/** Score needed on everything still to come (as a percentage) to finish with the target final grade. */
export function neededScore(status: GradeStatus, target: number): NeededResult {
  if (status.remainingWeight <= 0) return status.earned >= target ? { kind: 'done' } : { kind: 'none-left' };
  const needed = ((target - status.earned) / status.remainingWeight) * 100;
  if (needed <= 0) return { kind: 'done' };
  return needed > 100 ? { kind: 'impossible', needed } : { kind: 'possible', needed };
}
