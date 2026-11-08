import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton } from './common';
import { crackTime, entropyBits, generatePassword, generatePin, type PasswordOptions } from '../../../lib/utilities/password';

const Check: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
    {label}
  </label>
);

export const PasswordGenerator: React.FC = () => {
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [count, setCount] = useState('1');
  const [pinLength, setPinLength] = useState(6);
  const [options, setOptions] = useState<PasswordOptions>({ length: 16, lower: true, upper: true, digits: true, symbols: true, avoidLookAlikes: false });
  const [list, setList] = useState<string[]>([]);

  const anySet = options.lower || options.upper || options.digits || options.symbols;
  const regenerate = useCallback(() => {
    const n = Number(count);
    setList(Array.from({ length: n }, () => (mode === 'pin' ? generatePin(pinLength) : generatePassword(options))));
  }, [count, mode, pinLength, options]);
  useEffect(() => { regenerate(); }, [regenerate]);

  const set = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => setOptions((current) => ({ ...current, [key]: value }));
  const bits = mode === 'pin' ? Math.floor(pinLength * Math.log2(10)) : entropyBits(options);
  const level = mode === 'pin' ? (bits >= 36 ? 2 : 1) : bits >= 100 ? 4 : bits >= 70 ? 3 : bits >= 50 ? 2 : 1;
  const label = mode === 'pin' ? 'A PIN is only safe where attempts are limited' : ['', 'Weak', 'Fair', 'Strong', 'Very strong'][level];
  const usable = mode === 'pin' || anySet;
  const shown = usable ? list : [];

  return (
    <section className={calcCard}>
      <div className="mb-4"><ChoiceButtons label="What to generate" value={mode} onChange={(value) => setMode(value as 'password' | 'pin')} options={[{ value: 'password', label: 'Password' }, { value: 'pin', label: 'Numeric PIN' }]} /></div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        {usable ? (
          <ul className="space-y-2" aria-live="polite">
            {shown.map((item, index) => (
              <li key={`${index}-${item}`} className="flex items-center justify-between gap-3">
                <span className="min-w-0 break-all font-mono text-lg font-bold text-slate-900">{item}</span>
                {shown.length > 1 && <CopyButton text={item} label="Copy" />}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm font-semibold text-slate-700">Tick at least one character type.</p>}
        {usable && (
          <div className="mt-3">
            <div className="flex gap-1" role="img" aria-label={`Strength: ${label}`}>
              {[1, 2, 3, 4].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${step <= level ? (level >= 3 ? 'bg-emerald-500' : level === 2 ? 'bg-amber-500' : 'bg-red-500') : 'bg-slate-200'}`} />)}
            </div>
            <p className="mt-2 text-xs text-slate-600">{label} · about {bits} bits of randomness · a fast attacker would need {crackTime(bits)} to guess it</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={regenerate} disabled={!usable} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Generate new
        </button>
        <CopyButton text={usable ? shown.join('\n') : ''} label={shown.length > 1 ? 'Copy all' : 'Copy'} />
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        {mode === 'password' ? (
          <>
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
          </>
        ) : (
          <label className="block text-xs font-semibold text-slate-700">
            PIN length: {pinLength} digits
            <input type="range" min={4} max={12} value={pinLength} onChange={(event) => setPinLength(Number(event.target.value))} className="mt-2 w-full" />
          </label>
        )}
        <div className="mt-3"><ChoiceButtons label="How many to generate" value={count} onChange={setCount} options={[{ value: '1', label: '1' }, { value: '5', label: '5' }, { value: '10', label: '10' }]} /></div>
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Generated in your browser with the secure random generator; nothing is sent or stored. The guess-time estimate assumes 10 billion guesses a second against a fast, unprotected target and is only a guide.</p>
    </section>
  );
};

export default PasswordGenerator;
