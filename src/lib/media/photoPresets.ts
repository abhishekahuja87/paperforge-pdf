export type SizeUnit = 'px' | 'mm' | 'cm' | 'in';

export interface PhotoPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  unit: SizeUnit;
  dpi: number;
  maxKb: number;
}

/** Sizes that forms and exams commonly ask for. Requirements change, so the page tells people to follow their own form. */
export const PHOTO_PRESETS: PhotoPreset[] = [
  { id: 'passport', label: 'Passport photo 35 × 45 mm', width: 35, height: 45, unit: 'mm', dpi: 300, maxKb: 100 },
  { id: 'square-2in', label: 'Square photo 2 × 2 inch', width: 2, height: 2, unit: 'in', dpi: 300, maxKb: 240 },
  { id: 'exam-photo', label: 'Exam photo 200 × 230 px', width: 200, height: 230, unit: 'px', dpi: 96, maxKb: 50 },
  { id: 'signature', label: 'Signature 140 × 60 px', width: 140, height: 60, unit: 'px', dpi: 96, maxKb: 20 },
  { id: 'thumb', label: 'Small profile 300 × 300 px', width: 300, height: 300, unit: 'px', dpi: 96, maxKb: 50 },
];

const PER_INCH: Record<SizeUnit, number> = { px: 0, mm: 25.4, cm: 2.54, in: 1 };

/** Converts a width or height in the chosen unit to pixels at the given resolution. */
export function toPixels(value: number, unit: SizeUnit, dpi: number): number {
  return unit === 'px' ? Math.round(value) : Math.round((value / PER_INCH[unit]) * dpi);
}
