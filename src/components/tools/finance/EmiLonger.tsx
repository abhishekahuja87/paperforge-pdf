import React, { useMemo, useState } from 'react';
import { NumberField, SelectField, SimpleTable, Stat } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { durationText, longerLoan, longerOptions, monthLabel, yearlyRows, type Schedule } from '../../../lib/finance/emiSchedule';

interface Props { principal: number; annualRate: number; tenureMonths: number; startMonth: string }

const cell = (value: number | undefined) => (value === undefined ? '-' : formatInr(value));

/** Take a longer loan with a lower required EMI, but keep paying the EMI of the shorter loan. Compares it with the loan as entered. */
export const EmiLonger: React.FC<Props> = ({ principal, annualRate, tenureMonths, startMonth }) => {
  const options = useMemo(() => longerOptions(tenureMonths), [tenureMonths]);
  const [extra, setExtra] = useState('60');
  const [rateText, setRateText] = useState('');
  const [view, setView] = useState<'yearly' | 'monthly'>('yearly');

  const chosen = options.includes(Number(extra)) ? Number(extra) : options[options.length > 1 ? 1 : 0];
  const longRate = rateText.trim() === '' ? annualRate : parseAmount(rateText);
  const plan = useMemo(() => (chosen === undefined ? null : longerLoan(principal, annualRate, tenureMonths, chosen, longRate)), [principal, annualRate, tenureMonths, chosen, longRate]);
  const table = useMemo(() => options.map((months) => longerLoan(principal, annualRate, tenureMonths, months, longRate)), [options, principal, annualRate, tenureMonths, longRate]);
  if (!plan || options.length === 0) return null;

  const { original, keepPaying, onlyRequired } = plan;
  const lower = original.emi - plan.requiredEmi;
  const yearsOf = (schedule: Schedule) => new Map(yearlyRows(schedule.rows).map((row) => [row.year, row]));
  const rowsOf = (schedule: Schedule) => new Map(schedule.rows.map((row) => [row.month, row]));
  const orig = rowsOf(original);
  const keep = rowsOf(keepPaying);
  const low = rowsOf(onlyRequired);
  const origY = yearsOf(original);
  const keepY = yearsOf(keepPaying);
  const lowY = yearsOf(onlyRequired);
  const length = Math.max(original.months, keepPaying.months, onlyRequired.months);
  const yearCount = Math.ceil(length / 12);
  const head = [view === 'yearly' ? 'Year' : 'Month', 'As entered: interest', 'As entered: balance', 'Longer loan, your EMI: interest', 'Longer loan, your EMI: balance', 'Longer loan, required EMI only: balance'];
  const rows = view === 'yearly'
    ? Array.from({ length: yearCount }, (_, i) => i + 1).map((year) => [String(year), cell(origY.get(year)?.interest), cell(origY.get(year)?.balance ?? (year > Math.ceil(original.months / 12) ? 0 : undefined)), cell(keepY.get(year)?.interest), cell(keepY.get(year)?.balance ?? (year > Math.ceil(keepPaying.months / 12) ? 0 : undefined)), cell(lowY.get(year)?.balance ?? (year > Math.ceil(onlyRequired.months / 12) ? 0 : undefined))])
    : Array.from({ length }, (_, i) => i + 1).map((month) => [monthLabel(startMonth, month), cell(orig.get(month)?.interest), cell(orig.get(month)?.balance ?? (month > original.months ? 0 : undefined)), cell(keep.get(month)?.interest), cell(keep.get(month)?.balance ?? (month > keepPaying.months ? 0 : undefined)), cell(low.get(month)?.balance ?? (month > onlyRequired.months ? 0 : undefined))]);

  const sameRate = Math.abs(longRate - annualRate) < 0.0001;
  const interestDiff = keepPaying.totalInterest - original.totalInterest;

  return (
    <div className="mt-5">
      <h4 className="text-sm font-semibold text-slate-900">1. A longer loan, but keep paying your current EMI</h4>
      <p className="mt-1 text-xs text-slate-600">
        Ask for {durationText(plan.months)} instead of {durationText(tenureMonths)}. The lender then requires only {formatInr(plan.requiredEmi)} a month, {formatInr(lower)} less than the {formatInr(original.emi)} you would pay now.
        Suppose you keep paying {formatInr(original.emi)} anyway. {sameRate
          ? `At the same rate the loan then ends in ${durationText(keepPaying.months)} with the same interest as the shorter loan, so you lose nothing, and you get a lower required EMI to fall back on in a tight month.`
          : `At ${longRate}% on the longer loan the loan ends in ${durationText(keepPaying.months)} and the interest is ${formatInr(Math.abs(interestDiff))} ${interestDiff >= 0 ? 'more' : 'less'} than the loan as entered.`}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SelectField label="Take the loan for" value={String(chosen)} onChange={setExtra} options={options.map((months) => ({ value: String(months), label: `${durationText(tenureMonths + months)} (${durationText(months)} longer)` }))} />
        <NumberField label="Rate on the longer loan (leave empty for the same rate)" suffix="%" value={rateText} onChange={setRateText} hint="Some lenders charge a little more for a longer loan." />
      </div>

      {plan.usable ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Stat tone="good" label="Required EMI on the longer loan" value={`${formatInr(plan.requiredEmi)} (${formatInr(lower)} less)`} />
            <Stat label="You keep paying" value={formatInr(original.emi)} />
            <Stat tone="good" label="Loan ends in" value={`${durationText(keepPaying.months)} (${durationText(plan.months - keepPaying.months)} before the full term)`} />
            <Stat label="Total interest, you pay your EMI" value={`${formatInr(keepPaying.totalInterest)} (${interestDiff >= 0 ? '+' : '-'}${formatInr(Math.abs(interestDiff))} vs as entered)`} />
            <Stat label="Total interest, only the required EMI" value={`${formatInr(onlyRequired.totalInterest)} (+${formatInr(onlyRequired.totalInterest - original.totalInterest)} vs as entered)`} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">The last card shows what the safety net costs: every month you pay only the lower required EMI instead of your own EMI adds interest. A lower required EMI can also help you qualify, because lenders look at how much of your income goes to EMIs.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Choose the comparison table">
            {(['yearly', 'monthly'] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)} className={`min-h-10 rounded-lg border px-4 py-2 text-xs font-bold ${view === mode ? 'border-orange-700 bg-orange-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                {mode === 'yearly' ? 'Year-wise' : 'Month-wise'}
              </button>
            ))}
          </div>
          <SimpleTable caption="Loan as entered compared with a longer loan where you keep paying your current EMI" head={head} rows={rows} />
        </>
      ) : (
        <p role="status" className="mt-3 text-xs text-amber-800">At {longRate}% the longer loan would need an EMI of {formatInr(plan.requiredEmi)}, which is not lower than {formatInr(original.emi)}, so there is nothing to compare. Try a lower rate or a different tenure.</p>
      )}

      <SimpleTable
        caption="Longer loan terms, keeping your current EMI"
        head={['Loan taken for', 'Required EMI', 'Lower by', 'Ends in (paying your EMI)', 'Interest (your EMI)', 'Interest (required EMI only)']}
        rows={table.map((item) => [durationText(item.months), formatInr(item.requiredEmi), item.usable ? formatInr(original.emi - item.requiredEmi) : '-', item.usable ? durationText(item.keepPaying.months) : '-', item.usable ? formatInr(item.keepPaying.totalInterest) : '-', formatInr(item.onlyRequired.totalInterest)])}
      />
    </div>
  );
};

export default EmiLonger;
