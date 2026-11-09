import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { ChoiceButtons, DateField } from '../utilities/common';
import { WEEKDAYS, formatDate, parseDateInput, todayInput } from '../../../lib/utilities/dates';
import { computeNotice } from '../../../lib/careers/notice';
const money = (value: number) => value.toLocaleString('en-IN');

const day = (date: Date) => `${WEEKDAYS[date.getUTCDay()]}, ${formatDate(date)}`;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const NoticePeriodCalculator: React.FC = () => {
  const [resignation, setResignation] = useState(todayInput);
  const [noticeValue, setNoticeValue] = useState('60');
  const [unit, setUnit] = useState('days');
  const [counting, setCounting] = useState('calendar');
  const [countFirstDay, setCountFirstDay] = useState('no');
  const [buyoutDays, setBuyoutDays] = useState('0');
  const [leaveDays, setLeaveDays] = useState('0');
  const [monthlyPay, setMonthlyPay] = useState('');
  const [joining, setJoining] = useState('');

  const result = useMemo(() => {
    const start = parseDateInput(resignation);
    if (!start) return { error: 'Enter the date you resign (or plan to resign).' } as const;
    const value = Number(noticeValue);
    if (!Number.isFinite(value) || value < 0 || value > 1000) return { error: 'Enter a notice period between 0 and 1000.' } as const;
    return {
      start,
      data: computeNotice({
        resignation: start,
        noticeValue: value,
        noticeUnit: unit === 'months' ? 'months' : 'days',
        counting: counting === 'working' && unit === 'days' ? 'working' : 'calendar',
        countFirstDay: countFirstDay === 'yes',
        buyoutDays: Number(buyoutDays) || 0,
        leaveDays: Number(leaveDays) || 0,
        monthlyPay: Number(monthlyPay) || 0,
        joining: parseDateInput(joining),
        asOf: parseDateInput(todayInput()) ?? start,
      }),
    } as const;
  }, [resignation, noticeValue, unit, counting, countFirstDay, buyoutDays, leaveDays, monthlyPay, joining]);

  const summary = 'error' in result ? '' : [
    `Resignation: ${formatDate(result.start)}`,
    `Notice: ${noticeValue} ${unit}${buyoutDays && Number(buyoutDays) > 0 ? `, buyout ${buyoutDays} days` : ''}`,
    `Last working day: ${day(result.data.lastDay)}`,
    result.data.gapDays !== null ? (result.data.gapDays >= 0 ? `New job starts ${plural(result.data.gapDays, 'day')} after the last day` : `Need to cut ${plural(result.data.daysToCut, 'day')} of notice to join on time`) : '',
  ].filter(Boolean).join('\n');

  return (
    <section className={calcCard}>
      <InputGrid>
        <DateField label="Date you resign" value={resignation} onChange={setResignation} />
        <NumberField label="Notice period" value={noticeValue} onChange={setNoticeValue} step="1" />
        <SelectField label="Notice period unit" value={unit} onChange={setUnit} options={[{ value: 'days', label: 'Days' }, { value: 'months', label: 'Months' }]} />
        {unit === 'days' && <SelectField label="Count" value={counting} onChange={setCounting} options={[{ value: 'calendar', label: 'Every calendar day' }, { value: 'working', label: 'Working days (Mon to Fri)' }]} />}
        <NumberField label="Days of notice you will buy out" value={buyoutDays} onChange={setBuyoutDays} step="1" hint="0 if you serve the full notice" />
        <NumberField label="Leave you will take during notice (days)" value={leaveDays} onChange={setLeaveDays} step="1" hint="Many companies extend notice by the leave taken" />
        <NumberField label="Monthly pay for a buyout (optional)" value={monthlyPay} onChange={setMonthlyPay} hint="Use the pay your policy says: gross, basic or fixed" />
        <DateField label="New job joining date (optional)" value={joining} onChange={setJoining} />
      </InputGrid>
      <div className="mt-3">
        <ChoiceButtons label="Is the day you resign counted as day 1?" value={countFirstDay} onChange={setCountFirstDay} options={[{ value: 'no', label: 'No, notice starts the next day' }, { value: 'yes', label: 'Yes, resignation day is day 1' }]} />
      </div>

      {'error' in result ? (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">{result.error}</p>
      ) : (
        <>
          <StatGrid>
            <Stat tone="strong" label="Last working day" value={day(result.data.lastDay)} />
            <Stat label="Days left from today" value={result.data.daysFromNow >= 0 ? plural(result.data.daysFromNow, 'day') : `Passed ${plural(-result.data.daysFromNow, 'day')} ago`} />
            <Stat label="Notice served" value={plural(result.data.noticeDaysServed, 'calendar day')} />
            {Number(buyoutDays) > 0 && <Stat label="Without the buyout your last day would be" value={day(result.data.fullNoticeLastDay)} />}
            {result.data.buyoutAmount > 0 && <Stat tone="good" label={`Estimated buyout (${plural(Number(buyoutDays), 'day')})`} value={money(result.data.buyoutAmount)} />}
            {result.data.gapDays !== null && result.data.gapDays >= 0 && <Stat tone="good" label="Gap before the new job" value={result.data.gapDays === 0 ? 'None: you start the next day' : plural(result.data.gapDays, 'day')} />}
            {result.data.gapDays !== null && result.data.gapDays < 0 && <Stat label="Notice to cut to join on time" value={plural(result.data.daysToCut, 'day')} />}
            {result.data.gapDays !== null && result.data.gapDays < 0 && result.data.cutAmount > 0 && <Stat label="Buyout cost to cut it" value={money(result.data.cutAmount)} />}
          </StatGrid>
          {result.data.weekend && <Note>This last day falls on a weekend. Companies often move it to the nearest working day, so confirm with HR.</Note>}
          {result.data.gapDays !== null && result.data.gapDays < 0 && <Note>Your new joining date is before this last day. You would need to shorten the notice by about {plural(result.data.daysToCut, 'day')}, by agreement with your manager or a buyout, or ask the new employer for a later joining date.</Note>}
          <ResultActions summary={summary} />
        </>
      )}
      <Note>Companies count notice differently. Your offer letter, appointment letter or HR policy decides your real last day, buyout rules and what happens with leave, so treat this as a planning aid and confirm with HR in writing.</Note>
      <CalcFooter />
    </section>
  );
};

export default NoticePeriodCalculator;
