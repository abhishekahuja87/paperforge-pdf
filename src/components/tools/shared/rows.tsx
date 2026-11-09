import React from 'react';
import { fieldClass } from '../utilities/common';

/** Small helpers shared by the student tools that edit a list of rows. */
let counter = 0;
export const nextRowId = () => `row-${++counter}`;

export const RowButton: React.FC<{ onClick: () => void; children: React.ReactNode; label?: string }> = ({ onClick, children, label }) => (
  <button type="button" aria-label={label} onClick={onClick} className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 print:hidden">
    {children}
  </button>
);

export const RowInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className, ...rest }) => (
  <input aria-label={label} {...rest} className={`${fieldClass} !mt-0 ${className ?? ''}`} />
);
