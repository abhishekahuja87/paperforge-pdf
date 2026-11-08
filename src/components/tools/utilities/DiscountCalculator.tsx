import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInrPaise, parseAmount } from '../../../lib/finance/format';

export const DiscountCalculator: React.FC = () => {
  const [price, setPrice] = useState('2499');
  const [discount, setDiscount] = useState('30');
  const [extra, setExtra] = useState('0');

  const result = useMemo(() => {
    const p = parseAmount(price);
    const d = parseAmount(discount);
    const e = parseAmount(extra);
    if (p <= 0 || d < 0 || d > 100 || e < 0 || e > 100) return null;
    const afterFirst = p * (1 - d / 100);
    const final = afterFirst * (1 - e / 100);
    return { final, saved: p - final, effective: ((p - final) / p) * 100, afterFirst };
  }, [price, discount, extra]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Original price" prefix="₹" value={price} onChange={setPrice} words />
        <NumberField label="Discount" suffix="%" value={discount} onChange={setDiscount} />
        <NumberField label="Extra discount (optional)" suffix="%" value={extra} onChange={setExtra} hint="Applied after the first discount, e.g. a coupon" />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="You pay" value={formatInrPaise(result.final)} tone="strong" />
          <Stat label="You save" value={formatInrPaise(result.saved)} tone="good" />
          <Stat label="Effective discount" value={`${result.effective.toFixed(2)}%`} />
          {parseAmount(extra) > 0 && <Stat label="After first discount" value={formatInrPaise(result.afterFirst)} />}
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a price and percentages between 0 and 100.</p>}
      <Note>Two discounts do not add up: 30% then 10% is 37% in total, not 40%, because the second applies to the reduced price.</Note>
      <CalcFooter />
    </section>
  );
};

export default DiscountCalculator;
