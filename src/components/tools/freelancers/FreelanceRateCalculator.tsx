import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SelectField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { CURRENCIES, formatMoney } from '../../../lib/freelancers/currency';
import { computeRate, incomeAtRate, projectPrice, type RateInput } from '../../../lib/freelancers/rate';

export const FreelanceRateCalculator: React.FC = () => {
  const [currency, setCurrency] = useState('USD');
  const [income, setIncome] = useState('60000');
  const [overhead, setOverhead] = useState('6000');
  const [benefits, setBenefits] = useState('4000');
  const [tax, setTax] = useState('25');
  const [weeksOff, setWeeksOff] = useState('6');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [billable, setBillable] = useState('60');
  const [buffer, setBuffer] = useState('10');
  const [myRate, setMyRate] = useState('');
  const [projectHours, setProjectHours] = useState('20');
  const [cushion, setCushion] = useState('15');

  const input: RateInput = useMemo(() => ({
    targetIncome: Number(income), overhead: Number(overhead), benefits: Number(benefits), taxPercent: Number(tax), weeksOff: Number(weeksOff),
    daysPerWeek: Number(daysPerWeek), hoursPerWeek: Number(hoursPerWeek), billablePercent: Number(billable), bufferPercent: Number(buffer),
  }), [income, overhead, benefits, tax, weeksOff, daysPerWeek, hoursPerWeek, billable, buffer]);
  const result = useMemo(() => computeRate(input), [input]);
  const money = (value: number, digits = 0) => formatMoney(value, currency, digits);
  const current = myRate.trim() === '' ? null : incomeAtRate(Number(myRate), input);
  const project = result ? projectPrice(Number(projectHours), result.hourly, Number(cushion)) : null;
  const summary = result ? `To take home ${money(Number(income))} a year you need ${money(result.hourly, 2)} per hour, ${money(result.daily)} per day, or ${money(result.monthly)} per month (${Math.round(result.billableHours)} billable hours a year).` : '';

  return (
    <section className={calcCard}>
      <InputGrid>
        <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCIES.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))} />
        <NumberField label="Take-home income you want per year" value={income} onChange={setIncome} hint="After tax" />
        <NumberField label="Business costs per year" value={overhead} onChange={setOverhead} hint="Software, equipment, insurance, accountant, co-working" />
        <NumberField label="Benefits you pay for yourself per year" value={benefits} onChange={setBenefits} hint="Health cover, retirement saving, training" />
        <NumberField label="Tax to set aside" value={tax} onChange={setTax} suffix="%" hint="Share of revenue; ask an accountant for your figure" />
        <NumberField label="Weeks off per year" value={weeksOff} onChange={setWeeksOff} hint="Holidays, public holidays, sick days" />
        <NumberField label="Working days per week" value={daysPerWeek} onChange={setDaysPerWeek} />
        <NumberField label="Working hours per week" value={hoursPerWeek} onChange={setHoursPerWeek} />
        <NumberField label="Share of hours you can bill" value={billable} onChange={setBillable} suffix="%" hint="The rest is admin, sales and learning. 50 to 70 is typical" />
        <NumberField label="Buffer for slow months and growth" value={buffer} onChange={setBuffer} suffix="%" />
      </InputGrid>

      {!result ? (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">Check the numbers: tax must be under 100%, weeks off under 52, and hours and billable share above zero.</p>
      ) : (
        <>
          <StatGrid>
            <Stat tone="strong" label="Hourly rate to charge" value={money(result.hourly, 2)} />
            <Stat label="Day rate" value={money(result.daily)} />
            <Stat label="Weekly" value={money(result.weekly)} />
            <Stat label="Monthly revenue needed" value={money(result.monthly)} />
            <Stat label="Revenue needed per year" value={money(result.revenueNeeded)} />
            <Stat label="Billable hours per year" value={String(Math.round(result.billableHours))} />
          </StatGrid>
          <SimpleTable caption="How the yearly revenue is built up" head={['Part', 'Per year']} rows={[
            ['Take-home income you want', money(Number(income))],
            ['Tax to set aside', money(Number(income) / (1 - Number(tax) / 100) - Number(income))],
            ['Business costs', money(Number(overhead))],
            ['Benefits', money(Number(benefits))],
            ['Buffer', money(result.revenueNeeded - result.revenueNeeded / (1 + Number(buffer) / 100))],
            ['Revenue to bring in', money(result.revenueNeeded)],
          ]} />
          <ResultActions summary={summary} />

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Check the rate you charge today</h3>
            <div className="mt-3"><InputGrid><NumberField label="Your current hourly rate" value={myRate} onChange={setMyRate} /></InputGrid></div>
            {current !== null && (
              <p className="mt-3 text-sm text-slate-800">At {money(Number(myRate), 2)} per hour you would take home about <strong>{money(current)}</strong> a year, {current >= Number(income) ? 'which meets your goal.' : `which is ${money(Number(income) - current)} short of your goal.`}</p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Price a project</h3>
            <div className="mt-3"><InputGrid>
              <NumberField label="Hours you expect the project to take" value={projectHours} onChange={setProjectHours} />
              <NumberField label="Cushion for changes and revisions" value={cushion} onChange={setCushion} suffix="%" />
            </InputGrid></div>
            {project !== null && <p className="mt-3 text-sm text-slate-800">Quote about <strong>{money(project)}</strong> for the project, covering {Math.round(Number(projectHours) * (1 + Number(cushion) / 100) * 10) / 10} hours at your rate.</p>}
          </div>
        </>
      )}
      <Note>This is a planning tool. Tax rules, self-employment contributions and what counts as a business cost differ by country, so confirm your tax figure with an accountant. Market rates and client budgets also matter, so compare the result with what others in your field charge.</Note>
      <CalcFooter />
    </section>
  );
};

export default FreelanceRateCalculator;
