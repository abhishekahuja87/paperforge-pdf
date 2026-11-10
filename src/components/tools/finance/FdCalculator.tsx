import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { afterTaxInterest, computeFd, TDS_LIMIT, type Compounding } from '../../../lib/finance/calculators';
import { formatInr, formatPercent, parseAmount } from '../../../lib/finance/format';

export const FdCalculator: React.FC = () => {
  const [amount, setAmount] = useState('500000');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('5');
  const [months, setMonths] = useState('0');
  const [compounding, setCompounding] = useState<Compounding>('quarterly');
  const [taxRate, setTaxRate] = useState('0');
  const [holder, setHolder] = useState<'regular' | 'senior'>('regular');

  const result = useMemo(() => {
    const principal = parseAmount(amount);
    const totalMonths = Math.round(parseAmount(years) * 12 + parseAmount(months));
    if (principal <= 0 || totalMonths <= 0) return null;
    return { ...computeFd(principal, parseAmount(rate), totalMonths, compounding), principal };
  }, [amount, rate, years, months, compounding]);

  const taxPercent = parseAmount(taxRate);
  const taxCase = useMemo(() => {
    if (!result || taxPercent <= 0) return null;
    const { tax, net } = afterTaxInterest(result.interest, taxPercent);
    const span = Math.max(1 / 12, Math.round(parseAmount(years) * 12 + parseAmount(months)) / 12);
    const netYield = ((1 + net / result.principal) ** (1 / span) - 1) * 100;
    return { tax, net, netYield };
  }, [result, taxPercent, years, months]);
  const yearlyInterest = result ? result.interest / Math.max(1, (Math.round(parseAmount(years) * 12 + parseAmount(months))) / 12) : 0;
  const tdsLimit = TDS_LIMIT[holder];
  const tdsLikely = Boolean(result) && yearlyInterest > tdsLimit;

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Deposit amount" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Years" value={years} onChange={setYears} />
        <NumberField label="Extra months" value={months} onChange={setMonths} />
        <SelectField label="Interest compounding" value={compounding} onChange={(value) => setCompounding(value as Compounding)} options={[
          { value: 'quarterly', label: 'Quarterly (most banks)' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'halfYearly', label: 'Half-yearly' },
          { value: 'yearly', label: 'Yearly' },
        ]} />
        <NumberField label="Your tax rate on interest (optional)" suffix="%" value={taxRate} onChange={setTaxRate} hint="Your slab rate, such as 5, 20 or 30. Leave 0 to ignore tax" />
        <SelectField label="Depositor" value={holder} onChange={(value) => setHolder(value === 'senior' ? 'senior' : 'regular')} options={[
          { value: 'regular', label: 'Below 60 years' },
          { value: 'senior', label: 'Senior citizen (60 or more)' },
        ]} />
      </InputGrid>
      {result ? (
        <>
        <StatGrid>
          <Stat label="Maturity amount" value={formatInr(result.maturity)} tone="strong" />
          <Stat label="Interest earned" value={formatInr(result.interest)} tone="good" />
          <Stat label="Amount deposited" value={formatInr(result.principal)} />
          <Stat label="Effective yearly yield" value={formatPercent(result.effectiveYield, 2)} />
          {taxCase && <Stat label="Tax on the interest" value={formatInr(taxCase.tax)} />}
          {taxCase && <Stat label="Interest after tax" value={formatInr(taxCase.net)} tone="good" />}
          {taxCase && <Stat label="Maturity after tax" value={formatInr(result.principal + taxCase.net)} tone="strong" />}
          {taxCase && <Stat label="Yearly yield after tax" value={formatPercent(taxCase.netYield, 2)} />}
        </StatGrid>
        {tdsLikely && (
          <p role="note" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            Interest of about {formatInr(yearlyInterest)} a year is above {formatInr(tdsLimit)}, the usual limit above which a bank deducts TDS (10 percent with PAN). TDS is not your final tax: it is adjusted when you file your return. Submit Form 15G or 15H only if your total income is below the taxable limit, and check your bank&apos;s rules.
          </p>
        )}
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a deposit amount and a period.</p>}
      <Note>Banks may compound differently, round interest, or pay it out instead of reinvesting it. Interest is taxable and TDS may apply above your bank&apos;s limit; check your FD terms.</Note>
      <CalcFooter />
    </section>
  );
};

export default FdCalculator;
