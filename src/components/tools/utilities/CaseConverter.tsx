import React, { useState } from 'react';
import { calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from './common';
import { convertCase, type CaseStyle } from '../../../lib/utilities/text';

const STYLES: { value: CaseStyle; label: string }[] = [
  { value: 'upper', label: 'UPPERCASE' }, { value: 'lower', label: 'lowercase' }, { value: 'title', label: 'Title Case' }, { value: 'sentence', label: 'Sentence case' },
  { value: 'camel', label: 'camelCase' }, { value: 'pascal', label: 'PascalCase' }, { value: 'snake', label: 'snake_case' }, { value: 'kebab', label: 'kebab-case' },
];

export const CaseConverter: React.FC = () => {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<CaseStyle>('title');
  const output = convertCase(text, style);
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
      <div className="mt-3"><CopyButton text={output} label="Copy result" /></div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Converted in your browser; your text is never uploaded.</p>
    </section>
  );
};

export default CaseConverter;
