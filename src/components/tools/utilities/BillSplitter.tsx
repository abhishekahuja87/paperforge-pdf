import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, NumberField, ResultActions, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInrPaise, parseAmount } from '../../../lib/finance/format';
import { splitBill } from '../../../lib/utilities/more';

export const BillSplitter: React.FC = () => {
  const [total, setTotal] = useState('2450');
  const [tip, setTip] = useState('10');
  const [people, setPeople] = useState('4');
  const [round, setRound] = useState('0');
  const result = useMemo(() => {
    const t = parseAmount(total);
    const n = Math.floor(parseAmount(people));
    if (t <= 0 || n < 1 || n > 1000) return null;
    const base = splitBill(t, parseAmount(tip), n);
    const step = Number(round);
    const each = step > 0 ? Math.ceil(base.perPerson / step) * step : base.perPerson;
    return { ...base, each, collected: each * n, extra: each * n - base.grand, n };
  }, [total, tip, people, round]);
  const summary = result ? `Bill ${formatInrPaise(parseAmount(total))} plus ${tip}% tip = ${formatInrPaise(result.grand)}; ${result.n} people pay ${formatInrPaise(result.each)} each. mydailyutils.in` : '';
  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Bill amount" prefix="₹" value={total} onChange={setTotal} words />
        <NumberField label="Tip or service charge" suffix="%" value={tip} onChange={setTip} hint="Set 0 if service charge is already on the bill" />
        <NumberField label="Number of people" value={people} onChange={setPeople} step="1" />
        <SelectField label="Round each share up to" value={round} onChange={setRound} options={[
          { value: '0', label: 'Exact amount' }, { value: '1', label: 'Next ₹1' }, { value: '5', label: 'Next ₹5' }, { value: '10', label: 'Next ₹10' },
        ]} />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Each person pays" value={formatInrPaise(result.each)} tone="strong" />
            <Stat label="Tip / service charge" value={formatInrPaise(result.tip)} />
            <Stat label="Total with tip" value={formatInrPaise(result.grand)} tone="good" />
            {result.extra > 0.004 && <Stat label="Extra collected by rounding" value={formatInrPaise(result.extra)} />}
          </StatGrid>
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a bill amount and 1 to 1000 people.</p>}
      <p className="mt-3 text-xs text-slate-500">Everyone pays the same share. For uneven orders, settle those items first and split the rest.</p>
      <CalcFooter />
    </section>
  );
};

export default BillSplitter;
