import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, formatPercent, parseAmount } from '../../../lib/finance/format';
import { cagr } from '../../../lib/utilities/interest';

export const CagrCalculator: React.FC = () => {
  const [initial, setInitial] = useState('100000');
  const [final, setFinal] = useState('200000');
  const [years, setYears] = useState('5');

  const result = useMemo(() => {
    const i = parseAmount(initial);
    const f = parseAmount(final);
    const rate = cagr(i, f, parseAmount(years));
    if (!Number.isFinite(rate)) return null;
    const doubling = rate > 0 ? Math.log(2) / Math.log(1 + rate / 100) : null;
    const rows = [5, 10, 15, 20].map((extra) => [`${extra} more years`, formatInr(f * (1 + rate / 100) ** extra)]);
    return { rate, gain: f - i, multiple: f / i, doubling, rows };
  }, [initial, final, years]);

  const summary = result ? `Growth from ${formatInr(parseAmount(initial))} to ${formatInr(parseAmount(final))} in ${years} years is a CAGR of ${formatPercent(result.rate, 2)} a year. mydailyutils.in` : '';

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Initial value" prefix="₹" value={initial} onChange={setInitial} words />
        <NumberField label="Final value" prefix="₹" value={final} onChange={setFinal} words />
        <NumberField label="Number of years" value={years} onChange={setYears} hint="Decimals allowed, e.g. 3.5" />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="CAGR (per year)" value={formatPercent(result.rate, 2)} tone="strong" />
            <Stat label="Total gain" value={formatInr(result.gain)} tone={result.gain >= 0 ? 'good' : 'plain'} />
            <Stat label="Growth multiple" value={`${result.multiple.toFixed(2)}×`} />
            <Stat label="Time to double at this rate" value={result.doubling ? `${result.doubling.toFixed(1)} years` : 'Not growing'} />
          </StatGrid>
          {result.rate > 0 && (
            <SimpleTable caption="If the same growth continued" head={['From the final value', 'Would grow to']} rows={result.rows} />
          )}
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter an initial value, a final value and a period, all above zero.</p>}
      <Note>CAGR smooths growth into one steady yearly rate: (Final ÷ Initial)^(1 ÷ Years) − 1. It ignores money added or withdrawn along the way; use XIRR for that. Past growth does not predict future returns; the table only shows what the same rate would imply.</Note>
      <CalcFooter />
    </section>
  );
};

export default CagrCalculator;
