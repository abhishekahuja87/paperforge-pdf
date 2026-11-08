import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SimpleTable, SplitBar, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { recurringDeposit } from '../../../lib/utilities/interest';

export const RdCalculator: React.FC = () => {
  const [monthly, setMonthly] = useState('5000');
  const [rate, setRate] = useState('6.5');
  const [months, setMonths] = useState('60');

  const result = useMemo(() => {
    const m = parseAmount(monthly);
    const n = Math.round(parseAmount(months));
    if (m <= 0 || n <= 0 || n > 600) return null;
    const r = parseAmount(rate);
    const checkpoints = Array.from(new Set([...Array.from({ length: Math.floor(n / 12) }, (_, i) => (i + 1) * 12), n]));
    const rows = checkpoints.map((k) => {
      const part = recurringDeposit(m, r, k);
      return [k % 12 === 0 ? `${k / 12} yr` : `${k} mo`, formatInr(part.deposited), formatInr(part.interest), formatInr(part.total)];
    });
    return { ...recurringDeposit(m, r, n), rows, n, m };
  }, [monthly, rate, months]);

  const summary = result ? `Recurring deposit of ${formatInr(result.m)} a month for ${result.n} months at ${rate}%: deposited ${formatInr(result.deposited)}, interest ${formatInr(result.interest)}, maturity ${formatInr(result.total)}. mydailyutils.in` : '';

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Monthly deposit" prefix="₹" value={monthly} onChange={setMonthly} words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Period in months" value={months} onChange={setMonths} step="1" hint="Banks usually offer 6 to 120 months" />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Maturity amount" value={formatInr(result.total)} tone="strong" />
            <Stat label="Interest earned" value={formatInr(result.interest)} tone="good" />
            <Stat label="Total deposited" value={formatInr(result.deposited)} />
            <Stat label="Interest as share of maturity" value={`${((result.interest / result.total) * 100).toFixed(1)}%`} />
          </StatGrid>
          <SplitBar title="Maturity: your deposits and interest" format={formatInr} parts={[
            { label: 'Deposited', value: result.deposited, className: 'bg-slate-400' },
            { label: 'Interest', value: result.interest, className: 'bg-emerald-500' },
          ]} />
          <SimpleTable caption="Growth over time" head={['Period', 'Deposited', 'Interest', 'Value']} rows={result.rows} />
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a monthly deposit and a period of 1 to 600 months.</p>}
      <Note>Interest is compounded quarterly, the usual method at Indian banks. Your bank may round differently or deduct TDS; check the RD terms.</Note>
      <CalcFooter />
    </section>
  );
};

export default RdCalculator;
