import React, { useMemo, useState } from 'react';
import { CalcFooter, SelectField, Stat, calcCard } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from './common';
import { UNIT_CATEGORIES, convertUnit } from '../../../lib/utilities/units';

export const UnitConverter: React.FC = () => {
  const [categoryId, setCategoryId] = useState('length');
  const category = UNIT_CATEGORIES.find((item) => item.id === categoryId) ?? UNIT_CATEGORIES[0];
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState(category.units[0].id);
  const [to, setTo] = useState(category.units[1].id);

  const chooseCategory = (id: string) => {
    const next = UNIT_CATEGORIES.find((item) => item.id === id) ?? UNIT_CATEGORIES[0];
    setCategoryId(id);
    setFrom(next.units[0].id);
    setTo(next.units[1].id);
  };

  const result = useMemo(() => {
    if (value.trim() === '' || !Number.isFinite(Number(value))) return null;
    const converted = convertUnit(category, Number(value), from, to);
    return Number.isFinite(converted) ? converted : null;
  }, [category, value, from, to]);

  const options = category.units.map((unit) => ({ value: unit.id, label: unit.label }));
  const display = result === null ? '—' : Number(result.toPrecision(10)).toLocaleString('en-IN', { maximumFractionDigits: 8 });

  return (
    <section className={calcCard}>
      <ChoiceButtons label="Unit type" value={categoryId} onChange={chooseCategory} options={UNIT_CATEGORIES.map((item) => ({ value: item.id, label: item.label }))} />
      <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-700">
          Value
          <input type="number" inputMode="decimal" step="any" value={value} onChange={(event) => setValue(event.target.value)} className={fieldClass} />
        </label>
        <SelectField label="From" value={from} onChange={setFrom} options={options} />
        <SelectField label="To" value={to} onChange={setTo} options={options} />
      </div>
      <div className="mt-4" aria-live="polite">
        <Stat label="Result" value={result === null ? '—' : `${display} ${category.units.find((unit) => unit.id === to)?.label.match(/\(([^)]+)\)/)?.[1] ?? category.units.find((unit) => unit.id === to)?.label ?? ''}`} tone="strong" />
      </div>
      {category.id === 'data' && <p className="mt-3 text-xs text-slate-500">Uses 1 KB = 1024 bytes, as most operating systems do.</p>}
      <CalcFooter />
    </section>
  );
};

export default UnitConverter;
