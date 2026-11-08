import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, calcCard } from '../../finance/ui';
import { computeTax, OLD_LIMITS, type AgeGroup, type TaxInput, type TaxResult } from '../../../lib/finance/tax';
import { formatInr, formatPercent, parseAmount } from '../../../lib/finance/format';

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <tr className={strong ? 'font-bold text-slate-900' : 'text-slate-700'}>
    <th scope="row" className="px-3 py-1.5 text-left font-normal">{label}</th>
    <td className="px-3 py-1.5 text-right tabular-nums">{value}</td>
  </tr>
);

const RegimeTable: React.FC<{ title: string; result: TaxResult; best: boolean }> = ({ title, result, best }) => (
  <div className={`rounded-xl border p-3 ${best ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
    <h3 className="flex items-center justify-between text-sm font-bold text-slate-900">
      {title}
      {best && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Lower tax</span>}
    </h3>
    <table className="mt-2 w-full text-xs">
      <caption className="sr-only">{title} calculation</caption>
      <tbody className="divide-y divide-slate-100">
        <Row label="Total income" value={formatInr(result.grossIncome)} />
        <Row label="Deductions" value={`− ${formatInr(result.totalDeductions)}`} />
        <Row label="Taxable income" value={formatInr(result.taxableIncome)} />
        <Row label="Tax on slabs" value={formatInr(result.slabTax)} />
        {result.rebate > 0 && <Row label="Rebate / relief" value={`− ${formatInr(result.rebate)}`} />}
        {result.surcharge > 0 && <Row label="Surcharge" value={formatInr(result.surcharge)} />}
        <Row label="Health & education cess (4%)" value={formatInr(result.cess)} />
        <Row label="Total tax" value={formatInr(result.totalTax)} strong />
        <Row label="Effective rate" value={formatPercent(result.effectiveRate, 2)} />
      </tbody>
    </table>
  </div>
);

export const IncomeTaxCalculator: React.FC = () => {
  const [salary, setSalary] = useState('1500000');
  const [other, setOther] = useState('0');
  const [age, setAge] = useState<AgeGroup>('below60');
  const [employerNps, setEmployerNps] = useState('0');
  const [c80, setC80] = useState('150000');
  const [nps, setNps] = useState('0');
  const [d80, setD80] = useState('0');
  const [home, setHome] = useState('0');
  const [hra, setHra] = useState('0');
  const [otherDed, setOtherDed] = useState('0');

  const { oldResult, newResult } = useMemo(() => {
    const base: TaxInput = {
      regime: 'new',
      age,
      salary: parseAmount(salary),
      otherIncome: parseAmount(other),
      employerNps: parseAmount(employerNps),
      section80C: parseAmount(c80),
      nps80CCD1B: parseAmount(nps),
      section80D: parseAmount(d80),
      homeLoanInterest: parseAmount(home),
      hraExemption: parseAmount(hra),
      otherDeductions: parseAmount(otherDed),
    };
    return { newResult: computeTax(base), oldResult: computeTax({ ...base, regime: 'old' }) };
  }, [salary, other, age, employerNps, c80, nps, d80, home, hra, otherDed]);

  const hasIncome = parseAmount(salary) + parseAmount(other) > 0;
  const saving = Math.abs(oldResult.totalTax - newResult.totalTax);
  const newBetter = newResult.totalTax <= oldResult.totalTax;

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Gross salary per year" prefix="₹" value={salary} onChange={setSalary} words />
        <NumberField label="Other income per year" prefix="₹" value={other} onChange={setOther} hint="Interest, rent, etc." words />
        <SelectField label="Age" value={age} onChange={(value) => setAge(value as AgeGroup)} options={[
          { value: 'below60', label: 'Below 60 years' },
          { value: 'senior', label: '60 to 79 years' },
          { value: 'superSenior', label: '80 years or more' },
        ]} />
        <NumberField label="Employer NPS contribution" prefix="₹" value={employerNps} onChange={setEmployerNps} hint="Allowed in both regimes" />
      </InputGrid>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Old regime deductions (optional)</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField label="Section 80C (PF, ELSS, PPF, LIC…)" prefix="₹" value={c80} onChange={setC80} hint={`Up to ${formatInr(OLD_LIMITS.section80C)}`} />
          <NumberField label="NPS extra (80CCD(1B))" prefix="₹" value={nps} onChange={setNps} hint={`Up to ${formatInr(OLD_LIMITS.nps80CCD1B)}`} />
          <NumberField label="Health insurance (80D)" prefix="₹" value={d80} onChange={setD80} hint="Enter the total you are eligible for" />
          <NumberField label="Home loan interest" prefix="₹" value={home} onChange={setHome} hint={`Up to ${formatInr(OLD_LIMITS.homeLoanInterest)}, self-occupied`} />
          <NumberField label="HRA exemption per year" prefix="₹" value={hra} onChange={setHra} hint="Use the HRA Calculator" />
          <NumberField label="Other deductions" prefix="₹" value={otherDed} onChange={setOtherDed} hint="80G, 80E, 80TTA, etc." />
        </div>
      </details>

      {hasIncome ? (
        <div aria-live="polite" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={newBetter ? 'Better: new regime' : 'Better: old regime'} value={formatInr(Math.min(oldResult.totalTax, newResult.totalTax))} tone="strong" />
            <Stat label="You save" value={formatInr(saving)} tone="good" />
            <Stat label="Monthly tax (better option)" value={formatInr(Math.min(oldResult.totalTax, newResult.totalTax) / 12)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RegimeTable title="New tax regime" result={newResult} best={newBetter} />
            <RegimeTable title="Old tax regime" result={oldResult} best={!newBetter} />
          </div>
        </div>
      ) : <p className="mt-4 text-xs text-slate-500">Enter your income to compare the two regimes.</p>}

      <Note>Indicative figures for a resident individual for FY 2026-27 (AY 2027-28), covering salary and other income taxed at slab rates. Capital gains, business income, TDS already paid and non-resident rules are not included. Check current rules on incometax.gov.in or with a tax professional before filing.</Note>
      <CalcFooter />
    </section>
  );
};

export default IncomeTaxCalculator;
