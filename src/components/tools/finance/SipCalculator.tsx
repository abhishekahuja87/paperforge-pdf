import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeSip } from '../../../lib/finance/calculators';
import { formatInr, parseAmount } from '../../../lib/finance/format';

export const SipCalculator: React.FC = () => {
  const [monthly, setMonthly] = useState('10000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('15');
  const [stepUp, setStepUp] = useState('0');

  const result = useMemo(() => {
    const m = parseAmount(monthly);
    const y = parseAmount(years);
    if (m <= 0 || y <= 0) return null;
    return computeSip(m, parseAmount(rate), y, parseAmount(stepUp));
  }, [monthly, rate, years, stepUp]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Monthly investment" prefix="₹" value={monthly} onChange={setMonthly} words />
        <NumberField label="Expected return (per year)" suffix="%" value={rate} onChange={setRate} hint="Returns are not guaranteed" />
        <NumberField label="Time period" suffix="years" value={years} onChange={setYears} />
        <NumberField label="Yearly step-up (optional)" suffix="%" value={stepUp} onChange={setStepUp} hint="Raise the SIP by this much every year" />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Expected value" value={formatInr(result.value)} tone="strong" />
            <Stat label="Amount invested" value={formatInr(result.invested)} />
            <Stat label="Estimated gains" value={formatInr(result.gains)} tone="good" />
            <Stat label="Gains as multiple of investment" value={`${(result.gains / result.invested).toFixed(2)}×`} />
          </StatGrid>
          <SimpleTable
            caption="Year-wise SIP growth"
            head={['Year', 'Invested', 'Value']}
            rows={result.years.map((row) => [String(row.year), formatInr(row.invested), formatInr(row.value)])}
          />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a monthly amount and a time period.</p>}
      <Note>Assumes the instalment is invested at the start of each month and the return compounds monthly at one-twelfth of the yearly rate. Real mutual fund returns vary and are taxed; this does not include tax or expense changes.</Note>
      <CalcFooter />
    </section>
  );
};

export default SipCalculator;
