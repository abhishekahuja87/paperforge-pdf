import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, Stat, StatGrid, calcCard } from '../../finance/ui';
import { ChoiceButtons } from './common';
import { formatInrPaise, parseAmount } from '../../../lib/finance/format';

export const DiscountCalculator: React.FC = () => {
  const [mode, setMode] = useState('price');
  const [price, setPrice] = useState('2499');
  const [discount, setDiscount] = useState('30');
  const [extra, setExtra] = useState('0');
  const [gst, setGst] = useState('0');
  const [sale, setSale] = useState('1749');

  const forward = useMemo(() => {
    const p = parseAmount(price);
    const d = parseAmount(discount);
    const e = parseAmount(extra);
    const g = parseAmount(gst);
    if (p <= 0 || d < 0 || d > 100 || e < 0 || e > 100 || g < 0) return null;
    const afterFirst = p * (1 - d / 100);
    const final = afterFirst * (1 - e / 100);
    const tax = (final * g) / 100;
    return { final, saved: p - final, effective: ((p - final) / p) * 100, afterFirst, tax, payable: final + tax };
  }, [price, discount, extra, gst]);

  const reverse = useMemo(() => {
    const s = parseAmount(sale);
    const d = parseAmount(discount);
    if (s <= 0 || d < 0 || d >= 100) return null;
    const original = s / (1 - d / 100);
    return { original, saved: original - s };
  }, [sale, discount]);

  const summary = mode === 'price' && forward
    ? `Original ${formatInrPaise(parseAmount(price))}, ${discount}% off${parseAmount(extra) > 0 ? ` and ${extra}% extra` : ''}: you pay ${formatInrPaise(forward.final)}${parseAmount(gst) > 0 ? ` (${formatInrPaise(forward.payable)} with ${gst}% GST)` : ''} and save ${formatInrPaise(forward.saved)}. mydailyutils.in`
    : reverse ? `A sale price of ${formatInrPaise(parseAmount(sale))} after ${discount}% off means an original price of ${formatInrPaise(reverse.original)}. mydailyutils.in` : '';

  return (
    <section className={calcCard}>
      <div className="mb-4"><ChoiceButtons label="What do you want to find?" value={mode} onChange={setMode} options={[{ value: 'price', label: 'Price after discount' }, { value: 'original', label: 'Original price from sale price' }]} /></div>
      {mode === 'price' ? (
        <>
          <InputGrid>
            <NumberField label="Original price" prefix="₹" value={price} onChange={setPrice} words />
            <NumberField label="Discount" suffix="%" value={discount} onChange={setDiscount} />
            <NumberField label="Extra discount (optional)" suffix="%" value={extra} onChange={setExtra} hint="Applied after the first discount, e.g. a coupon" />
            <NumberField label="GST to add (optional)" suffix="%" value={gst} onChange={setGst} hint="Use if the price is shown before GST" />
          </InputGrid>
          {forward ? (
            <>
              <StatGrid>
                <Stat label="You pay" value={formatInrPaise(forward.final)} tone="strong" />
                <Stat label="You save" value={formatInrPaise(forward.saved)} tone="good" />
                <Stat label="Effective discount" value={`${forward.effective.toFixed(2)}%`} />
                {parseAmount(extra) > 0 && <Stat label="After first discount" value={formatInrPaise(forward.afterFirst)} />}
                {parseAmount(gst) > 0 && <Stat label={`GST at ${gst}%`} value={formatInrPaise(forward.tax)} />}
                {parseAmount(gst) > 0 && <Stat label="Total with GST" value={formatInrPaise(forward.payable)} tone="strong" />}
              </StatGrid>
              <ResultActions summary={summary} />
            </>
          ) : <p className="mt-4 text-xs text-slate-500">Enter a price and percentages between 0 and 100.</p>}
        </>
      ) : (
        <>
          <InputGrid>
            <NumberField label="Sale price you see" prefix="₹" value={sale} onChange={setSale} words />
            <NumberField label="Discount given" suffix="%" value={discount} onChange={setDiscount} hint="Must be below 100" />
          </InputGrid>
          {reverse ? (
            <>
              <StatGrid>
                <Stat label="Original price was" value={formatInrPaise(reverse.original)} tone="strong" />
                <Stat label="Amount saved" value={formatInrPaise(reverse.saved)} tone="good" />
              </StatGrid>
              <ResultActions summary={summary} />
            </>
          ) : <p className="mt-4 text-xs text-slate-500">Enter a sale price and a discount below 100%.</p>}
        </>
      )}
      <Note>Two discounts do not add up: 30% then 10% is 37% in total, not 40%, because the second applies to the reduced price. GST is added after the discounts here; check how the seller shows it.</Note>
      <CalcFooter />
    </section>
  );
};

export default DiscountCalculator;
