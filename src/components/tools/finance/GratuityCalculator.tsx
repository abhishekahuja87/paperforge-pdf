import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
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
    if (p <= 0 || y < 0 || m < 0 || m > 11 || y + m / 12 < 5) return null;
    return gratuity(p, y, m, covered === 'yes');
  }, [pay, years, months, covered]);

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
          <StatGrid>
            <Stat label="Gratuity amount" value={formatInr(result.amount)} tone="strong" />
            <Stat label="Years counted" value={covered === 'yes' ? `${result.served}` : `${Math.floor(parseAmount(years))} (completed years)`} />
            <Stat label="Tax-free limit" value={formatInr(result.taxFreeLimit)} />
            <Stat label="Above the limit" value={formatInr(result.taxable)} tone={result.taxable > 0 ? 'good' : 'plain'} />
          </StatGrid>
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Gratuity is normally payable after 5 years of service. Enter pay and at least 5 years.</p>}
      <Note>Covered employers: pay × 15 ÷ 26 × years (a part-year of 6 months or more counts as a full year). Others: pay × 15 ÷ 30 × completed years. The ₹20 lakh limit is the tax-free ceiling for private-sector employees; confirm current rules and your employer&apos;s policy.</Note>
      <CalcFooter />
    </section>
  );
};

export default GratuityCalculator;
