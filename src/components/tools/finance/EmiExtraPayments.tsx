import React from 'react';
import { NumberField } from '../../finance/ui';
import { RowButton, RowInput, nextRowId } from '../shared/rows';
import type { ExtraInputs } from '../../../lib/finance/emiSchedule';

interface Props {
  value: ExtraInputs;
  onChange: (value: ExtraInputs) => void;
  /** Loan length in months, shown as a hint so people pick a month that exists. */
  tenureMonths: number;
}

/** Inputs for extra payments: one repeating payment and any number of one-time payments. Leave them empty for none. */
export const EmiExtraPayments: React.FC<Props> = ({ value, onChange, tenureMonths }) => {
  const set = (patch: Partial<ExtraInputs>) => onChange({ ...value, ...patch });
  const updateRow = (id: string, patch: Partial<ExtraInputs['rows'][number]>) => set({ rows: value.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  return (
    <fieldset className="mt-4 rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-xs font-bold text-slate-900">Extra payments (optional)</legend>
      <p className="text-[11px] text-slate-500">Money you pay on top of the EMI goes straight against the loan, so the loan ends sooner and you pay less interest. Months are counted from the first EMI (month 1 to {tenureMonths}).</p>

      <p className="mt-3 text-xs font-semibold text-slate-800">A payment that repeats</p>
      <div className="mt-1 grid gap-3 sm:grid-cols-3">
        <NumberField label="Extra amount each time" prefix="₹" value={value.amount} onChange={(amount) => set({ amount })} words />
        <NumberField label="Repeat every (months)" value={value.every} onChange={(every) => set({ every })} hint="1 = every month, 12 = once a year" />
        <NumberField label="Starting in month" value={value.start} onChange={(start) => set({ start })} />
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-800">One-time payments (a bonus, a windfall)</p>
      <div className="mt-2 space-y-2">
        {value.rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2">
            <RowInput label={`One-time payment ${index + 1} month number`} inputMode="numeric" placeholder="Month" value={row.month} onChange={(event) => updateRow(row.id, { month: event.target.value })} />
            <RowInput label={`One-time payment ${index + 1} amount`} inputMode="decimal" placeholder="Amount in rupees" value={row.amount} onChange={(event) => updateRow(row.id, { amount: event.target.value })} />
            <RowButton label={`Remove one-time payment ${index + 1}`} onClick={() => set({ rows: value.rows.filter((item) => item.id !== row.id) })}>Remove</RowButton>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <RowButton onClick={() => set({ rows: [...value.rows, { id: nextRowId(), month: '', amount: '' }] })}>Add a one-time payment</RowButton>
        {(value.rows.length > 0 || value.amount !== '' || value.every !== '') && (
          <RowButton onClick={() => onChange({ every: '', amount: '', start: '1', rows: [] })}>Clear all extra payments</RowButton>
        )}
      </div>
    </fieldset>
  );
};

export default EmiExtraPayments;
