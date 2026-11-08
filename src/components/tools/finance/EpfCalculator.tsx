import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SimpleTable, SplitBar, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { projectEpf } from '../../../lib/utilities/dev';

export const EpfCalculator: React.FC = () => {
  const [wage, setWage] = useState('30000');
  const [balance, setBalance] = useState('0');
  const [age, setAge] = useState('30');
  const [retire, setRetire] = useState('58');
  const [raise, setRaise] = useState('5');
  const [rate, setRate] = useState('8.25');

  const result = useMemo(() => {
    const w = parseAmount(wage);
    const years = Math.floor(parseAmount(retire) - parseAmount(age));
    if (w <= 0 || years < 1 || years > 50) return null;
    const projection = projectEpf({ monthlyWage: w, currentBalance: parseAmount(balance), years, yearlyRaisePercent: parseAmount(raise), ratePercent: parseAmount(rate) });
    return { ...projection, years, opening: parseAmount(balance), rows: projection.rows.map((row) => [String(row.year), formatInr(row.monthlyWage), formatInr(row.contributed), formatInr(row.interest), formatInr(row.balance)]) };
  }, [wage, balance, age, retire, raise, rate]);

  const summary = result ? `EPF projection: ${result.years} years at ${rate}% grows to about ${formatInr(result.balance)} (employee ${formatInr(result.totalEmployee)}, employer ${formatInr(result.totalEmployer)}, interest ${formatInr(result.totalInterest)}). mydailyutils.in` : '';

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Monthly basic + DA" prefix="₹" value={wage} onChange={setWage} words />
        <NumberField label="Current EPF balance" prefix="₹" value={balance} onChange={setBalance} words />
        <NumberField label="Your age now" value={age} onChange={setAge} step="1" />
        <NumberField label="Retirement age" value={retire} onChange={setRetire} step="1" hint="EPF is usually withdrawable fully at 58" />
        <NumberField label="Expected yearly pay rise" suffix="%" value={raise} onChange={setRaise} />
        <NumberField label="EPF interest rate (per year)" suffix="%" value={rate} onChange={setRate} hint="Declared each year by the government; check the latest" />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Estimated balance at retirement" value={formatInr(result.balance)} tone="strong" />
            <Stat label="Years of contribution" value={String(result.years)} />
            <Stat label="Your contributions" value={formatInr(result.totalEmployee)} />
            <Stat label="Employer contributions to EPF" value={formatInr(result.totalEmployer)} />
            <Stat label="Interest earned" value={formatInr(result.totalInterest)} tone="good" />
          </StatGrid>
          <SplitBar title="Where the balance comes from" format={formatInr} parts={[
            { label: 'Opening balance', value: result.opening, className: 'bg-slate-400' },
            { label: 'Your contributions', value: result.totalEmployee, className: 'bg-sky-500' },
            { label: 'Employer contributions', value: result.totalEmployer, className: 'bg-indigo-500' },
            { label: 'Interest', value: result.totalInterest, className: 'bg-emerald-500' },
          ]} />
          <SimpleTable caption="Year-wise EPF projection" head={['Year', 'Monthly wage', 'Contributed', 'Interest', 'Balance']} rows={result.rows} />
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a monthly wage and an age and retirement age at least one year apart (up to 50 years).</p>}
      <Note>Assumes you contribute 12% of basic plus DA, and your employer&apos;s 12% is split between EPS (8.33% of wage, capped at a ₹15,000 wage) and EPF. Interest is worked out monthly on the running balance and credited once a year. The rate, the wage cap and tax on interest change over time, and your employer may contribute differently, so treat this as an estimate and check your passbook.</Note>
      <CalcFooter />
    </section>
  );
};

export default EpfCalculator;
