import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton } from './common';
import { uuidV4 } from '../../../lib/utilities/dev';

const Check: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />{label}</label>
);

export const UuidGenerator: React.FC = () => {
  const [count, setCount] = useState('5');
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [list, setList] = useState<string[]>([]);
  const regenerate = useCallback(() => setList(Array.from({ length: Number(count) }, uuidV4)), [count]);
  useEffect(() => { regenerate(); }, [regenerate]);
  const shown = list.map((item) => {
    let value = hyphens ? item : item.replace(/-/g, '');
    if (upper) value = value.toUpperCase();
    return braces ? `{${value}}` : value;
  });
  return (
    <section className={calcCard}>
      <ChoiceButtons label="How many" value={count} onChange={setCount} options={['1', '5', '10', '25', '100'].map((value) => ({ value, label: value }))} />
      <div className="mt-3 flex flex-wrap gap-x-5">
        <Check label="Uppercase" checked={upper} onChange={setUpper} />
        <Check label="Hyphens" checked={hyphens} onChange={setHyphens} />
        <Check label="Braces { }" checked={braces} onChange={setBraces} />
      </div>
      <ul className="mt-4 max-h-96 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-900" aria-live="polite">
        {shown.map((item, index) => <li key={`${index}-${item}`} className="break-all">{item}</li>)}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={regenerate} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Generate new</button>
        <CopyButton text={shown.join('\n')} label="Copy all" />
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Version 4 (random) UUIDs made in your browser with its secure random generator; nothing is sent or stored.</p>
    </section>
  );
};

export default UuidGenerator;
