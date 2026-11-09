import React, { useState } from 'react';
import { Check, Clipboard } from 'lucide-react';
import { copyText } from '../../../lib/browserTools';
import { acceptDate, useShared } from '../../../lib/shareState';

export const fieldClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900';

export const CopyButton: React.FC<{ text: string; label?: string; disabled?: boolean }> = ({ text, label = 'Copy', disabled }) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    try {
      await copyText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled || !text}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {state === 'copied' ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />}
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy blocked: select and copy manually' : label}
    </button>
  );
};

export const DateField: React.FC<{ label: string; value: string; onChange: (value: string) => void; shareKey?: string }> = ({ label, value, onChange, shareKey }) => {
  useShared(label, value, onChange, acceptDate, shareKey);
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
    </label>
  );
};

export const ChoiceButtons: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => {
  useShared(label, value, onChange, (text) => options.some((option) => option.value === text));
  return (
  <div role="group" aria-label={label} className="flex flex-wrap gap-2">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition ${value === option.value ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
  );
};
