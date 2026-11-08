import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SelectField, SimpleTable, SplitBar, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { compoundInterest, simpleInterest } from '../../../lib/utilities/interest';

export const SimpleCompoundInterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('8');
  const [years, setYears] = useState('3');
  const [perYear, setPerYear] = useState('4');

  const result = useMemo(() => {
    const p = parseAmount(principal);
    const r = parseAmount(rate);
    const t = parseAmount(years);
    if (p <= 0 || t <= 0) return null;
    const n = Number(perYear);
    const rows: string[][] = [];
    for (let year = 1; year <= Math.min(Math.ceil(t), 50); year += 1) {
      const at = Math.min(year, t);
      rows.push([String(year), formatInr(simpleInterest(p, r, at).total), formatInr(compoundInterest(p, r, at, n).total)]);
    }
    return { simple: simpleInterest(p, r, t), compound: compoundInterest(p, r, t, n), p, rows };
  }, [principal, rate, years, perYear]);

  const summary = result
    ? `Principal ${formatInr(result.p)} at ${rate}% for ${years} years. Simple interest: ${formatInr(result.simple.interest)} (total ${formatInr(result.simple.total)}). Compound interest (${perYear} times a year): ${formatInr(result.compound.interest)} (total ${formatInr(result.compound.total)}). mydailyutils.in`
    : '';

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Principal amount" prefix="₹" value={principal} onChange={setPrincipal} words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Time in years" value={years} onChange={setYears} hint="Use decimals for part years, e.g. 2.5" />
        <SelectField label="Compounding (for compound interest)" value={perYear} onChange={setPerYear} options={[
          { value: '1', label: 'Yearly' }, { value: '2', label: 'Half-yearly' }, { value: '4', label: 'Quarterly' }, { value: '12', label: 'Monthly' }, { value: '365', label: 'Daily' },
        ]} />
      </InputGrid>
      {result ? (
        <>
          <h2 className="mt-5 text-sm font-bold text-slate-900">Simple interest</h2>
          <StatGrid>
            <Stat label="Interest" value={formatInr(result.simple.interest)} tone="good" />
            <Stat label="Total amount" value={formatInr(result.simple.total)} tone="strong" />
          </StatGrid>
          <h2 className="mt-5 text-sm font-bold text-slate-900">Compound interest</h2>
          <StatGrid>
            <Stat label="Interest" value={formatInr(result.compound.interest)} tone="good" />
            <Stat label="Total amount" value={formatInr(result.compound.total)} tone="strong" />
          </StatGrid>
          <p className="mt-3 text-xs text-slate-600">Compounding earns {formatInr(result.compound.interest - result.simple.interest)} more than simple interest over the same period.</p>
          <SplitBar title="Compound total: principal and interest" format={formatInr} parts={[
            { label: 'Principal', value: result.p, className: 'bg-slate-400' },
            { label: 'Interest', value: result.compound.interest, className: 'bg-emerald-500' },
          ]} />
          <SimpleTable caption="Year-wise totals" head={['Year', 'Simple total', 'Compound total']} rows={result.rows} />
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a principal and a period.</p>}
      <Note>Simple interest: P × R × T ÷ 100. Compound interest: P × (1 + R ÷ (100 × n))^(n × T). Banks may use day counts or rounding that differ slightly.</Note>
      <CalcFooter />
    </section>
  );
};

export default SimpleCompoundInterestCalculator;
