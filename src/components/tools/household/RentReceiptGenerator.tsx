import React, { useEffect, useState } from 'react';
import { CalcFooter, Note, SelectField, calcCard } from '../../finance/ui';
import { fieldClass } from '../utilities/common';
import { CURRENCIES, formatMoney } from '../../../lib/freelancers/currency';
import { HRA_PAN_LIMIT, MAX_RECEIPT_MONTHS, formatDay, isPanShape, monthSpan, rentMonths, rupeesInWords } from '../../../lib/household/rent';

interface Details { tenant: string; landlord: string; pan: string; address: string }

const STORAGE_KEY = 'rent-receipt-details';
const PER_PAGE = 3;
/** Largest monthly rent accepted; anything above is almost certainly a typing mistake. */
const MAX_RENT = 1e9;

const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const loadDetails = (): Details | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Details) : null;
  } catch {
    return null;
  }
};
const saveDetails = (value: Details | null) => {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage can be blocked; the receipts still work without it. */
  }
};

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; hint?: string }> = ({ label, value, onChange, type = 'text', placeholder, hint }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
    {hint && <span className="mt-1 block text-[11px] font-normal text-slate-500">{hint}</span>}
  </label>
);

export const RentReceiptGenerator: React.FC = () => {
  const [details, setDetails] = useState<Details>({ tenant: '', landlord: '', pan: '', address: '' });
  const [remember, setRemember] = useState(false);
  const [rent, setRent] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [start, setStart] = useState(thisMonth);
  const [end, setEnd] = useState(thisMonth);
  const [payDay, setPayDay] = useState('1');
  const [mode, setMode] = useState('Bank transfer');
  const [stamp, setStamp] = useState(false);

  useEffect(() => {
    const saved = loadDetails();
    if (saved) { setDetails(saved); setRemember(true); }
  }, []);
  useEffect(() => { if (remember) saveDetails(details); }, [remember, details]);

  const setD = (key: keyof Details) => (value: string) => setDetails((current) => ({ ...current, [key]: value }));
  const typed = Number(rent.replace(/,/g, ''));
  const amount = Number.isFinite(typed) && typed > 0 && typed <= MAX_RENT ? typed : 0;
  const amountInvalid = rent.trim() !== '' && amount === 0;
  const span = monthSpan(start, end);
  const months = rentMonths(start, end, Number(payDay));
  const pages: typeof months[] = [];
  for (let i = 0; i < months.length; i += PER_PAGE) pages.push(months.slice(i, i + PER_PAGE));
  const words = currency === 'INR' ? rupeesInWords(amount) : '';
  const pan = details.pan.trim().toUpperCase();
  const annual = amount * 12;

  return (
    <section className={calcCard}>
      <style>{`@media print { body * { visibility: hidden !important; } #rent-print, #rent-print * { visibility: visible !important; } #rent-print { position: absolute; left: 0; top: 0; width: 100% !important; } .rent-page { break-after: page; page-break-after: always; } .rent-page:last-child { break-after: auto; page-break-after: auto; } @page { size: A4; margin: 8mm; } }`}</style>
      <div className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tenant name" value={details.tenant} onChange={setD('tenant')} placeholder="Who pays the rent" />
          <Field label="Landlord name" value={details.landlord} onChange={setD('landlord')} placeholder="Who receives the rent" />
          <Field label="Landlord PAN (needed if yearly rent is over Rs 1 lakh)" value={details.pan} onChange={setD('pan')} placeholder="ABCDE1234F" />
          <Field label="Rented property address" value={details.address} onChange={setD('address')} placeholder="Flat, building, area, city" />
          <Field label="Monthly rent" value={rent} onChange={setRent} placeholder="15000" />
          <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCIES.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))} />
          <Field label="First month" type="month" value={start} onChange={setStart} />
          <Field label="Last month" type="month" value={end} onChange={setEnd} />
          <Field label="Day of the month it was paid (1 to 28)" value={payDay} onChange={setPayDay} />
          <SelectField label="How it was paid" value={mode} onChange={setMode} options={['Bank transfer', 'UPI', 'Cheque', 'Cash'].map((item) => ({ value: item, label: item }))} />
        </div>
        {span > MAX_RECEIPT_MONTHS && <p role="alert" className="mt-2 text-xs text-rose-800">That range is {span} months. Receipts are made for the first {MAX_RECEIPT_MONTHS}; make a second set for the rest.</p>}
        {amountInvalid && <p role="alert" className="mt-2 text-xs text-rose-800">Enter the monthly rent as a positive number, for example 15000.</p>}
        {span === 0 && <p role="alert" className="mt-2 text-xs text-rose-800">Choose a last month that is the same as or after the first month.</p>}
        {currency === 'INR' && amount > 0 && annual > HRA_PAN_LIMIT && !isPanShape(pan) && <p role="status" className="mt-2 text-xs text-amber-800">Yearly rent is about {formatMoney(annual, 'INR', 0)}. For an HRA claim above Rs 1 lakh a year, employers usually ask for the landlord's PAN, so add it above.</p>}
        {pan && !isPanShape(pan) && <p role="alert" className="mt-2 text-xs text-rose-800">A PAN has five letters, four digits and one letter, for example ABCDE1234F.</p>}
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={stamp} onChange={(event) => setStamp(event.target.checked)} />
          Leave a small box on each receipt for a revenue stamp
        </label>
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={remember} onChange={(event) => { setRemember(event.target.checked); if (!event.target.checked) saveDetails(null); }} />
          Remember the names, PAN and address in this browser (not on a shared computer)
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={months.length === 0 || amount <= 0} onClick={() => window.print()} className="inline-flex min-h-11 items-center rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50">Print or save as PDF ({months.length} {months.length === 1 ? 'receipt' : 'receipts'})</button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">In the print window choose "Save as PDF", set margins to Default and turn off "Headers and footers". Print them, then have the landlord sign each one.</p>
        <h3 className="mt-6 text-sm font-semibold text-slate-900">Preview</h3>
      </div>

      <div id="rent-print" className="mt-2 space-y-4 print:mt-0">
        {pages.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">Choose the months to see the receipts.</p>}
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} className="rent-page">
            {page.map((month) => (
              <article key={month.index} className="rent-receipt mb-3 rounded-lg border border-dashed border-slate-400 bg-white p-4 text-xs text-slate-900 print:mb-[3mm] print:h-[88mm] print:break-inside-avoid">
                <header className="flex items-start justify-between gap-3 border-b border-slate-300 pb-2">
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wide">Rent receipt</h2>
                    <p className="text-[11px] text-slate-600">Receipt no. {month.index} for {month.label}</p>
                  </div>
                  <p className="text-right text-[11px] text-slate-600">Date: {formatDay(month.paidOn)}</p>
                </header>
                <p className="mt-3 leading-relaxed">
                  Received with thanks from <strong>{details.tenant || 'Tenant name'}</strong> the sum of <strong>{formatMoney(amount, currency)}</strong>
                  {words && <> ({words})</>} as rent for the period <strong>{formatDay(month.from)}</strong> to <strong>{formatDay(month.to)}</strong>
                  {details.address ? <> for the property at {details.address}</> : null}, paid by {mode.toLowerCase()}.
                </p>
                <footer className="mt-4 flex items-end justify-between gap-3">
                  <div className="text-[11px] text-slate-600">
                    {stamp && <div className="mb-1 flex h-12 w-16 items-center justify-center border border-slate-400 text-[9px] text-slate-400">Revenue stamp</div>}
                    {pan && <p>Landlord PAN: {pan}</p>}
                  </div>
                  <div className="min-w-40 text-center">
                    <div className="h-10 border-b border-slate-500" />
                    <p className="mt-1 font-semibold">{details.landlord || 'Landlord name'}</p>
                    <p className="text-[10px] text-slate-500">Landlord's signature</p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        ))}
      </div>
      <div className="print:hidden">
        <Note>Use this only for rent that was actually paid. The landlord should sign each receipt, and your employer may also ask for the rent agreement and bank proof. Rules about PAN, revenue stamps and HRA change, so check the current Income Tax guidance or ask your accountant.</Note>
        <CalcFooter />
      </div>
    </section>
  );
};

export default RentReceiptGenerator;
