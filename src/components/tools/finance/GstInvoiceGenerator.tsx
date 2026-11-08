import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { CalcFooter, calcCard } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { formatInrPaise } from '../../../lib/finance/format';
import { GST_RATES, GST_STATES, checkGstin, computeInvoice, type InvoiceItemInput } from '../../../lib/gst/invoice';
import { amountToRupeeWords } from '../../../lib/utilities/numberToWords';
import { todayInput } from '../../../lib/utilities/dates';

interface Item { id: number; description: string; hsn: string; qty: string; unit: string; rate: string; discount: string; gstRate: string }
interface Party { name: string; address: string; gstin: string; stateCode: string; contact: string }

const STORAGE_KEY = 'mdu-gst-seller';
const emptyParty: Party = { name: '', address: '', gstin: '', stateCode: '', contact: '' };
const newItem = (id: number): Item => ({ id, description: '', hsn: '', qty: '1', unit: 'pcs', rate: '', discount: '0', gstRate: '18' });
const num = (text: string) => { const value = Number(text); return Number.isFinite(value) && value > 0 ? value : 0; };

function loadSaved(): { seller: Party; extras: { notes: string; bank: string } } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { seller: Party; extras: { notes: string; bank: string } }) : null;
  } catch {
    return null;
  }
}

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string; ok?: string }> = ({ label, value, onChange, placeholder, type = 'text', error, ok }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={fieldClass} />
    {error && <span className="mt-1 block font-normal text-red-700" role="alert">{error}</span>}
    {ok && <span className="mt-1 block font-normal text-emerald-700">{ok}</span>}
  </label>
);

const StateSelect: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
      <option value="">Select state</option>
      {GST_STATES.map((state) => <option key={state.code} value={state.code}>{state.code} - {state.name}</option>)}
    </select>
  </label>
);

const PartyForm: React.FC<{ title: string; party: Party; onChange: (party: Party) => void; stateLabel: string; showPan?: boolean }> = ({ title, party, onChange, stateLabel }) => {
  const check = party.gstin.trim() ? checkGstin(party.gstin) : null;
  const set = (key: keyof Party, value: string) => {
    const next = { ...party, [key]: value };
    if (key === 'gstin') {
      const result = checkGstin(value);
      if (result.ok) next.stateCode = result.stateCode;
    }
    onChange(next);
  };
  return (
    <fieldset className="space-y-3 rounded-xl bg-slate-50 p-4">
      <legend className="px-1 text-sm font-bold text-slate-900">{title}</legend>
      <Field label="Name" value={party.name} onChange={(v) => set('name', v)} />
      <label className="block text-xs font-semibold text-slate-700">
        Address
        <textarea value={party.address} onChange={(event) => set('address', event.target.value)} rows={2} className={`${fieldClass} resize-y font-normal`} />
      </label>
      <Field label="GSTIN" value={party.gstin} onChange={(v) => set('gstin', v.toUpperCase())} placeholder="15 characters" error={check && !check.ok ? check.reason : undefined} ok={check?.ok ? 'GSTIN format and check character are valid.' : undefined} />
      <StateSelect label={stateLabel} value={party.stateCode} onChange={(v) => set('stateCode', v)} />
      <Field label="Phone or email (optional)" value={party.contact} onChange={(v) => set('contact', v)} />
    </fieldset>
  );
};

