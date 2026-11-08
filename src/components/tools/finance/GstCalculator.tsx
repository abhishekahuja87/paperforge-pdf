import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeGst } from '../../../lib/finance/calculators';
import { formatInrPaise, parseAmount } from '../../../lib/finance/format';

const QUICK_RATES = [0, 3, 5, 18, 40];

export const GstCalculator: React.FC = () => {
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState('18');
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  const result = useMemo(() => {
    const value = parseAmount(amount);
    if (value <= 0) return null;
    return computeGst(value, parseAmount(rate), mode);
  }, [amount, rate, mode]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label={mode === 'add' ? 'Price without GST' : 'Price with GST included'} prefix="₹" value={amount} onChange={setAmount} words />
        <SelectField label="What do you want to do?" value={mode} onChange={(value) => setMode(value === 'remove' ? 'remove' : 'add')} options={[
          { value: 'add', label: 'Add GST to a price' },
          { value: 'remove', label: 'Remove GST from a price' },
        ]} />
        <NumberField label="GST rate" suffix="%" value={rate} onChange={setRate} />
        <div>
          <p className="text-xs font-semibold text-slate-700">Quick rates</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {QUICK_RATES.map((quick) => (
              <button key={quick} type="button" onClick={() => setRate(String(quick))} aria-pressed={parseAmount(rate) === quick} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${parseAmount(rate) === quick ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'}`}>{quick}%</button>
            ))}
          </div>
        </div>
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Price without GST" value={formatInrPaise(result.base)} />
          <Stat label="GST amount" value={formatInrPaise(result.gst)} tone="strong" />
          <Stat label="Price with GST" value={formatInrPaise(result.total)} tone="good" />
          <Stat label="CGST + SGST (within a state), each" value={formatInrPaise(result.half)} />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a price.</p>}
      <Note>For sales within a state, GST is split equally into CGST and SGST; for sales between states the whole amount is IGST. Check the GST rate for your product or service on the official GST rate schedule, as rates are revised from time to time.</Note>
      <CalcFooter />
    </section>
  );
};

export default GstCalculator;
