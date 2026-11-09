import React from 'react';
import { amountInWords, parseAmount } from '../../lib/finance/format';
import { CopyButton } from '../tools/utilities/common';
import { acceptNumber, useShared } from '../../lib/shareState';

export const calcCard = 'mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6';
const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900';

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  prefix?: string;
  suffix?: string;
  /** Show "12.5 lakh" style help under rupee amounts. */
  words?: boolean;
  step?: string;
  /** Overrides the address key when the label changes with the mode. */
  shareKey?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({ label, value, onChange, hint, prefix, suffix, words, step, shareKey }) => {
  useShared(label, value, onChange, acceptNumber, shareKey);
  const spoken = words ? amountInWords(parseAmount(value)) : '';
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <span className="relative block">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 mt-[3px] -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step={step ?? 'any'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </span>
      {(spoken || hint) && <span className="mt-1 block font-normal text-slate-500">{[spoken, hint].filter(Boolean).join(' · ')}</span>}
    </label>
  );
};

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options }) => {
  useShared(label, value, onChange, (text) => options.some((option) => option.value === text));
  return (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
  );
};

export const InputGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">{children}</div>
);

export const Stat: React.FC<{ label: string; value: string; tone?: 'plain' | 'good' | 'strong' }> = ({ label, value, tone = 'plain' }) => (
  <div className={`rounded-xl border p-3 ${tone === 'strong' ? 'border-orange-200 bg-orange-50' : tone === 'good' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1 text-lg font-black tracking-tight ${tone === 'strong' ? 'text-orange-800' : tone === 'good' ? 'text-emerald-800' : 'text-slate-900'}`}>{value}</p>
  </div>
);

export const StatGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-live="polite">{children}</div>
);

export const SimpleTable: React.FC<{ caption: string; head: string[]; rows: string[][] }> = ({ caption, head, rows }) => (
  <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-200">
    <table className="w-full text-left text-xs">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-slate-100 text-slate-600">
        <tr>{head.map((cell) => <th key={cell} scope="col" className="px-3 py-2 font-semibold">{cell}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, index) => (
          <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-1.5 text-slate-700">{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">{children}</p>
);

export const CalcFooter: React.FC = () => (
  <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">
    Calculated in your browser; nothing you type is sent anywhere. Results are estimates for planning, not financial, tax or legal advice.
  </p>
);

export interface SplitPart { label: string; value: number; className: string }

/** One horizontal bar showing how a total divides into parts, with a legend. */
export const SplitBar: React.FC<{ title: string; parts: SplitPart[]; format: (value: number) => string }> = ({ title, parts, format }) => {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  if (total <= 0) return null;
  return (
    <figure className="mt-4" aria-label={title}>
      <figcaption className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</figcaption>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={parts.map((part) => `${part.label} ${format(part.value)}`).join(', ')}>
        {parts.map((part) => <span key={part.label} className={part.className} style={{ width: `${(Math.max(0, part.value) / total) * 100}%` }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${part.className}`} aria-hidden="true" />
            {part.label}: <strong className="text-slate-800">{format(part.value)}</strong> ({Math.round((Math.max(0, part.value) / total) * 100)}%)
          </li>
        ))}
      </ul>
    </figure>
  );
};

/** Copy a plain-text summary of the result, or print the page (print dialog can save as PDF). */
export const ResultActions: React.FC<{ summary: string }> = ({ summary }) => (
  <div className="mt-4 flex flex-wrap gap-2 print:hidden">
    <CopyButton text={summary} label="Copy summary" />
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
      Print or save as PDF
    </button>
  </div>
);