export const GstInvoiceGenerator: React.FC = () => {
  const saved = useMemo(loadSaved, []);
  const [type, setType] = useState('tax');
  const [number, setNumber] = useState('INV-001');
  const [date, setDate] = useState(todayInput);
  const [dueDate, setDueDate] = useState('');
  const [seller, setSeller] = useState<Party>(saved?.seller ?? emptyParty);
  const [buyer, setBuyer] = useState<Party>(emptyParty);
  const [items, setItems] = useState<Item[]>([{ ...newItem(1), description: 'Sample item', hsn: '', rate: '1000' }]);
  const [roundOff, setRoundOff] = useState(true);
  const [notes, setNotes] = useState(saved?.extras.notes ?? '');
  const [bank, setBank] = useState(saved?.extras.bank ?? '');
  const [remember, setRemember] = useState(Boolean(saved));
  const [nextId, setNextId] = useState(2);

  useEffect(() => {
    try {
      if (remember) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ seller, extras: { notes, bank } }));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage can be blocked; the invoice still works */ }
  }, [remember, seller, notes, bank]);

  const isTax = type === 'tax';
  const intra = seller.stateCode !== '' && seller.stateCode === buyer.stateCode;
  const stateKnown = seller.stateCode !== '' && buyer.stateCode !== '';
  const totals = useMemo(() => {
    const inputs: InvoiceItemInput[] = items.map((item) => ({
      description: item.description, hsn: item.hsn, qty: num(item.qty), unit: item.unit, rate: num(item.rate),
      discountPercent: Math.min(100, num(item.discount)), gstRate: isTax ? Number(item.gstRate) : 0,
    }));
    return computeInvoice(inputs, intra, roundOff);
  }, [items, intra, roundOff, isTax]);
  const words = amountToRupeeWords(totals.payable, 'indian');
  const stateName = (code: string) => GST_STATES.find((state) => state.code === code)?.name ?? '';

  const updateItem = (id: number, key: keyof Item, value: string) => setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  const addItem = () => { setItems((current) => [...current, newItem(nextId)]); setNextId((current) => current + 1); };
  const reset = () => {
    setItems([newItem(nextId)]); setNextId((current) => current + 1);
    setBuyer(emptyParty); setNumber('INV-001'); setDate(todayInput()); setDueDate('');
  };
  const hasContent = totals.lines.some((line) => line.taxable > 0);
  const cellHead = 'border border-slate-300 px-2 py-1.5 text-left font-semibold';
  const cell = 'border border-slate-300 px-2 py-1.5 align-top';
  const right = `${cell} text-right whitespace-nowrap`;

  return (
    <section className={calcCard}>
      <style>{`@media print { body * { visibility: hidden !important; } #gst-invoice-print, #gst-invoice-print * { visibility: visible !important; } #gst-invoice-print { position: absolute; left: 0; top: 0; width: 100%; border: 0 !important; box-shadow: none !important; } @page { margin: 12mm; } }`}</style>
      <div className="space-y-5 print:hidden">
        <ChoiceButtons label="Document type" value={type} onChange={setType} options={[{ value: 'tax', label: 'Tax invoice (GST charged)' }, { value: 'bill', label: 'Bill of supply (no GST charged)' }]} />
        <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <Field label="Invoice number" value={number} onChange={setNumber} />
          <Field label="Invoice date" type="date" value={date} onChange={setDate} />
          <Field label="Due date (optional)" type="date" value={dueDate} onChange={setDueDate} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PartyForm title="Seller (your business)" party={seller} onChange={setSeller} stateLabel="Your state" />
          <PartyForm title="Buyer (bill to)" party={buyer} onChange={setBuyer} stateLabel="Place of supply (buyer's state)" />
        </div>
        <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4" />
          Remember my business details, notes and bank details in this browser
        </label>
        <p className={`rounded-lg px-3 py-2 text-xs ${stateKnown ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`} role="status">
          {!isTax ? 'No GST is charged on a bill of supply.' : stateKnown ? (intra ? 'Seller and buyer are in the same state: CGST + SGST are charged.' : 'Seller and buyer are in different states: IGST is charged.') : 'Choose both states to decide between CGST + SGST and IGST. Until then CGST + SGST is not applied.'}
        </p>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Items</h2>
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-6">
              <label className="block text-xs font-semibold text-slate-700 sm:col-span-3">Description {index + 1}<input value={item.description} onChange={(event) => updateItem(item.id, 'description', event.target.value)} className={fieldClass} /></label>
              <label className="block text-xs font-semibold text-slate-700">HSN / SAC<input value={item.hsn} onChange={(event) => updateItem(item.id, 'hsn', event.target.value)} className={fieldClass} /></label>
              <label className="block text-xs font-semibold text-slate-700">Qty<input type="number" min="0" step="any" inputMode="decimal" value={item.qty} onChange={(event) => updateItem(item.id, 'qty', event.target.value)} className={fieldClass} /></label>
              <label className="block text-xs font-semibold text-slate-700">Unit<input value={item.unit} onChange={(event) => updateItem(item.id, 'unit', event.target.value)} className={fieldClass} /></label>
              <label className="block text-xs font-semibold text-slate-700">Rate (₹, before GST)<input type="number" min="0" step="any" inputMode="decimal" value={item.rate} onChange={(event) => updateItem(item.id, 'rate', event.target.value)} className={fieldClass} /></label>
              <label className="block text-xs font-semibold text-slate-700">Discount %<input type="number" min="0" max="100" step="any" inputMode="decimal" value={item.discount} onChange={(event) => updateItem(item.id, 'discount', event.target.value)} className={fieldClass} /></label>
              <label className="block text-xs font-semibold text-slate-700">GST rate
                <select value={isTax ? item.gstRate : '0'} disabled={!isTax} onChange={(event) => updateItem(item.id, 'gstRate', event.target.value)} className={fieldClass}>
                  {GST_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
                </select>
              </label>
              <div className="flex items-end justify-between gap-2 sm:col-span-2">
                <p className="text-xs text-slate-600">Line total: <strong>{formatInrPaise(totals.lines[index]?.total ?? 0)}</strong></p>
                <button type="button" onClick={() => setItems((current) => (current.length > 1 ? current.filter((entry) => entry.id !== item.id) : current))} disabled={items.length === 1} aria-label={`Remove item ${index + 1}`} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" aria-hidden="true" />Add item</button>
        </div>

        <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={roundOff} onChange={(event) => setRoundOff(event.target.checked)} className="h-4 w-4" />
          Round the total to the nearest rupee
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Bank details or payment instructions (optional)<textarea value={bank} onChange={(event) => setBank(event.target.value)} rows={3} className={`${fieldClass} resize-y font-normal`} /></label>
          <label className="block text-xs font-semibold text-slate-700">Notes or terms (optional)<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={`${fieldClass} resize-y font-normal`} /></label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} disabled={!hasContent} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"><Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF</button>
          <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">New invoice (keep my details)</button>
        </div>
        <p className="text-[11px] text-slate-500">In the print window choose "Save as PDF" as the destination. Turn off "Headers and footers" for a clean page.</p>
      </div>

      <h2 className="mt-6 text-sm font-bold text-slate-900 print:hidden">Preview</h2>
      <div id="gst-invoice-print" className="mt-2 overflow-x-auto rounded-xl border border-slate-300 bg-white p-5 text-xs text-slate-900">
        <div className="min-w-[640px]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-300 pb-3">
            <div>
              <p className="text-base font-extrabold">{seller.name || 'Seller name'}</p>
              <p className="whitespace-pre-line">{seller.address}</p>
              {seller.gstin && <p>GSTIN: {seller.gstin}</p>}
              {seller.stateCode && <p>State: {stateName(seller.stateCode)} ({seller.stateCode})</p>}
              {seller.contact && <p>{seller.contact}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg font-black uppercase tracking-wide">{isTax ? 'Tax invoice' : 'Bill of supply'}</p>
              <p>No: <strong>{number}</strong></p>
              <p>Date: {date}</p>
              {dueDate && <p>Due: {dueDate}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-slate-300 py-3">
            <div>
              <p className="font-semibold text-slate-500">Bill to</p>
              <p className="font-bold">{buyer.name || 'Buyer name'}</p>
              <p className="whitespace-pre-line">{buyer.address}</p>
              {buyer.gstin && <p>GSTIN: {buyer.gstin}</p>}
              {buyer.contact && <p>{buyer.contact}</p>}
            </div>
            <div>
              <p className="font-semibold text-slate-500">Place of supply</p>
              <p className="font-bold">{buyer.stateCode ? `${stateName(buyer.stateCode)} (${buyer.stateCode})` : 'Not selected'}</p>
              {isTax && stateKnown && <p>{intra ? 'Intra-state supply (CGST + SGST)' : 'Inter-state supply (IGST)'}</p>}
            </div>
          </div>
          <table className="mt-3 w-full border-collapse">
            <thead className="bg-slate-100"><tr>
              <th className={cellHead}>#</th><th className={cellHead}>Description</th><th className={cellHead}>HSN/SAC</th><th className={`${cellHead} text-right`}>Qty</th>
              <th className={`${cellHead} text-right`}>Rate</th><th className={`${cellHead} text-right`}>Disc.</th><th className={`${cellHead} text-right`}>Taxable</th>
              {isTax && <th className={`${cellHead} text-right`}>GST</th>}<th className={`${cellHead} text-right`}>Amount</th>
            </tr></thead>
            <tbody>
              {totals.lines.filter((line) => line.description || line.rate).map((line, index) => (
                <tr key={index}>
                  <td className={cell}>{index + 1}</td><td className={cell}>{line.description}</td><td className={cell}>{line.hsn}</td>
                  <td className={right}>{line.qty} {line.unit}</td><td className={right}>{formatInrPaise(line.rate)}</td>
                  <td className={right}>{line.discount > 0 ? formatInrPaise(line.discount) : '-'}</td><td className={right}>{formatInrPaise(line.taxable)}</td>
                  {isTax && <td className={right}>{line.gstRate}%</td>}<td className={right}>{formatInrPaise(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              {isTax && totals.byRate.length > 0 && (
                <table className="w-full border-collapse">
                  <thead className="bg-slate-100"><tr><th className={cellHead}>Rate</th><th className={`${cellHead} text-right`}>Taxable</th>{intra ? <><th className={`${cellHead} text-right`}>CGST</th><th className={`${cellHead} text-right`}>SGST</th></> : <th className={`${cellHead} text-right`}>IGST</th>}</tr></thead>
                  <tbody>{totals.byRate.map((row) => (
                    <tr key={row.rate}><td className={cell}>{row.rate}%</td><td className={right}>{formatInrPaise(row.taxable)}</td>{intra ? <><td className={right}>{formatInrPaise(row.cgst)}</td><td className={right}>{formatInrPaise(row.sgst)}</td></> : <td className={right}>{formatInrPaise(row.igst)}</td>}</tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            <dl className="space-y-1">
              <div className="flex justify-between"><dt>Taxable value</dt><dd>{formatInrPaise(totals.taxable)}</dd></div>
              {isTax && intra && <><div className="flex justify-between"><dt>CGST</dt><dd>{formatInrPaise(totals.cgst)}</dd></div><div className="flex justify-between"><dt>SGST</dt><dd>{formatInrPaise(totals.sgst)}</dd></div></>}
              {isTax && !intra && <div className="flex justify-between"><dt>IGST</dt><dd>{formatInrPaise(totals.igst)}</dd></div>}
              {roundOff && totals.roundOff !== 0 && <div className="flex justify-between"><dt>Round off</dt><dd>{totals.roundOff > 0 ? '+' : '-'}{formatInrPaise(Math.abs(totals.roundOff))}</dd></div>}
              <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold"><dt>Total</dt><dd>{formatInrPaise(totals.payable)}</dd></div>
            </dl>
          </div>
          {words && hasContent && <p className="mt-3"><strong>Amount in words:</strong> {words}</p>}
          {(bank || notes) && (
            <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-300 pt-3">
              <div>{bank && <><p className="font-semibold text-slate-500">Bank / payment details</p><p className="whitespace-pre-line">{bank}</p></>}</div>
              <div>{notes && <><p className="font-semibold text-slate-500">Notes / terms</p><p className="whitespace-pre-line">{notes}</p></>}</div>
            </div>
          )}
          <div className="mt-8 text-right"><p>For <strong>{seller.name || 'Seller name'}</strong></p><p className="mt-8">Authorised signatory</p></div>
        </div>
      </div>
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 print:hidden">
        This tool helps you lay out an invoice and do the arithmetic. It does not file returns, generate an e-invoice (IRN or QR code) or check that a GSTIN is registered; the GSTIN check only tests the format and check character. Whether and how you must charge GST (rates, HSN codes, reverse charge, e-invoicing thresholds) depends on your business, so confirm with a tax professional or the GST portal. Each rate is rounded to the paisa line by line.
      </p>
      <CalcFooter />
    </section>
  );
};

export default GstInvoiceGenerator;
