import React, { useState } from 'react';
import { calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from './common';
import { cleanupText, convertCase, type CaseStyle, type CleanupOp } from '../../../lib/utilities/text';

const STYLES: { value: CaseStyle; label: string }[] = [
  { value: 'upper', label: 'UPPERCASE' }, { value: 'lower', label: 'lowercase' }, { value: 'title', label: 'Title Case' }, { value: 'sentence', label: 'Sentence case' },
  { value: 'camel', label: 'camelCase' }, { value: 'pascal', label: 'PascalCase' }, { value: 'snake', label: 'snake_case' }, { value: 'kebab', label: 'kebab-case' },
  { value: 'toggle', label: 'tOGGLE cASE' }, { value: 'alternating', label: 'aLtErNaTiNg' },
];
const CLEANUPS: { value: CleanupOp; label: string }[] = [
  { value: 'trimSpaces', label: 'Remove extra spaces' }, { value: 'removeBreaks', label: 'Remove line breaks' },
  { value: 'sortLines', label: 'Sort lines A-Z' }, { value: 'dedupeLines', label: 'Remove duplicate lines' }, { value: 'reverseLines', label: 'Reverse line order' },
];

export const CaseConverter: React.FC = () => {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<CaseStyle>('title');
  const output = convertCase(text, style);
  const apply = (op: CleanupOp) => setText((current) => cleanupText(current, op));
  return (
    <section className={calcCard}>
      <label className="block text-xs font-semibold text-slate-700">
        Your text
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} placeholder="Type or paste your text here" className={`${fieldClass} resize-y font-normal`} />
      </label>
      <div className="mt-4"><ChoiceButtons label="Case style" value={style} onChange={(value) => setStyle(value as CaseStyle)} options={STYLES} /></div>
      <label className="mt-4 block text-xs font-semibold text-slate-700">
        Result
        <textarea readOnly value={output} rows={6} className={`${fieldClass} resize-y bg-slate-50 font-normal`} />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={output} label="Copy result" />
        <button type="button" onClick={() => setText(output)} disabled={!text} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Use result as input</button>
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Clean up the input text</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLEANUPS.map((item) => (
            <button key={item.value} type="button" onClick={() => apply(item.value)} disabled={!text} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{item.label}</button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Converted in your browser; your text is never uploaded.</p>
    </section>
  );
};

export default CaseConverter;
