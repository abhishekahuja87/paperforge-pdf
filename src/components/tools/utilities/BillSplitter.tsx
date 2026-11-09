import React, { Suspense, lazy, useMemo, useState } from 'react';
import { CalcFooter, InputGrid, NumberField, ResultActions, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { parseAmount } from '../../../lib/finance/format';
import { splitBill } from '../../../lib/utilities/more';
import { formatMoney } from '../../../lib/settle/settle';

const GroupSettle = lazy(() => import('./GroupSettle'));

/** Plain number with the optional sign typed by the visitor; amounts here are in whole units, so scale to hundredths. */
const money = (value: number, sign: string) => formatMoney(Math.round(value * 100), sign);

const MODES = [{ value: 'equal', label: 'Equal split' }, { value: 'group', label: 'Group settle-up (uneven)' }] as const;

export const BillSplitter: React.FC = () => {
  const [mode, setMode] = useState<'equal' | 'group'>('equal');
  const [total, setTotal] = useState('2450');
  const [tip, setTip] = useState('10');
  const [people, setPeople] = useState('4');
  const [round, setRound] = useState('0');
  const [sign, setSign] = useState('');
  const result = useMemo(() => {
    const t = parseAmount(total);
    const n = Math.floor(parseAmount(people));
    if (t <= 0 || n < 1 || n > 1000) return null;
    const base = splitBill(t, parseAmount(tip), n);
    const step = Number(round);
    const each = step > 0 ? Math.ceil(base.perPerson / step) * step : base.perPerson;
    return { ...base, each, collected: each * n, extra: each * n - base.grand, n };
  }, [total, tip, people, round]);
  const summary = result ? `Bill ${money(parseAmount(total), sign)} plus ${tip}% tip = ${money(result.grand, sign)}; ${result.n} people pay ${money(result.each, sign)} each. mydailyutils.in` : '';
  return (
    <section className={calcCard}>
      <div role="group" aria-label="Splitting method" className="mb-4 flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button key={item.value} type="button" aria-pressed={mode === item.value} onClick={() => setMode(item.value)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition ${mode === item.value ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{item.label}</button>
        ))}
      </div>
      {mode === 'group' ? (
        <Suspense fallback={<p className="text-xs text-slate-500">Loading…</p>}><GroupSettle /></Suspense>
      ) : (
        <>
          <InputGrid>
            <NumberField label="Bill amount" value={total} onChange={setTotal} />
            <NumberField label="Tip or service charge" suffix="%" value={tip} onChange={setTip} hint="Set 0 if service charge is already on the bill" />
            <NumberField label="Number of people" value={people} onChange={setPeople} step="1" />
            <SelectField label="Round each share up to" value={round} onChange={setRound} options={[
              { value: '0', label: 'Exact amount' }, { value: '1', label: 'Next whole number' }, { value: '5', label: 'Next multiple of 5' }, { value: '10', label: 'Next multiple of 10' },
            ]} />
            <label className="block text-xs font-semibold text-slate-700">Currency sign (optional)
              <input value={sign} onChange={(event) => setSign(event.target.value)} maxLength={6} placeholder="Leave empty for plain numbers" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" />
            </label>
          </InputGrid>
          {result ? (
            <>
              <StatGrid>
                <Stat label="Each person pays" value={money(result.each, sign)} tone="strong" />
                <Stat label="Tip / service charge" value={money(result.tip, sign)} />
                <Stat label="Total with tip" value={money(result.grand, sign)} tone="good" />
                {result.extra > 0.004 && <Stat label="Extra collected by rounding" value={money(result.extra, sign)} />}
              </StatGrid>
              <ResultActions summary={summary} />
            </>
          ) : <p className="mt-4 text-xs text-slate-500">Enter a bill amount and 1 to 1000 people.</p>}
          <p className="mt-3 text-xs text-slate-500">Everyone pays the same share here. If people ordered different things or paid for different things, switch to Group settle-up above.</p>
        </>
      )}
      <CalcFooter />
    </section>
  );
};

export default BillSplitter;
