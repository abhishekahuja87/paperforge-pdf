import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SelectField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { gratuity } from '../../../lib/utilities/more';

export const GratuityCalculator: React.FC = () => {
  const [pay, setPay] = useState('50000');
  const [years, setYears] = useState('10');
  const [months, setMonths] = useState('7');
  const [covered, setCovered] = useState('yes');

  const result = useMemo(() => {
    const p = parseAmount(pay);
    const y = Math.floor(parseAmount(years));
    const m = Math.floor(parseAmount(months));
    if (p <= 0 || y < 0 || m < 0 || m > 11) return null;
    const isCovered = covered === 'yes';
    const eligible = y + m / 12 >= 5;
    const rows = [5, 10, 15, 20, 25, 30, 35].map((service) => [`${service} years`, formatInr(gratuity(p, service, 0, isCovered).amount)]);
    return { ...gratuity(p, y, m, isCovered), eligible, rows, p };
  }, [pay, years, months, covered]);

  const summary = result ? `Gratuity estimate on last pay ${formatInr(result.p)} after ${years} years ${months} months: ${formatInr(result.amount)}${result.taxable > 0 ? ` (${formatInr(result.taxable)} above the tax-free limit)` : ''}. mydailyutils.in` : '';

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Last drawn monthly basic + DA" prefix="₹" value={pay} onChange={setPay} words />
        <SelectField label="Employer covered by the Payment of Gratuity Act?" value={covered} onChange={setCovered} options={[
          { value: 'yes', label: 'Yes (10 or more employees, most employers)' }, { value: 'no', label: 'No' },
        ]} />
        <NumberField label="Years of service" value={years} onChange={setYears} step="1" />
        <NumberField label="Extra months (0 to 11)" value={months} onChange={setMonths} step="1" />
      </InputGrid>
      {result ? (
        <>
          {!result.eligible && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">Gratuity is normally payable only after 5 years of continuous service (exceptions include death or disability). The figure below is what the formula gives for your service.</p>}
          <StatGrid>
            <Stat label="Gratuity amount" value={formatInr(result.amount)} tone="strong" />
            <Stat label="Years counted" value={covered === 'yes' ? `${result.served}` : `${Math.floor(parseAmount(years))} (completed years)`} />
            <Stat label="Tax-free limit" value={formatInr(result.taxFreeLimit)} />
            <Stat label="Above the limit" value={formatInr(result.taxable)} tone={result.taxable > 0 ? 'good' : 'plain'} />
          </StatGrid>
          <SimpleTable caption="Gratuity at different lengths of service, same pay" head={['Service', 'Gratuity']} rows={result.rows} />
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter your last monthly basic plus DA and your length of service.</p>}
      <Note>Covered employers: pay × 15 ÷ 26 × years (a part-year of 6 months or more counts as a full year). Others: pay × 15 ÷ 30 × completed years. The ₹20 lakh limit is the tax-free ceiling for private-sector employees; confirm current rules and your employer&apos;s policy.</Note>
      <CalcFooter />
    </section>
  );
};

export default GratuityCalculator;
