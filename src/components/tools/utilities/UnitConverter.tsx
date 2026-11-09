import React, { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { CalcFooter, SelectField, SimpleTable, Stat, calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from './common';
import { UNIT_CATEGORIES, convertUnit } from '../../../lib/utilities/units';
import { acceptNumber, useShared } from '../../../lib/shareState';

const shortLabel = (label: string) => label.match(/\(([^)]+)\)/)?.[1] ?? label;
const show = (value: number) => Number(value.toPrecision(10)).toLocaleString('en-IN', { maximumFractionDigits: 8 });

export const UnitConverter: React.FC = () => {
  const [categoryId, setCategoryId] = useState('length');
  const category = UNIT_CATEGORIES.find((item) => item.id === categoryId) ?? UNIT_CATEGORIES[0];
  const [value, setValue] = useState('1');
  useShared('Value', value, setValue, acceptNumber);
  const [from, setFrom] = useState(category.units[0].id);
  const [to, setTo] = useState(category.units[1].id);

  const chooseCategory = (id: string) => {
    const next = UNIT_CATEGORIES.find((item) => item.id === id) ?? UNIT_CATEGORIES[0];
    setCategoryId(id);
    setFrom(next.units[0].id);
    setTo(next.units[1].id);
  };
  const swap = () => { setFrom(to); setTo(from); };

  const valid = value.trim() !== '' && Number.isFinite(Number(value));
  const result = useMemo(() => {
    if (!valid) return null;
    const converted = convertUnit(category, Number(value), from, to);
    return Number.isFinite(converted) ? converted : null;
  }, [category, value, from, to, valid]);

  const allRows = useMemo(() => {
    if (!valid) return [];
    return category.units.map((unit) => [unit.label, show(convertUnit(category, Number(value), from, unit.id))]);
  }, [category, value, from, valid]);

  const options = category.units.map((unit) => ({ value: unit.id, label: unit.label }));
  const toUnit = category.units.find((unit) => unit.id === to);
  const resultText = result === null ? '—' : `${show(result)} ${shortLabel(toUnit?.label ?? '')}`;

  return (
    <section className={calcCard}>
      <ChoiceButtons label="Unit type" value={categoryId} onChange={chooseCategory} options={UNIT_CATEGORIES.map((item) => ({ value: item.id, label: item.label }))} />
      <div className="mt-4 grid items-end gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1.4fr_auto_1.4fr]">
        <label className="block text-xs font-semibold text-slate-700">
          Value
          <input type="number" inputMode="decimal" step="any" value={value} onChange={(event) => setValue(event.target.value)} className={fieldClass} />
        </label>
        <SelectField label="From" value={from} onChange={setFrom} options={options} />
        <button type="button" onClick={swap} aria-label="Swap the two units" className="flex h-11 w-11 items-center justify-center justify-self-start rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 sm:justify-self-center">
          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <SelectField label="To" value={to} onChange={setTo} options={options} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3" aria-live="polite">
        <div className="min-w-0 flex-1"><Stat label="Result" value={resultText} tone="strong" /></div>
        <CopyButton text={result === null ? '' : resultText} label="Copy result" />
      </div>
      {allRows.length > 0 && <SimpleTable caption={`${category.label}: the same value in every unit`} head={['Unit', `Value equal to ${value} ${shortLabel(category.units.find((unit) => unit.id === from)?.label ?? '')}`]} rows={allRows} />}
      {category.id === 'data' && <p className="mt-3 text-xs text-slate-500">Uses 1 KB = 1024 bytes, as most operating systems do.</p>}
      {category.id === 'area' && <p className="mt-3 text-xs text-slate-500">Local land units such as bigha, gaj, guntha and cent differ between states and are not included.</p>}
      <CalcFooter />
    </section>
  );
};

export default UnitConverter;
