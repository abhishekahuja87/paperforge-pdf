import React, { useState } from 'react';
import { CalcFooter, calcCard } from '../../finance/ui';
import { fieldClass } from './common';

const fmt = (value: number) => (Number.isFinite(value) ? Number(value.toFixed(4)).toLocaleString('en-IN', { maximumFractionDigits: 4 }) : '—');
const num = (text: string) => (text.trim() === '' ? NaN : Number(text));

const Row: React.FC<{ title: string; children: React.ReactNode; result: string }> = ({ title, children, result }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="text-sm font-bold text-slate-900">{title}</h2>
    <div className="mt-2 grid grid-cols-2 gap-3">{children}</div>
    <p className="mt-3 text-lg font-black text-orange-800" aria-live="polite">{result}</p>
  </div>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
  </label>
);

export const PercentageCalculator: React.FC = () => {
  const [a1, setA1] = useState('15');
  const [b1, setB1] = useState('2400');
  const [a2, setA2] = useState('45');
  const [b2, setB2] = useState('180');
  const [a3, setA3] = useState('80');
  const [b3, setB3] = useState('100');

  const r1 = (num(a1) / 100) * num(b1);
  const r2 = (num(a2) / num(b2)) * 100;
  const change = ((num(b3) - num(a3)) / Math.abs(num(a3))) * 100;
  const r3 = Number.isFinite(change) ? `${change >= 0 ? '+' : ''}${fmt(change)}% (${change >= 0 ? 'increase' : 'decrease'})` : '—';

  return (
    <section className={`${calcCard} space-y-4`}>
      <Row title="What is X% of Y?" result={Number.isFinite(r1) ? `${fmt(num(a1))}% of ${fmt(num(b1))} = ${fmt(r1)}` : '—'}>
        <Field label="Percentage (X)" value={a1} onChange={setA1} />
        <Field label="Of the number (Y)" value={b1} onChange={setB1} />
      </Row>
      <Row title="X is what percent of Y?" result={Number.isFinite(r2) ? `${fmt(num(a2))} is ${fmt(r2)}% of ${fmt(num(b2))}` : '—'}>
        <Field label="Number (X)" value={a2} onChange={setA2} />
        <Field label="Out of (Y)" value={b2} onChange={setB2} />
      </Row>
      <Row title="Percentage change from X to Y" result={r3}>
        <Field label="From (X)" value={a3} onChange={setA3} />
        <Field label="To (Y)" value={b3} onChange={setB3} />
      </Row>
      <CalcFooter />
    </section>
  );
};

export default PercentageCalculator;
