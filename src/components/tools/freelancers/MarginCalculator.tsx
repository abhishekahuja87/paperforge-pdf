import React, { useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { CURRENCIES, formatMoney } from '../../../lib/freelancers/currency';
import { breakEvenUnits, discountImpact, marginFromMarkup, marginOf, markupFromMargin, markupOf, priceForMargin, priceForMarkup } from '../../../lib/freelancers/margin';

const pct = (value: number) => (Number.isFinite(value) ? `${(Math.round(value * 100) / 100).toString()}%` : '-');

export const MarginCalculator: React.FC = () => {
  const [mode, setMode] = useState('prices');
  const [currency, setCurrency] = useState('USD');
  const [cost, setCost] = useState('60');
  const [price, setPrice] = useState('100');
  const [targetMargin, setTargetMargin] = useState('40');
  const [targetMarkup, setTargetMarkup] = useState('66.67');
  const [discount, setDiscount] = useState('10');
  const [fixed, setFixed] = useState('1000');
  const money = (value: number) => formatMoney(value, currency);
  const c = Number(cost);
  const p = Number(price);
  const impact = discountImpact(c, p, Number(discount));
  const breakEven = breakEvenUnits(Number(fixed), p, c);

  return (
    <section className={calcCard}>
      <InputGrid><SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCIES.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))} /></InputGrid>
      <div className="mt-3">
        <ChoiceButtons label="What do you want to work out?" value={mode} onChange={setMode} options={[
          { value: 'prices', label: 'Margin and markup from cost and price' }, { value: 'target', label: 'Price for a target margin' }, { value: 'discount', label: 'Effect of a discount' }, { value: 'breakeven', label: 'Break-even' },
        ]} />
      </div>
      <div className="mt-4">
        <InputGrid>
          <NumberField label="Cost" value={cost} onChange={setCost} hint="What it costs you to deliver one unit, hour or project" />
          {(mode === 'prices' || mode === 'discount' || mode === 'breakeven') && <NumberField label="Selling price" value={price} onChange={setPrice} />}
          {mode === 'target' && <NumberField label="Margin you want" value={targetMargin} onChange={setTargetMargin} suffix="%" />}
          {mode === 'target' && <NumberField label="Or markup you want" value={targetMarkup} onChange={setTargetMarkup} suffix="%" />}
          {mode === 'discount' && <NumberField label="Discount you plan to offer" value={discount} onChange={setDiscount} suffix="%" />}
          {mode === 'breakeven' && <NumberField label="Fixed costs to cover" value={fixed} onChange={setFixed} hint="Rent, software, salaries or any cost that does not change per sale" />}
        </InputGrid>
      </div>

      {mode === 'prices' && (
        <>
          <StatGrid>
            <Stat tone="strong" label="Profit margin" value={pct(marginOf(c, p))} />
            <Stat label="Markup" value={pct(markupOf(c, p))} />
            <Stat label="Profit per sale" value={Number.isFinite(p - c) ? money(p - c) : '-'} />
          </StatGrid>
          <ResultActions summary={`Cost ${money(c)}, price ${money(p)}: margin ${pct(marginOf(c, p))}, markup ${pct(markupOf(c, p))}.`} />
        </>
      )}
      {mode === 'target' && (
        <>
          <StatGrid>
            <Stat tone="strong" label={`Price for a ${targetMargin}% margin`} value={Number.isFinite(priceForMargin(c, Number(targetMargin))) ? money(priceForMargin(c, Number(targetMargin))) : '-'} />
            <Stat label="That margin equals a markup of" value={pct(markupFromMargin(Number(targetMargin)))} />
            <Stat tone="strong" label={`Price for a ${targetMarkup}% markup`} value={money(priceForMarkup(c, Number(targetMarkup)))} />
            <Stat label="That markup equals a margin of" value={pct(marginFromMarkup(Number(targetMarkup)))} />
          </StatGrid>
          <Note>A 50% markup is not a 50% margin. Adding 50% to cost gives a margin of 33.3%. To earn a 50% margin you need to double your cost, which is a 100% markup.</Note>
        </>
      )}
      {mode === 'discount' && (impact ? (
        <>
          <StatGrid>
            <Stat label="Price after discount" value={money(impact.newPrice)} />
            <Stat label="Profit per sale after discount" value={money(impact.newProfit)} />
            <Stat label="New margin" value={pct(impact.newMargin)} />
            <Stat tone="strong" label="Extra sales needed to earn the same total profit" value={impact.extraSalesNeeded === null ? 'The discount removes all profit' : pct(impact.extraSalesNeeded)} />
          </StatGrid>
          <Note>A discount cuts profit on every sale, so you have to sell more just to stand still. Check whether you can realistically win that many extra sales before you offer it.</Note>
        </>
      ) : <Note>Enter a price above zero, a cost, and a discount below 100%.</Note>)}
      {mode === 'breakeven' && (
        <>
          <StatGrid>
            <Stat tone="strong" label="Sales needed to break even" value={breakEven === null ? 'Price must be above cost' : String(breakEven)} />
            <Stat label="Profit per sale" value={Number.isFinite(p - c) ? money(p - c) : '-'} />
          </StatGrid>
          <Note>Break-even is the number of sales at which your profit per sale has paid off your fixed costs. Every sale after that adds profit.</Note>
        </>
      )}
      <Note>Margin is profit as a share of the selling price. Markup is profit as a share of cost. Check which one your client, accountant or marketplace asks for. Tax, fees and refunds are not included unless you add them to the cost.</Note>
      <CalcFooter />
    </section>
  );
};

export default MarginCalculator;
