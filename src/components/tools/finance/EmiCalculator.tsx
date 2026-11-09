import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, NumberField, SelectField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { fieldClass } from '../utilities/common';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { NO_EXTRAS, adviseLoan, buildSchedule, durationText, hasExtras, monthLabel, parseExtras, yearlyRows, type ExtraInputs } from '../../../lib/finance/emiSchedule';
import EmiExtraPayments from './EmiExtraPayments';
import EmiAdvice from './EmiAdvice';

const noExtraInputs = (): ExtraInputs => ({ every: '', amount: '', start: '1', rows: [] });

export const EmiCalculator: React.FC = () => {
  const [amount, setAmount] = useState('2500000');
  const [rate, setRate] = useState('8.5');
  const [tenure, setTenure] = useState('20');
  const [unit, setUnit] = useState('years');
  const [extraInputs, setExtraInputs] = useState<ExtraInputs>(noExtraInputs);
  const [view, setView] = useState<'yearly' | 'monthly'>('yearly');
  const [startMonth, setStartMonth] = useState('');

  const principal = parseAmount(amount);
  const annualRate = parseAmount(rate);
  const months = Math.round(parseAmount(tenure) * (unit === 'years' ? 12 : 1));
  const valid = principal > 0 && months > 0 && months <= 1200;
  const extras = useMemo(() => parseExtras(extraInputs), [extraInputs]);

  const plain = useMemo(() => (valid ? buildSchedule(principal, annualRate, months, NO_EXTRAS) : null), [valid, principal, annualRate, months]);
  const result = useMemo(() => (valid ? buildSchedule(principal, annualRate, months, extras) : null), [valid, principal, annualRate, months, extras]);
  const advice = useMemo(() => (valid && annualRate > 0 ? adviseLoan(principal, annualRate, months) : null), [valid, principal, annualRate, months]);
  const lateRows = result ? extras.oneTime.filter((item) => item.month > result.months) : [];
  const extraOn = hasExtras(extras);

  const monthlyHead = extraOn ? ['Month', 'EMI', 'Principal', 'Interest', 'Extra payment', 'Balance'] : ['Month', 'EMI', 'Principal', 'Interest', 'Balance'];

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Loan amount" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Loan tenure" value={tenure} onChange={setTenure} />
        <SelectField label="Tenure in" value={unit} onChange={setUnit} options={[{ value: 'years', label: 'Years' }, { value: 'months', label: 'Months' }]} />
        <label className="block text-xs font-semibold text-slate-700">
          Month of the first EMI (optional)
          <input type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} className={fieldClass} />
          <span className="mt-1 block font-normal text-slate-500">Adds real month names to the monthly table.</span>
        </label>
      </InputGrid>
      {months > 1200 && <p role="alert" className="mt-2 text-xs text-rose-800">Choose a tenure of 100 years or less.</p>}
      {valid && <EmiExtraPayments value={extraInputs} onChange={setExtraInputs} tenureMonths={months} />}
      {lateRows.length > 0 && <p role="status" className="mt-2 text-xs text-amber-800">{lateRows.length === 1 ? 'One extra payment is' : `${lateRows.length} extra payments are`} planned after the loan has already ended (month {lateRows.map((item) => item.month).join(', ')}), so {lateRows.length === 1 ? 'it is' : 'they are'} not counted.</p>}

      {result && plain ? (
        <>
          <StatGrid>
            <Stat label="Monthly EMI" value={formatInr(result.emi)} tone="strong" />
            <Stat label="Total interest" value={formatInr(result.totalInterest)} />
            <Stat label="Total payment" value={formatInr(result.totalPaid)} />
            <Stat label="Interest as share of payment" value={`${((result.totalInterest / result.totalPaid) * 100).toFixed(1)}%`} />
            {extraOn && <Stat tone="good" label="Loan ends in" value={`${durationText(result.months)} (${durationText(plain.months - result.months)} earlier)`} />}
            {extraOn && <Stat tone="good" label="Interest saved by extra payments" value={formatInr(plain.totalInterest - result.totalInterest)} />}
            {extraOn && <Stat label="Extra money you pay in" value={formatInr(result.totalExtra)} />}
          </StatGrid>

          <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Choose the repayment table">
            {(['yearly', 'monthly'] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)} className={`min-h-10 rounded-lg border px-4 py-2 text-xs font-bold ${view === mode ? 'border-orange-700 bg-orange-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                {mode === 'yearly' ? 'Year-wise' : 'Month-wise'}
              </button>
            ))}
          </div>
          {view === 'yearly' ? (
            <SimpleTable
              caption="Year-wise loan repayment"
              head={extraOn ? ['Year', 'Principal paid', 'Interest paid', 'Of which extra', 'Balance'] : ['Year', 'Principal paid', 'Interest paid', 'Balance']}
              rows={yearlyRows(result.rows).map((row) => (extraOn
                ? [String(row.year), formatInr(row.principal), formatInr(row.interest), formatInr(row.extra), formatInr(row.balance)]
                : [String(row.year), formatInr(row.principal), formatInr(row.interest), formatInr(row.balance)]))}
            />
          ) : (
            <SimpleTable
              caption="Month-wise loan repayment"
              head={monthlyHead}
              rows={result.rows.map((row) => (extraOn
                ? [monthLabel(startMonth, row.month), formatInr(row.emi), formatInr(row.principal), formatInr(row.interest), row.extra > 0 ? formatInr(row.extra) : '-', formatInr(row.balance)]
                : [monthLabel(startMonth, row.month), formatInr(row.emi), formatInr(row.principal), formatInr(row.interest), formatInr(row.balance)]))}
            />
          )}
          {advice && <EmiAdvice advice={advice} tenureMonths={months} />}
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a loan amount and tenure to see the EMI.</p>}
      <CalcFooter />
    </section>
  );
};

export default EmiCalculator;
