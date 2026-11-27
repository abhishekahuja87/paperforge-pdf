/** What a Word document maker page needs. One generic page (DocMaker.tsx) reads this, so each tool is a short description. */
import type { DocModel } from '../../../lib/docx/model';
import type { DocInput } from '../../../lib/docs/kit';

export interface DocField { key: string; label: string; kind: 'text' | 'textarea' | 'date' | 'select'; hint?: string; placeholder?: string; max?: number; rows?: number; options?: { value: string; label: string }[] }
export interface DocListSpec { key: string; title: string; add: string; max: number; columns: DocField[] }
export interface DocStarter { label: string; hint: string; values: Record<string, string>; lists: Record<string, Record<string, string>[]> }
export interface DocForm { groups: { title: string; fields: DocField[] }[]; lists: DocListSpec[]; looks?: { value: string; label: string }[] }

export interface DocSpec {
  /** Start of the file name. */
  id: string;
  form: DocForm;
  starters: Record<string, DocStarter>;
  build: (input: DocInput) => DocModel;
  /** Short facts worked out from the form, such as the number of days of leave. */
  notes?: (input: DocInput) => string[];
}
