import type { Sheet } from '../paper/geometry';
import type { PageSizeId, ToneId, Weight } from '../paper/types';

/** Paper and ink settings shared by every record sheet, plus the name printed on each page (shop, household or pet). */
export interface Common {
  page: PageSizeId;
  landscape: boolean;
  margin: number;
  tone: ToneId;
  weight: Weight;
  heading: string;
}

export type Values = Record<string, string | number | boolean>;

export type Field =
  | { type: 'text'; key: string; label: string; placeholder?: string; max?: number }
  | { type: 'number'; key: string; label: string; min: number; max: number; step?: number; unit?: string }
  | { type: 'date'; key: string; label: string }
  | { type: 'toggle'; key: string; label: string; hint?: string }
  | { type: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  /** Several short lines, one per line in a box. `max` is the number of lines kept. */
  | { type: 'list'; key: string; label: string; hint?: string; placeholder?: string; max: number };

/** One sheet of a family: its address, its form and the function that draws its pages. */
export interface SheetDef {
  id: string;
  label: string;
  hint: string;
  path: string;
  landscape: boolean;
  fields: Field[];
  defaults: Values;
  build: (values: Values, common: Common) => Sheet[];
}

export interface Family {
  key: 'home' | 'shop' | 'pet' | 'teach' | 'clean' | 'study' | 'event' | 'kin' | 'auto' | 'life' | 'play' | 'cert' | 'label' | 'notice' | 'ops';
  /** Label and example for the name printed at the top of every page. */
  headingLabel: string;
  headingPlaceholder: string;
  /** Closing note under the maker. */
  note?: string;
  sheets: SheetDef[];
}

export const MAX_TEXT = 60;
export const MAX_LINE = 40;
