import React from 'react';
import { Note } from '../../finance/ui';
import { formatInr } from '../../../lib/finance/format';
import { durationText, type Advice } from '../../../lib/finance/emiSchedule';

interface Variation { key: string; label: string; principal: number; interest: number; months: number; emi?: number; saved?: number; tone?: 'plain' | 'good' }

const Big: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-0.5 text-lg font-black tracking-tight text-slate-900">{value}</p>
  </div>
);

/** One way of taking the loan, shown as its main numbers only: the loan amount, the interest and the years. */
const VariationCard: React.FC<{ item: Variation }> = ({ item }) => (
  <li className={`rounded-xl border p-3 ${item.tone === 'good' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
    <p className="text-xs font-bold text-slate-800">{item.label}</p>
    <div className="mt-2 grid grid-cols-3 gap-2">
      <Big label="Loan amount" value={formatInr(item.principal)} />
      <Big label="Interest" value={formatInr(item.interest)} />
      <Big label="Years" value={durationText(item.months)} />
    </div>
    <p className="mt-2 text-[11px] text-slate-600">
      {item.emi !== undefined ? `EMI ${formatInr(item.emi)} a month` : ''}
      {item.emi !== undefined && item.saved !== undefined ? ' · ' : ''}
      {item.saved !== undefined ? (item.saved > 0 ? `Interest saved ${formatInr(item.saved)}` : 'As entered') : ''}
    </p>
  </li>
);

const Group: React.FC<{ title: string; items: Variation[] }> = ({ title, items }) => (
  items.length === 0 ? null : (
    <>
      <h4 className="mt-5 text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="mt-2 grid gap-3 sm:grid-cols-2">{items.map((item) => <VariationCard key={item.key} item={item} />)}</ul>
    </>
  )
);

/** "Ways to pay less interest", shown after the result the person asked for. Every option changes one thing from the loan above. */
export const EmiAdvice: React.FC<{ advice: Advice; tenureMonths: number; principal: number }> = ({ advice, tenureMonths, principal }) => {
  const { pick, tenures, extras, borrowLess, lowerRate, base } = advice;
  const shorter: Variation[] = tenures.filter((item) => item.months !== tenureMonths).map((item) => ({
    key: `t${item.months}`, label: `Pay it off in ${durationText(item.months)}`, principal, interest: item.totalInterest, months: item.months, emi: item.emi, saved: item.interestSaved, tone: pick && pick.months === item.months ? 'good' : 'plain',
  }));
  const extra: Variation[] = extras.map((item) => ({ key: item.label, label: item.label, principal, interest: item.totalInterest, months: item.months, saved: item.interestSaved }));
  const smaller: Variation[] = borrowLess.map((item) => ({ key: item.label, label: `Borrow ${item.label} (put in ${formatInr(item.upfront)} yourself)`, principal: item.principal, interest: item.totalInterest, months: tenureMonths, emi: item.emi, saved: item.interestSaved }));
  const cheaper: Variation[] = lowerRate.map((item) => ({ key: item.label, label: `Rate ${item.rate.toFixed(2)}% (${item.label})`, principal, interest: item.totalInterest, months: tenureMonths, emi: item.emi, saved: item.interestSaved }));
  return (
    <section className="mt-8" aria-labelledby="emi-advice">
      <h3 id="emi-advice" className="text-base font-bold text-slate-900">Ways to pay less interest</h3>
      <p className="mt-1 text-xs text-slate-600">Each card changes one thing from your loan and shows the main numbers: the loan amount, the interest you pay and the years it takes. The green card is the shortest loan whose EMI is no more than 20% above today's. Pick what your monthly budget can carry.</p>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        <VariationCard item={{ key: 'base', label: 'Your loan as entered', principal, interest: base.totalInterest, months: tenureMonths, emi: base.emi, saved: 0 }} />
      </ul>

      <Group title="Same amount, shorter time" items={shorter} />
      <Group title="Same loan, a little extra each month or year" items={extra} />
      <Group title="Borrow less (a bigger down payment)" items={smaller} />
      <Group title="A lower interest rate" items={cheaper} />
      {cheaper.length > 0 && <p className="mt-1 text-[11px] text-slate-500">Banks and NBFCs differ, so compare offers, ask your lender for a rate cut, or check the cost of moving the loan to another lender.</p>}

      <Note>Check before you prepay: some loans, such as fixed-rate or business loans, charge a prepayment fee, and your lender may handle part payments differently from this estimate. Keep an emergency fund and do not empty your savings to prepay. Interest saved on a home loan can reduce the tax benefit you claim, and if you can earn more on an investment than your loan costs, prepaying is not always the best use of money. These are estimates for planning, not advice.</Note>
    </section>
  );
};

export default EmiAdvice;
