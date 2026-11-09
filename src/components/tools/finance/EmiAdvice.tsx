import React from 'react';
import { Note, SimpleTable, Stat } from '../../finance/ui';
import { formatInr } from '../../../lib/finance/format';
import { durationText, type Advice } from '../../../lib/finance/emiSchedule';

const plus = (value: number) => (value > 0 ? `+${formatInr(value)}` : formatInr(value));

/** "Ways to pay less interest", shown after the result the person asked for. Every option changes one thing from the loan above. */
export const EmiAdvice: React.FC<{ advice: Advice; tenureMonths: number }> = ({ advice, tenureMonths }) => {
  const { pick, tenures, extras, borrowLess, lowerRate, base } = advice;
  return (
    <section className="mt-8" aria-labelledby="emi-advice">
      <h3 id="emi-advice" className="text-base font-bold text-slate-900">Ways to pay less interest</h3>
      <p className="mt-1 text-xs text-slate-600">Your loan as entered costs {formatInr(base.totalInterest)} in interest over {durationText(tenureMonths)}. Each table below changes one thing and shows what you would save. Pick what your monthly budget can carry.</p>

      {pick && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat tone="good" label={`A shorter loan: ${durationText(pick.months)}`} value={`${formatInr(pick.emi)} a month`} />
          <Stat tone="good" label="Extra each month" value={plus(pick.extraPerMonth)} />
          <Stat tone="good" label="Interest saved" value={formatInr(pick.interestSaved)} />
        </div>
      )}
      {pick && <p className="mt-2 text-[11px] text-slate-500">This is the shortest loan whose EMI is no more than 20% above today's. It is a starting point, not a recommendation: only choose it if the higher EMI is comfortable every month.</p>}

      <h4 className="mt-5 text-sm font-semibold text-slate-900">1. Same amount, shorter time</h4>
      <SimpleTable
        caption="Same loan amount with a shorter tenure"
        head={['Tenure', 'EMI', 'Extra a month', 'Total interest', 'Interest saved']}
        rows={tenures.map((item) => [durationText(item.months), formatInr(item.emi), item.months === tenureMonths ? '-' : plus(item.extraPerMonth), formatInr(item.totalInterest), item.months === tenureMonths ? 'As entered' : formatInr(item.interestSaved)])}
      />

      <h4 className="mt-5 text-sm font-semibold text-slate-900">2. Same loan, a little extra each month or year</h4>
      <SimpleTable
        caption="Effect of small extra payments"
        head={['Extra payment', 'Loan ends in', 'Time saved', 'Interest saved']}
        rows={extras.map((item) => [item.label, durationText(item.months), durationText(item.monthsSaved), formatInr(item.interestSaved)])}
      />

      <h4 className="mt-5 text-sm font-semibold text-slate-900">3. Borrow less (a bigger down payment)</h4>
      <SimpleTable
        caption="Smaller loan amounts for the same tenure"
        head={['Loan', 'Amount', 'EMI', 'Interest saved', 'Extra from your pocket']}
        rows={borrowLess.map((item) => [item.label, formatInr(item.principal), formatInr(item.emi), formatInr(item.interestSaved), formatInr(item.upfront)])}
      />

      {lowerRate.length > 0 && (
        <>
          <h4 className="mt-5 text-sm font-semibold text-slate-900">4. A lower interest rate</h4>
          <SimpleTable
            caption="Effect of a lower interest rate"
            head={['Rate', 'EMI', 'Interest saved']}
            rows={lowerRate.map((item) => [`${item.rate.toFixed(2)}% (${item.label})`, formatInr(item.emi), formatInr(item.interestSaved)])}
          />
          <p className="mt-1 text-[11px] text-slate-500">Banks and NBFCs differ, so compare offers, ask your lender for a rate cut, or check the cost of moving the loan to another lender.</p>
        </>
      )}

      <Note>Check before you prepay: some loans, such as fixed-rate or business loans, charge a prepayment fee, and your lender may handle part payments differently from this estimate. Keep an emergency fund and do not empty your savings to prepay. Interest saved on a home loan can reduce the tax benefit you claim, and if you can earn more on an investment than your loan costs, prepaying is not always the best use of money. These are estimates for planning, not advice.</Note>
    </section>
  );
};

export default EmiAdvice;
