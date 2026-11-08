import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, NumberField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInrPaise, parseAmount } from '../../../lib/finance/format';
import { splitBill } from '../../../lib/utilities/more';

export const BillSplitter: React.FC = () => {
  const [total, setTotal] = useState('2450');
  const [tip, setTip] = useState('10');
  const [people, setPeople] = useState('4');
  const result = useMemo(() => {
    const t = parseAmount(total);
    const n = Math.floor(parseAmount(people));
    return t > 0 && n >= 1 && n <= 1000 ? splitBill(t, parseAmount(tip), n) : null;
  }, [total, tip, people]);
  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Bill amount" prefix="₹" value={total} onChange={setTotal} words />
        <NumberField label="Tip or service charge" suffix="%" value={tip} onChange={setTip} />
        <NumberField label="Number of people" value={people} onChange={setPeople} step="1" />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Each person pays" value={formatInrPaise(result.perPerson)} tone="strong" />
          <Stat label="Tip / service charge" value={formatInrPaise(result.tip)} />
          <Stat label="Total with tip" value={formatInrPaise(result.grand)} tone="good" />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a bill amount and 1 to 1000 people.</p>}
      <CalcFooter />
    </section>
  );
};

export default BillSplitter;
