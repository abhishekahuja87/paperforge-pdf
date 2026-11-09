import React, { useState } from 'react';
import { CalcFooter, calcCard } from '../../finance/ui';
import { fieldClass } from './common';
import { acceptNumber, useShared } from '../../../lib/shareState';

const fmt = (value: number) => (Number.isFinite(value) ? Number(value.toFixed(4)).toLocaleString('en-IN', { maximumFractionDigits: 4 }) : '—');
const num = (text: string) => (text.trim() === '' ? NaN : Number(text));

const Row: React.FC<{ title: string; children: React.ReactNode; result: string }> = ({ title, children, result }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="text-sm font-bold text-slate-900">{title}</h2>
    <div className="mt-2 grid grid-cols-2 gap-3">{children}</div>
    <p className="mt-3 text-lg font-black text-orange-800" aria-live="polite">{result}</p>
  </div>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; share: string }> = ({ label, value, onChange, share }) => {
  useShared(label, value, onChange, acceptNumber, share);
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
    </label>
  );
};

export const PercentageCalculator: React.FC = () => {
  const [a1, setA1] = useState('15');
  const [b1, setB1] = useState('2400');
  const [a2, setA2] = useState('45');
  const [b2, setB2] = useState('180');
  const [a3, setA3] = useState('80');
  const [b3, setB3] = useState('100');
  const [a4, setA4] = useState('20');
  const [b4, setB4] = useState('500');
  const [a5, setA5] = useState('25');
  const [b5, setB5] = useState('60');

  const r1 = (num(a1) / 100) * num(b1);
  const r2 = (num(a2) / num(b2)) * 100;
  const change = ((num(b3) - num(a3)) / Math.abs(num(a3))) * 100;
  const r3 = Number.isFinite(change) ? `${change >= 0 ? '+' : ''}${fmt(change)}% (${change >= 0 ? 'increase' : 'decrease'})` : '—';
  const up = num(b4) * (1 + num(a4) / 100);
  const down = num(b4) * (1 - num(a4) / 100);
  const whole = (num(b5) / num(a5)) * 100;

  return (
    <section className={`${calcCard} space-y-4`}>
      <Row title="What is X% of Y?" result={Number.isFinite(r1) ? `${fmt(num(a1))}% of ${fmt(num(b1))} = ${fmt(r1)}` : '—'}>
        <Field label="Percentage (X)" value={a1} onChange={setA1} share="a1" />
        <Field label="Of the number (Y)" value={b1} onChange={setB1} share="b1" />
      </Row>
      <Row title="X is what percent of Y?" result={Number.isFinite(r2) ? `${fmt(num(a2))} is ${fmt(r2)}% of ${fmt(num(b2))}` : '—'}>
        <Field label="Number (X)" value={a2} onChange={setA2} share="a2" />
        <Field label="Out of (Y)" value={b2} onChange={setB2} share="b2" />
      </Row>
      <Row title="Percentage change from X to Y" result={r3}>
        <Field label="From (X)" value={a3} onChange={setA3} share="a3" />
        <Field label="To (Y)" value={b3} onChange={setB3} share="b3" />
      </Row>
      <Row title="Increase or decrease Y by X%" result={Number.isFinite(up) ? `Increased: ${fmt(up)} · Decreased: ${fmt(down)}` : '—'}>
        <Field label="Percentage (X)" value={a4} onChange={setA4} share="a4" />
        <Field label="Number (Y)" value={b4} onChange={setB4} share="b4" />
      </Row>
      <Row title="Reverse: Y is X% of what number?" result={Number.isFinite(whole) ? `${fmt(num(b5))} is ${fmt(num(a5))}% of ${fmt(whole)}` : '—'}>
        <Field label="Percentage (X)" value={a5} onChange={setA5} share="a5" />
        <Field label="Known part (Y)" value={b5} onChange={setB5} share="b5" />
      </Row>
      <p className="text-[11px] text-slate-500">Tip: a rise of 25% followed by a fall of 25% does not return to the start, because the second percentage applies to a different base.</p>
      <CalcFooter />
    </section>
  );
};

export default PercentageCalculator;
