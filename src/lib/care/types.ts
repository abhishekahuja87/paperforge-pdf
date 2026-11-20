import type { FontId } from '../paper/geometry';
import type { ThemeId } from '../records/theme';
import type { PageSizeId, ToneId, Weight } from '../paper/types';

export type CareKind = 'medicine' | 'log' | 'emergency' | 'visit' | 'caregiver';

export const SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
export type Slot = (typeof SLOTS)[number];
export type FoodNote = '' | 'before food' | 'after food' | 'with food' | 'empty stomach' | 'at bedtime';
export const FOOD_NOTES: { value: FoodNote; label: string }[] = [
  { value: '', label: 'No note' },
  { value: 'before food', label: 'Before food' },
  { value: 'after food', label: 'After food' },
  { value: 'with food', label: 'With food' },
  { value: 'empty stomach', label: 'Empty stomach' },
  { value: 'at bedtime', label: 'At bedtime' },
];

/** One line of the medicine plan. `amounts` holds what is taken in each part of the day, such as "1" or "1/2"; empty means not taken then. */
export interface MedicineRow {
  name: string;
  strength: string;
  amounts: Record<Slot, string>;
  food: FoodNote;
}

export const MAX_MEDICINES = 8;
export const MAX_NAME = 28;
export const MAX_STRENGTH = 14;
export const MAX_AMOUNT = 5;

export const emptyMedicine = (): MedicineRow => ({ name: '', strength: '', amounts: { Morning: '', Afternoon: '', Evening: '', Night: '' }, food: '' });

export type LogColumn = 'date' | 'time' | 'bp' | 'pulse' | 'sugarFasting' | 'sugarAfter' | 'weight' | 'temp' | 'spo2' | 'notes';
export const LOG_COLUMNS: { id: LogColumn; label: string; width: number }[] = [
  { id: 'date', label: 'Date', width: 1.1 },
  { id: 'time', label: 'Time', width: 0.8 },
  { id: 'bp', label: 'BP (mmHg)', width: 1.3 },
  { id: 'pulse', label: 'Pulse (bpm)', width: 1 },
  { id: 'sugarFasting', label: 'Sugar fasting (mg/dL)', width: 1.4 },
  { id: 'sugarAfter', label: 'Sugar after meal (mg/dL)', width: 1.4 },
  { id: 'weight', label: 'Weight (kg)', width: 1 },
  { id: 'temp', label: 'Temp (C)', width: 0.9 },
  { id: 'spo2', label: 'SpO2 (%)', width: 0.9 },
  { id: 'notes', label: 'Notes', width: 2.2 },
];

export interface CareSettings {
  kind: CareKind;
  page: PageSizeId;
  landscape: boolean;
  margin: number;
  tone: ToneId;
  /** Optional colour theme and typeface; without them the ink tone and sans are used. */
  theme?: ThemeId;
  font?: FontId;
  weight: Weight;
  /** Name of the person the sheet is for, printed at the top. */
  person: string;
  /** Doctor or clinic, printed on the medicine plan, the visit sheet and the emergency card. */
  doctor: string;
  large: boolean;

  medicines: MedicineRow[];
  /** Weekly tick charts to print after the plan. */
  weeks: number;
  startDate: string;

  logColumns: LogColumn[];
  logRows: number;
  logPages: number;

  format: 'cards' | 'sheet';
  blood: string;
  allergies: string;
  conditions: string;
  takes: string;
  contact1: string;
  contact2: string;

  visitDate: string;
  questions: number;
  visitSections: { problem: boolean; medicines: boolean; allergies: boolean; questions: boolean; notes: boolean; next: boolean };

  days: number;
  caregiverSlots: number;
}

export const MAX_TEXT = 60;

export const defaultCare = (now: Date = new Date()): CareSettings => ({
  kind: 'medicine',
  page: 'a4',
  landscape: false,
  margin: 12,
  tone: 'charcoal',
  weight: 'normal',
  person: '',
  doctor: '',
  large: true,
  medicines: [emptyMedicine(), emptyMedicine(), emptyMedicine()],
  weeks: 1,
  startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  logColumns: ['date', 'time', 'bp', 'pulse', 'sugarFasting', 'notes'],
  logRows: 24,
  logPages: 1,
  format: 'cards',
  blood: '',
  allergies: '',
  conditions: '',
  takes: '',
  contact1: '',
  contact2: '',
  visitDate: '',
  questions: 8,
  visitSections: { problem: true, medicines: true, allergies: true, questions: true, notes: true, next: true },
  days: 7,
  caregiverSlots: 4,
});

export const KINDS: { id: CareKind; label: string; hint: string }[] = [
  { id: 'medicine', label: 'Medicine chart', hint: 'Plan and weekly tick boxes' },
  { id: 'log', label: 'Health log', hint: 'BP, sugar, weight and more' },
  { id: 'emergency', label: 'Emergency card', hint: 'Wallet cards or a fridge sheet' },
  { id: 'visit', label: 'Doctor visit', hint: 'Notes and questions to ask' },
  { id: 'caregiver', label: 'Caregiver log', hint: 'A day sheet for handover' },
];

export const MAX_WEEKS = 12;
export const MAX_LOG_PAGES = 20;
export const MAX_DAYS = 31;
