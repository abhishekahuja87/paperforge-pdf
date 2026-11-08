import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeTax } from '../../../lib/finance/tax';
import { formatInr, parseAmount } from '../../../lib/finance/format';

const PF_WAGE_CEILING = 15000;

export const SalaryCalculator: React.FC = () => {
  const [ctc, setCtc] = useState('1200000');
  const [basicPercent, setBasicPercent] = useState('40');
  const [pfCeiling, setPfCeiling] = useState('capped');
  const [regime, setRegime] = useState('new');
  const [professionalTax, setProfessionalTax] = useState('2400');

  const result = useMemo(() => {
    const annualCtc = parseAmount(ctc);
    if (annualCtc <= 0) return null;
    const basicYear = (annualCtc * Math.min(100, parseAmount(basicPercent))) / 100;
    const pfWageYear = pfCeiling === 'capped' ? Math.min(basicYear, PF_WAGE_CEILING * 12) : basicYear;
    const pf = pfWageYear * 0.12;
    // Employer PF is part of CTC but is not paid out, so gross salary excludes it.
    const gross = Math.max(0, annualCtc - pf);
    const pt = parseAmount(professionalTax);
    const tax = computeTax({
      regime: regime === 'old' ? 'old' : 'new',
      age: 'below60',
      salary: gross,
      otherIncome: 0,
      employerNps: 0,
      section80C: pf,
      nps80CCD1B: 0,
      section80D: 0,
      homeLoanInterest: 0,
      hraExemption: 0,
      otherDeductions: regime === 'old' ? pt : 0,
    });
    const inHandYear = gross - pf - pt - tax.totalTax;
    return { annualCtc, basicYear, pf, gross, pt, tax: tax.totalTax, inHandYear };
  }, [ctc, basicPercent, pfCeiling, regime, professionalTax]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Annual CTC" prefix="₹" value={ctc} onChange={setCtc} words />
        <NumberField label="Basic salary as % of CTC" suffix="%" value={basicPercent} onChange={setBasicPercent} hint="Usually 40–50%" />
        <SelectField label="PF contribution" value={pfCeiling} onChange={setPfCeiling} options={[
          { value: 'capped', label: '12% of basic, capped at ₹15,000 wage' },
          { value: 'full', label: '12% of full basic' },
        ]} />
        <SelectField label="Tax regime" value={regime} onChange={setRegime} options={[
          { value: 'new', label: 'New regime' },
          { value: 'old', label: 'Old regime (PF as 80C only)' },
        ]} />
        <NumberField label="Professional tax per year" prefix="₹" value={professionalTax} onChange={setProfessionalTax} hint="Varies by state" />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Monthly in-hand salary" value={formatInr(result.inHandYear / 12)} tone="strong" />
            <Stat label="Yearly in-hand salary" value={formatInr(result.inHandYear)} tone="good" />
            <Stat label="Income tax per month" value={formatInr(result.tax / 12)} />
            <Stat label="Employee PF per month" value={formatInr(result.pf / 12)} />
          </StatGrid>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-800">How the CTC is split (per year)</p>
            <ul className="mt-2 space-y-1">
              <li>CTC: {formatInr(result.annualCtc)}</li>
              <li>Employer PF (inside CTC, not paid out): − {formatInr(result.pf)}</li>
              <li>Gross salary: {formatInr(result.gross)}</li>
              <li>Employee PF: − {formatInr(result.pf)} · Professional tax: − {formatInr(result.pt)} · Income tax: − {formatInr(result.tax)}</li>
            </ul>
          </div>
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter your annual CTC.</p>}
      <Note>Assumes all of CTC other than employer PF is paid out as fixed salary. Variable pay, bonus, gratuity, insurance premiums and employer NPS are not modelled, so your payslip may differ. Tax is an estimate for FY 2026-27; see the Income Tax Calculator for the full picture.</Note>
      <CalcFooter />
    </section>
  );
};

export default SalaryCalculator;
