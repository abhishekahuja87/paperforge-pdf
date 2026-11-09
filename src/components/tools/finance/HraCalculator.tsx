import { useShared } from '../../../lib/shareState';
import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeHra } from '../../../lib/finance/calculators';
import { formatInr, parseAmount } from '../../../lib/finance/format';

export const HraCalculator: React.FC = () => {
  const [basic, setBasic] = useState('50000');
  const [hra, setHra] = useState('25000');
  const [rent, setRent] = useState('22000');
  const [metro, setMetro] = useState(true);
  useShared('Metro city', metro ? '1' : '0', (text) => setMetro(text === '1'), (text) => text === '0' || text === '1');

  const result = useMemo(() => computeHra({ monthlyBasic: parseAmount(basic), monthlyHra: parseAmount(hra), monthlyRent: parseAmount(rent), metro }), [basic, hra, rent, metro]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Basic salary (including DA), per month" prefix="₹" value={basic} onChange={setBasic} words />
        <NumberField label="HRA received, per month" prefix="₹" value={hra} onChange={setHra} words />
        <NumberField label="Rent paid, per month" prefix="₹" value={rent} onChange={setRent} words />
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={metro} onChange={(event) => setMetro(event.target.checked)} className="h-4 w-4 accent-orange-600" />
          I live in a metro city (50% of basic)
        </label>
      </InputGrid>
      <StatGrid>
        <Stat label="HRA exempt from tax (per year)" value={formatInr(result.yearlyExempt)} tone="good" />
        <Stat label="HRA taxable (per year)" value={formatInr(result.yearlyTaxable)} tone="strong" />
        <Stat label="Exempt per month" value={formatInr(result.monthly.exempt)} />
        <Stat label="Taxable per month" value={formatInr(result.monthly.taxable)} />
      </StatGrid>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
        <p className="font-semibold text-slate-800">The exemption is the least of these three (per month)</p>
        <ul className="mt-2 space-y-1">
          <li>Actual HRA received: {formatInr(result.monthly.actual)}</li>
          <li>Rent paid minus 10% of basic: {formatInr(result.monthly.rentOverTenPercent)}</li>
          <li>{metro ? '50%' : '40%'} of basic: {formatInr(result.monthly.basicShare)}</li>
        </ul>
      </div>
      <Note>HRA exemption is available only in the old tax regime, and only if you actually pay rent. Which cities count as metro is set by the tax rules, so confirm yours. Rent above ₹1 lakh a year generally needs your landlord&apos;s PAN. Use the yearly exempt amount in the Income Tax Calculator&apos;s HRA field.</Note>
      <CalcFooter />
    </section>
  );
};

export default HraCalculator;
