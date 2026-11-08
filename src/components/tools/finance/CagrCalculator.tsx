import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, formatPercent, parseAmount } from '../../../lib/finance/format';
import { cagr } from '../../../lib/utilities/interest';

export const CagrCalculator: React.FC = () => {
  const [initial, setInitial] = useState('100000');
  const [final, setFinal] = useState('200000');
  const [years, setYears] = useState('5');

  const result = useMemo(() => {
    const rate = cagr(parseAmount(initial), parseAmount(final), parseAmount(years));
    return Number.isFinite(rate) ? { rate, gain: parseAmount(final) - parseAmount(initial), multiple: parseAmount(final) / parseAmount(initial) } : null;
  }, [initial, final, years]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Initial value" prefix="₹" value={initial} onChange={setInitial} words />
        <NumberField label="Final value" prefix="₹" value={final} onChange={setFinal} words />
        <NumberField label="Number of years" value={years} onChange={setYears} hint="Decimals allowed, e.g. 3.5" />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="CAGR (per year)" value={formatPercent(result.rate, 2)} tone="strong" />
          <Stat label="Total gain" value={formatInr(result.gain)} tone={result.gain >= 0 ? 'good' : 'plain'} />
          <Stat label="Growth multiple" value={`${result.multiple.toFixed(2)}×`} />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter an initial value, a final value and a period, all above zero.</p>}
      <Note>CAGR smooths growth into one steady yearly rate: (Final ÷ Initial)^(1 ÷ Years) − 1. It ignores money added or withdrawn along the way; use XIRR for that.</Note>
      <CalcFooter />
    </section>
  );
};

export default CagrCalculator;
