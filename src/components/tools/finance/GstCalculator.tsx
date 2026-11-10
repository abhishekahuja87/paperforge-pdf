import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeGst, impliedGstRate } from '../../../lib/finance/calculators';
import { formatInrPaise, formatPercent, parseAmount } from '../../../lib/finance/format';

const QUICK_RATES = [0, 3, 5, 18, 40];

export const GstCalculator: React.FC = () => {
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState('18');
  const [mode, setMode] = useState<'add' | 'remove' | 'rate'>('add');
  const [supply, setSupply] = useState<'within' | 'between'>('within');
  const [withGst, setWithGst] = useState('1180');

  const result = useMemo(() => {
    const value = parseAmount(amount);
    if (value <= 0 || mode === 'rate') return null;
    return computeGst(value, parseAmount(rate), mode);
  }, [amount, rate, mode]);
  const implied = mode === 'rate' ? impliedGstRate(parseAmount(amount), parseAmount(withGst)) : null;
  const nearest = implied === null ? null : QUICK_RATES.reduce((best, candidate) => (Math.abs(candidate - implied) < Math.abs(best - implied) ? candidate : best), 0);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField shareKey="amount" label={mode === 'remove' ? 'Price with GST included' : 'Price without GST'} prefix="₹" value={amount} onChange={setAmount} words />
        <SelectField label="What do you want to do?" value={mode} onChange={(value) => setMode(value === 'remove' ? 'remove' : 'add')} options={[
          { value: 'add', label: 'Add GST to a price' },
          { value: 'remove', label: 'Remove GST from a price' },
          { value: 'rate', label: 'Find the GST rate from two prices' },
        ]} />
        {mode === 'rate' ? (
          <NumberField label="Price with GST" prefix="₹" value={withGst} onChange={setWithGst} words />
        ) : (
          <>
            <NumberField label="GST rate" suffix="%" value={rate} onChange={setRate} />
            <SelectField label="Where is the sale?" value={supply} onChange={(value) => setSupply(value === 'between' ? 'between' : 'within')} options={[
              { value: 'within', label: 'Within one state (CGST + SGST)' },
              { value: 'between', label: 'Between states (IGST)' },
            ]} />
          </>
        )}
        {mode !== 'rate' && <div>
          <p className="text-xs font-semibold text-slate-700">Quick rates</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {QUICK_RATES.map((quick) => (
              <button key={quick} type="button" onClick={() => setRate(String(quick))} aria-pressed={parseAmount(rate) === quick} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${parseAmount(rate) === quick ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'}`}>{quick}%</button>
            ))}
          </div>
        </div>}
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Price without GST" value={formatInrPaise(result.base)} />
          <Stat label="GST amount" value={formatInrPaise(result.gst)} tone="strong" />
          <Stat label="Price with GST" value={formatInrPaise(result.total)} tone="good" />
          {supply === 'within'
            ? <Stat label={`CGST ${formatPercent(parseAmount(rate) / 2, 2)} and SGST ${formatPercent(parseAmount(rate) / 2, 2)}, each`} value={formatInrPaise(result.half)} />
            : <Stat label={`IGST ${formatPercent(parseAmount(rate), 2)}`} value={formatInrPaise(result.gst)} />}
        </StatGrid>
      ) : mode === 'rate' ? (
        implied === null
          ? <p className="mt-4 text-xs text-slate-500">Enter the price without GST and the larger price with GST.</p>
          : (
            <StatGrid>
              <Stat label="GST rate" value={formatPercent(implied, 2)} tone="strong" />
              <Stat label="GST amount" value={formatInrPaise(parseAmount(withGst) - parseAmount(amount))} />
              <Stat label="Closest standard slab" value={nearest !== null && Math.abs((nearest ?? 0) - implied) < 0.05 ? `${nearest}%` : 'None: the prices may be rounded or not at a standard rate'} tone="good" />
            </StatGrid>
          )
      ) : <p className="mt-4 text-xs text-slate-500">Enter a price.</p>}
      <Note>For sales within a state, GST is split equally into CGST and SGST; for sales between states the whole amount is IGST. Check the GST rate for your product or service on the official GST rate schedule, as rates are revised from time to time.</Note>
      <CalcFooter />
    </section>
  );
};

export default GstCalculator;
