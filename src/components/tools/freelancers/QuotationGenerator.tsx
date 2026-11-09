import React, { useEffect, useState } from 'react';
import { CalcFooter, Note, SelectField, calcCard } from '../../finance/ui';
import { fieldClass } from '../utilities/common';
import { todayInput } from '../../../lib/utilities/dates';
import { CURRENCIES, formatMoney } from '../../../lib/freelancers/currency';
import { addDays, quoteTotals, splitMilestones, type QuoteLine } from '../../../lib/freelancers/quote';
import { RowButton, RowInput, nextRowId } from '../shared/rows';

interface Line { id: string; description: string; quantity: string; unitPrice: string }
interface Business { name: string; details: string; terms: string }

const STORAGE_KEY = 'quotation-business-details';
const newLine = (): Line => ({ id: nextRowId(), description: '', quantity: '1', unitPrice: '' });

const loadBusiness = (): Business | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Business) : null;
  } catch {
    return null;
  }
};
const saveBusiness = (value: Business | null) => {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage can be blocked; the quotation still works without it. */
  }
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
  </label>
);

const Area: React.FC<{ label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }> = ({ label, value, onChange, rows = 3, placeholder }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
  </label>
);

export const QuotationGenerator: React.FC = () => {
  const [currency, setCurrency] = useState('USD');
  const [business, setBusiness] = useState<Business>({ name: '', details: '', terms: 'Prices are valid for the period shown. Work starts once the deposit is received.' });
  const [remember, setRemember] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientDetails, setClientDetails] = useState('');
  const [number, setNumber] = useState('Q-001');
  const [date, setDate] = useState(todayInput);
  const [validDays, setValidDays] = useState('30');
  const [project, setProject] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [discount, setDiscount] = useState('');
  const [taxLabel, setTaxLabel] = useState('Tax');
  const [tax, setTax] = useState('');
  const [deposit, setDeposit] = useState('');
  const [split, setSplit] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = loadBusiness();
    if (saved) { setBusiness(saved); setRemember(true); }
  }, []);
  useEffect(() => { if (remember) saveBusiness(business); }, [remember, business]);

  const money = (value: number) => formatMoney(value, currency);
  const parsed: QuoteLine[] = lines.map((line) => ({ description: line.description, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) }));
  const totals = quoteTotals(parsed, Number(discount), Number(tax), Number(deposit));
  const percents = split.split(',').map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0);
  const percentSum = percents.reduce((sum, item) => sum + item, 0);
  const milestones = percents.length > 0 && Math.abs(percentSum - 100) < 0.01 ? splitMilestones(totals.total, percents) : null;
  const validUntil = addDays(date, Number(validDays));
  const updateLine = (id: string, patch: Partial<Line>) => setLines((list) => list.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  const setB = (key: keyof Business) => (value: string) => setBusiness((current) => ({ ...current, [key]: value }));
  const filled = lines.filter((line) => line.description.trim() !== '' || Number(line.unitPrice) > 0);

  return (
    <section className={calcCard}>
      <style>{`@media print { body * { visibility: hidden !important; } #quote-print, #quote-print * { visibility: visible !important; } #quote-print { position: absolute; left: 0; top: 0; width: 100% !important; border: 0 !important; box-shadow: none !important; } @page { size: A4; margin: 14mm 16mm; } }`}</style>
      <div className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Your name or business" value={business.name} onChange={setB('name')} />
          <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCIES.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))} />
          <Area label="Your contact details" value={business.details} onChange={setB('details')} placeholder={'Address, email, phone, tax number'} />
          <Area label="Client details" value={clientDetails} onChange={setClientDetails} placeholder={'Company, contact person, address'} />
          <Field label="Client name" value={clientName} onChange={setClientName} />
          <Field label="Project or title" value={project} onChange={setProject} placeholder="Website redesign" />
          <Field label="Quotation number" value={number} onChange={setNumber} />
          <Field label="Quotation date" type="date" value={date} onChange={setDate} />
          <Field label="Valid for (days)" value={validDays} onChange={setValidDays} />
        </div>

        <h3 className="mt-5 text-sm font-semibold text-slate-900">Items</h3>
        <div className="mt-2 space-y-2">
          {lines.map((line, index) => (
            <div key={line.id} className="grid grid-cols-[1fr_4rem_5.5rem_auto] items-center gap-2">
              <RowInput label={`Item ${index + 1} description`} placeholder="Description" value={line.description} onChange={(event) => updateLine(line.id, { description: event.target.value })} />
              <RowInput label={`Item ${index + 1} quantity`} inputMode="decimal" placeholder="Qty" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: event.target.value })} />
              <RowInput label={`Item ${index + 1} price`} inputMode="decimal" placeholder="Price" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: event.target.value })} />
              <RowButton label={`Remove item ${index + 1}`} onClick={() => setLines((list) => (list.length > 1 ? list.filter((item) => item.id !== line.id) : list))}>Remove</RowButton>
            </div>
          ))}
        </div>
        <div className="mt-2"><RowButton onClick={() => setLines((list) => [...list, newLine()])}>Add an item</RowButton></div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Discount (%)" value={discount} onChange={setDiscount} />
          <Field label="Tax name (VAT, GST, Sales tax)" value={taxLabel} onChange={setTaxLabel} />
          <Field label="Tax rate (%)" value={tax} onChange={setTax} />
          <Field label="Deposit to pay up front (%)" value={deposit} onChange={setDeposit} />
          <div className="sm:col-span-2"><Field label="Split into payments (optional)" value={split} onChange={setSplit} placeholder="30, 40, 30" /></div>
          {percents.length > 0 && !milestones && <p role="alert" className="text-xs text-rose-800 sm:col-span-2">The payment percentages add up to {percentSum}%. They must add up to 100% to be shown.</p>}
          <div className="sm:col-span-2"><Area label="Notes and terms" value={business.terms} onChange={setB('terms')} rows={3} /></div>
          <div className="sm:col-span-2"><Area label="Extra notes for this client (optional)" value={notes} onChange={setNotes} rows={2} /></div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={remember} onChange={(event) => { setRemember(event.target.checked); if (!event.target.checked) saveBusiness(null); }} />
          Remember my business details and terms in this browser (not on a shared computer)
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-800">Print or save as PDF</button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">In the print window choose "Save as PDF", set margins to Default and turn off "Headers and footers".</p>
        <h3 className="mt-6 text-sm font-semibold text-slate-900">Preview</h3>
      </div>

      <div id="quote-print" className="mt-2 rounded-xl border border-slate-300 bg-white p-6 text-sm text-slate-900 print:mt-0">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Quotation</h2>
            <p className="mt-1 text-xs text-slate-600">No. {number || '-'}</p>
            <p className="text-xs text-slate-600">Date: {date || '-'}</p>
            {validUntil && <p className="text-xs text-slate-600">Valid until: {validUntil}</p>}
          </div>
          <div className="max-w-xs whitespace-pre-line text-right text-xs">
            <p className="text-sm font-semibold">{business.name || 'Your name or business'}</p>
            {business.details}
          </div>
        </div>
        <div className="mt-4 whitespace-pre-line text-xs">
          <p className="font-semibold uppercase tracking-wide text-slate-500">Prepared for</p>
          <p className="text-sm font-semibold">{clientName || 'Client name'}</p>
          {clientDetails}
        </div>
        {project && <p className="mt-4 text-sm font-semibold">{project}</p>}
        <table className="mt-4 w-full text-left text-xs">
          <thead><tr className="border-b border-slate-300"><th scope="col" className="py-1.5">Description</th><th scope="col" className="py-1.5 text-right">Qty</th><th scope="col" className="py-1.5 text-right">Price</th><th scope="col" className="py-1.5 text-right">Amount</th></tr></thead>
          <tbody>
            {(filled.length ? filled : lines).map((line) => (
              <tr key={line.id} className="border-b border-slate-100">
                <td className="py-1.5">{line.description || '-'}</td>
                <td className="py-1.5 text-right">{line.quantity}</td>
                <td className="py-1.5 text-right">{money(Number(line.unitPrice) || 0)}</td>
                <td className="py-1.5 text-right">{money((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto mt-3 w-full max-w-xs text-xs">
          <div className="flex justify-between py-0.5"><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
          {totals.discount > 0 && <div className="flex justify-between py-0.5"><dt>Discount ({discount}%)</dt><dd>-{money(totals.discount)}</dd></div>}
          {totals.tax > 0 && <div className="flex justify-between py-0.5"><dt>{taxLabel || 'Tax'} ({tax}%)</dt><dd>{money(totals.tax)}</dd></div>}
          <div className="flex justify-between border-t border-slate-300 py-1 text-sm font-bold"><dt>Total</dt><dd>{money(totals.total)}</dd></div>
          {totals.deposit > 0 && <div className="flex justify-between py-0.5"><dt>Deposit due ({deposit}%)</dt><dd>{money(totals.deposit)}</dd></div>}
          {totals.deposit > 0 && <div className="flex justify-between py-0.5"><dt>Balance</dt><dd>{money(totals.balance)}</dd></div>}
        </dl>
        {milestones && (
          <div className="mt-4 text-xs">
            <p className="font-semibold">Payment schedule</p>
            <ol className="mt-1 list-decimal pl-5">
              {milestones.map((amount, index) => <li key={index}>{percents[index]}%: {money(amount)}</li>)}
            </ol>
          </div>
        )}
        {(business.terms || notes) && <p className="mt-4 whitespace-pre-line border-t border-slate-200 pt-3 text-xs text-slate-700">{[business.terms, notes].filter(Boolean).join('\n\n')}</p>}
      </div>
      <div className="print:hidden">
        <Note>This is a quotation (an offer of price), not an invoice. Tax rules and what a quotation must contain differ by country, so add any registration or tax numbers your law requires. Your details are kept on this device only if you tick the remember box.</Note>
        <CalcFooter />
      </div>
    </section>
  );
};

export default QuotationGenerator;
