import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { calcCard } from '../../finance/ui';
import { CopyButton } from './common';
import { entropyBits, generatePassword, type PasswordOptions } from '../../../lib/utilities/password';

const Check: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
    {label}
  </label>
);

export const PasswordGenerator: React.FC = () => {
  const [options, setOptions] = useState<PasswordOptions>({ length: 16, lower: true, upper: true, digits: true, symbols: true, avoidLookAlikes: false });
  const [password, setPassword] = useState('');
  const regenerate = useCallback(() => setPassword(generatePassword(options)), [options]);
  useEffect(() => { regenerate(); }, [regenerate]);

  const set = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => setOptions((current) => ({ ...current, [key]: value }));
  const bits = entropyBits(options);
  const strength = bits >= 100 ? 'Very strong' : bits >= 70 ? 'Strong' : bits >= 50 ? 'Fair' : 'Weak';
  const anySet = options.lower || options.upper || options.digits || options.symbols;

  return (
    <section className={calcCard}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="break-all font-mono text-lg font-bold text-slate-900" aria-live="polite">{anySet ? password : 'Tick at least one character type.'}</p>
        <p className="mt-2 text-xs text-slate-600">{anySet ? `${strength} · about ${bits} bits of randomness` : ''}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={regenerate} disabled={!anySet} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Generate new
        </button>
        <CopyButton text={anySet ? password : ''} label="Copy password" />
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <label className="block text-xs font-semibold text-slate-700">
          Length: {options.length}
          <input type="range" min={6} max={64} value={options.length} onChange={(event) => set('length', Number(event.target.value))} className="mt-2 w-full" />
        </label>
        <div className="mt-2 grid grid-cols-2 gap-x-4">
          <Check label="Lowercase (a-z)" checked={options.lower} onChange={(v) => set('lower', v)} />
          <Check label="Uppercase (A-Z)" checked={options.upper} onChange={(v) => set('upper', v)} />
          <Check label="Numbers (0-9)" checked={options.digits} onChange={(v) => set('digits', v)} />
          <Check label="Symbols (!@#…)" checked={options.symbols} onChange={(v) => set('symbols', v)} />
          <Check label="Avoid look-alikes (0 O 1 l I)" checked={options.avoidLookAlikes} onChange={(v) => set('avoidLookAlikes', v)} />
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Generated in your browser with the secure random generator; the password is never sent or stored.</p>
    </section>
  );
};

export default PasswordGenerator;
