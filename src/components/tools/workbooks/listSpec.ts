/** What a list-style workbook page needs. One generic page (ListWorkbook.tsx) reads this, so each tool is a short description instead of a copy of the page. */
import type { Field } from '../../../lib/table/shape';
import type { Book } from '../../../lib/xlsx/model';
import type { Region } from '../../../lib/workbooks/region';

export type Settings = Record<string, string | number | boolean>;
export interface TextSpec { key: string; label: string; placeholder?: string; hint?: string; max?: number; multiline?: number }
export interface NumberSpec { key: string; label: string; hint?: string; min: number; max: number }
export interface ToggleSpec { key: string; label: string; hint?: string }
export interface StarterSpec { label: string; hint: string; /** Sample list rows, in the order of the list columns. */ rows: string[][]; /** Settings this starter changes. */ set?: Settings }

export interface BuildInput { settings: Settings; rows: Record<string, string>[]; sample: boolean; region: Region; hinglish: boolean; starter: string }

export interface ListSpec {
  /** Saved settings key and the start of the file name. */
  id: string;
  fileBase: string;
  /** Text above each group on the page. */
  ui: { start: string; starters: string; listTitle?: string; listIntro: string; previewYours: string; previewSample: string; month?: string; year?: string };
  texts: TextSpec[];
  numbers: NumberSpec[];
  toggles?: ToggleSpec[];
  /** Keys of texts, numbers and toggles that go under "More options". */
  more?: string[];
  /** Show a month and year picker, saved as month and year. */
  month?: boolean;
  region: { tax?: boolean; code?: boolean; word?: boolean };
  defaults: Settings;
  starters: Record<string, StarterSpec>;
  sampleHeaders: string[];
  fields: Field[];
  maxRows: number;
  tooMany: string;
  build: (input: BuildInput) => Book;
}
