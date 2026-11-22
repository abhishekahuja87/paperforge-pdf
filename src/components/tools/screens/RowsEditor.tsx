import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardPaste, Plus, Trash2 } from 'lucide-react';
import { splitLines } from '../../../lib/screens/timed';
import { PictureButton } from '../shared/PictureButton';
import { FIELD, ORANGE, OUTLINE, SMALL_BUTTON } from './ui';

export interface FormRow { id: string; [key: string]: string }
export interface Column { key: string; label: string; type?: 'text' | 'number' | 'time' | 'select' | 'image' | 'area'; placeholder?: string; options?: Array<[string, string]>; size?: 'wide' | 'mid' | 'narrow' }

let counter = 0;
export const rowId = (): string => { counter += 1; return `r${Date.now().toString(36)}${counter.toString(36)}`; };
export const makeRow = (values: Record<string, string>): FormRow => ({ id: rowId(), ...values });

interface Props {
  title: string;
  columns: Column[];
  rows: FormRow[];
  onChange: (rows: FormRow[]) => void;
  /** Values for a new empty row. */
  blank: Record<string, string>;
  addLabel: string;
  /** Pasting many lines: which columns the pieces of each line fill, and an example. */
  bulk?: { keys: string[]; example: string; hint: string };
  empty: string;
}

const SIZE = { wide: 'min-w-[12rem] flex-[3]', mid: 'min-w-[8rem] flex-[2]', narrow: 'w-24' } as const;

/** A list of rows with the same fields: edit, reorder, remove, add one, or paste many lines at once. Used by the big-screen tools. */
export const RowsEditor: React.FC<Props> = ({ title, columns, rows, onChange, blank, addLabel, bulk, empty }) => {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState('');

  const set = (id: string, key: string, value: string) => onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    onChange(next);
  };
  const addPasted = () => {
    if (!bulk) return;
    const lines = splitLines(pasted, bulk.keys.length);
    if (lines.length === 0) return;
    onChange([...rows, ...lines.map((parts) => makeRow({ ...blank, ...Object.fromEntries(bulk.keys.map((key, at) => [key, parts[at] ?? blank[key] ?? ''])) }))]);
    setPasted('');
    setPasteOpen(false);
  };

  return (
    <section className="space-y-2 rounded-2xl border border-stone-200 bg-white/70 p-3 sm:p-4" aria-label={title}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-black tracking-tight text-stone-900">{title} <span className="text-xs font-semibold text-stone-500">({rows.length})</span></h2>
        {rows.length > 0 && <button type="button" onClick={() => onChange([])} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 underline"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear all</button>}
      </div>
      {rows.length === 0 ? <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">{empty}</p> : (
        <ol className="space-y-1.5">
          {rows.map((row, index) => (
            <li key={row.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-2">
              <span className="mb-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-800">{index + 1}</span>
              {columns.map((column) => (
                <label key={column.key} className={`block space-y-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 ${SIZE[column.size ?? 'mid']}`}>
                  {column.label}
                  {column.type === 'select' ? (
                    <select value={row[column.key] ?? ''} onChange={(event) => set(row.id, column.key, event.target.value)} className={FIELD}>{(column.options ?? []).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  ) : column.type === 'image' ? (
                    <span className="block normal-case"><PictureButton image={row[column.key] || undefined} label="Add a picture" onPick={(image) => set(row.id, column.key, image ?? '')} onError={setError} /></span>
                  ) : column.type === 'area' ? (
                    <textarea rows={2} value={row[column.key] ?? ''} placeholder={column.placeholder} onChange={(event) => set(row.id, column.key, event.target.value)} className={`${FIELD} normal-case`} />
                  ) : (
                    <input type={column.type === 'number' ? 'number' : column.type === 'time' ? 'time' : 'text'} inputMode={column.type === 'number' ? 'numeric' : undefined} value={row[column.key] ?? ''} placeholder={column.placeholder} onChange={(event) => set(row.id, column.key, event.target.value)} className={`${FIELD} normal-case`} />
                  )}
                </label>
              ))}
              <span className="mb-0.5 flex gap-1">
                <button type="button" aria-label={`Move ${index + 1} up`} onClick={() => move(index, -1)} disabled={index === 0} className={SMALL_BUTTON}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" aria-label={`Move ${index + 1} down`} onClick={() => move(index, 1)} disabled={index === rows.length - 1} className={SMALL_BUTTON}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" aria-label={`Remove ${index + 1}`} onClick={() => onChange(rows.filter((entry) => entry.id !== row.id))} className={SMALL_BUTTON}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange([...rows, makeRow(blank)])} className={OUTLINE}><Plus className="h-4 w-4" aria-hidden="true" />{addLabel}</button>
        {bulk && <button type="button" onClick={() => setPasteOpen(!pasteOpen)} aria-expanded={pasteOpen} className={OUTLINE}><ClipboardPaste className="h-4 w-4" aria-hidden="true" />Paste many at once</button>}
      </div>
      {bulk && pasteOpen && (
        <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs text-stone-600">{bulk.hint}</p>
          <textarea rows={6} aria-label="Paste many lines" value={pasted} onChange={(event) => setPasted(event.target.value)} placeholder={bulk.example} className={`${FIELD} font-mono text-xs`} />
          <button type="button" onClick={addPasted} disabled={pasted.trim() === ''} className={ORANGE}>Add these lines</button>
        </div>
      )}
    </section>
  );
};

/** Reads saved rows back. Each value must be text; rows without an id get a new one. */
export function readRows(value: unknown, keys: string[]): FormRow[] | null {
  if (!Array.isArray(value)) return null;
  return value.slice(0, 300).flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const record = entry as Record<string, unknown>;
    return [makeRow(Object.fromEntries(keys.map((key) => [key, typeof record[key] === 'string' ? (record[key] as string) : ''])))];
  });
}
