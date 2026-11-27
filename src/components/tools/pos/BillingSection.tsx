import React, { type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { FileImage, FilePlus2, Pencil, Printer, Save, X } from 'lucide-react';
import { calculateInvoiceTotals, formatMoney } from '../../../lib/pos/workspace';
import { type InventoryItem, type InvoiceDraft, type StoreProfile } from '../../../lib/pos/types';
import { fieldClass, labelClass, secondaryButtonClass, primaryButtonClass, shareButtonClass, backupButtonClass } from './styles';

interface BillingSectionProps {
  addInvoiceItem: () => void;
  downloadWorkspace: () => void;
  editingNote: boolean;
  exportImage: () => Promise<void>;
  inventory: InventoryItem[];
  invoice: InvoiceDraft;
  invoiceRef: RefObject<HTMLDivElement | null>;
  isExportingImage: boolean;
  noteDraft: string;
  removeLine: (lineId: string) => void;
  selectedItemId: string;
  setEditingNote: (editing: boolean) => void;
  setNoteDraft: (note: string) => void;
  setSelectedItemId: (id: string) => void;
  startNewInvoice: () => void;
  store: StoreProfile;
  totals: ReturnType<typeof calculateInvoiceTotals>;
  updateBillingSetting: <K extends 'taxLabel' | 'taxRate' | 'additionalTaxLabel' | 'additionalTaxRate' | 'chargeLabel' | 'chargeAmount'>(key: K, value: StoreProfile[K]) => void;
  updateInvoice: <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => void;
  updateLine: (lineId: string, quantity: number) => void;
}

export const BillingSection: React.FC<BillingSectionProps> = ({ addInvoiceItem, downloadWorkspace, editingNote, exportImage, inventory, invoice, invoiceRef, isExportingImage, noteDraft, removeLine, selectedItemId, setEditingNote, setNoteDraft, setSelectedItemId, startNewInvoice, store, totals, updateBillingSetting, updateInvoice, updateLine }) => {
  const { t, i18n } = useTranslation();
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Prepare the customer bill</h3>
            <p className="mt-1 text-xs text-slate-500">Bill {invoice.number} · Select items from inventory, enter customer details, and review the total before sharing.</p>
          </div>
      </div>

        <div className="flex flex-col gap-2 rounded-xl border border-orange-200 bg-orange-50/50 p-3 sm:flex-row">
          <select className={`${fieldClass} mt-0 min-w-0 flex-1`} value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} aria-label="Select an item from inventory">
            <option value="">Select an item from inventory...</option>
            {inventory.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.price, store.currency)} / {item.unit}</option>)}
          </select>
          <button type="button" className={primaryButtonClass} onClick={addInvoiceItem} disabled={!inventory.length}><FilePlus2 className="h-3.5 w-3.5" />Add item</button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Price / unit</th><th className="px-3 py-2">Quantity</th><th className="px-3 py-2 text-right">Amount</th><th className="px-2 py-2"><span className="sr-only">Remove</span></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-3 py-2.5"><p className="font-semibold text-slate-800">{line.name}</p><p className="text-[10px] text-slate-500">{line.sku ? `${line.sku} · ` : ''}{line.unit}</p></td>
                  <td className="px-3 py-2.5 text-slate-600">{formatMoney(line.unitPrice, store.currency)}</td>
                  <td className="px-3 py-2.5"><input className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-xs" type="number" min="0.001" step="any" value={line.quantity || ''} placeholder="0" aria-label={`Quantity of ${line.name}`} onChange={(event) => updateLine(line.id, Math.max(0, Number(event.target.value)))} /></td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{formatMoney(line.quantity * line.unitPrice, store.currency)}</td>
                  <td className="px-2 py-2.5"><button type="button" className="rounded-md inline-flex min-h-10 min-w-10 items-center justify-center p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Remove ${line.name} from bill`} onClick={() => removeLine(line.id)}><X className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
              {!invoice.lines.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Add items from inventory to build this bill.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className={labelClass}>Bill number
            <input className={fieldClass} value={invoice.number} onChange={(event) => updateInvoice('number', event.target.value)} />
          </label>
          <label className={labelClass}>Bill date
            <input className={fieldClass} type="date" value={invoice.date} onChange={(event) => updateInvoice('date', event.target.value)} />
          </label>
          <label className={labelClass}>Customer name
            <input className={fieldClass} value={invoice.customerName} onChange={(event) => updateInvoice('customerName', event.target.value)} placeholder="Walk-in customer" />
          </label>
          <label className={labelClass}>Customer contact
            <input className={fieldClass} value={invoice.customerContact} onChange={(event) => updateInvoice('customerContact', event.target.value)} placeholder="Phone or email" />
          </label>
        </div>
        <details lang={i18n.language} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 print:hidden">
          <summary className="cursor-pointer text-sm font-bold text-amber-950">
            {t('posBill.taxSummary', { primary: store.taxRate, additional: store.additionalTaxRate, charge: formatMoney(store.chargeAmount, store.currency) })}
            <span className="mt-1 block text-xs font-normal text-amber-800">{t(`posPage.fields.${store.taxMode}`)} · {t('posBill.editTaxes')}</span>
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{t('posBill.taxHint')}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>{t('posPage.fields.taxRate')}
              <input className={fieldClass} type="number" min="0" max="100" step="0.01" value={store.taxRate || ''} placeholder="0" onChange={(event) => updateBillingSetting('taxRate', Math.min(100, Math.max(0, Number(event.target.value))))} />
            </label>
            <label className={labelClass}>{t('posPage.fields.additionalRate')}
              <input className={fieldClass} type="number" min="0" max="100" step="0.01" value={store.additionalTaxRate || ''} placeholder="0" onChange={(event) => updateBillingSetting('additionalTaxRate', Math.min(100, Math.max(0, Number(event.target.value))))} />
            </label>
            <label className={labelClass}>{t('posPage.fields.chargeAmount', { currency: store.currency })}
              <input className={fieldClass} type="number" min="0" step="0.01" value={store.chargeAmount || ''} placeholder="0" onChange={(event) => updateBillingSetting('chargeAmount', Math.max(0, Number(event.target.value)))} />
            </label>
            <label className={labelClass}>{t('posPage.fields.taxLabel')}
              <input className={fieldClass} value={store.taxLabel} onChange={(event) => updateBillingSetting('taxLabel', event.target.value)} />
            </label>
            <label className={labelClass}>{t('posPage.fields.additionalLabel')}
              <input className={fieldClass} value={store.additionalTaxLabel} onChange={(event) => updateBillingSetting('additionalTaxLabel', event.target.value)} />
            </label>
            <label className={labelClass}>{t('posPage.fields.chargeLabel')}
              <input className={fieldClass} value={store.chargeLabel} onChange={(event) => updateBillingSetting('chargeLabel', event.target.value)} />
            </label>
          </div>
        </details>
        <div className="rounded-2xl bg-stone-800 p-3 shadow-lg sm:p-4 print:bg-transparent print:p-0 print:shadow-none">
        <div lang={i18n.language} className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-100">{t('posBill.preview')}</h3>
          {!editingNote && <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-500 px-2.5 py-2 min-h-10 text-xs font-semibold text-white hover:bg-stone-700" onClick={() => { setNoteDraft(invoice.notes); setEditingNote(true); }}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />{t(invoice.notes ? 'posBill.editNote' : 'posBill.addNote')}
          </button>}
        </div>
        <div ref={invoiceRef} id="pos-invoice-print-area" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 text-slate-800 sm:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row">
            <div>
              <h4 className="text-xl font-extrabold">{store.name}</h4>
              {store.tagline && <p className="mt-1 text-xs text-slate-500">{store.tagline}</p>}
              {store.address && <p className="mt-2 whitespace-pre-line text-xs text-slate-600">{store.address}</p>}
              <p className="mt-1 text-xs text-slate-600">{[store.phone, store.email].filter(Boolean).join(' · ')}</p>
              {store.taxId && <p className="mt-1 text-xs text-slate-600">{store.taxLabel || 'Tax ID'}: {store.taxId}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Bill</p>
              <p className="mt-1 text-sm font-bold">{invoice.number}</p>
              <p className="mt-1 text-xs text-slate-500">{invoice.date}</p>
            </div>
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-500">BILL TO</p>
            <p className="mt-1 font-semibold">{invoice.customerName || 'Walk-in customer'}</p>
            {invoice.customerContact && <p className="mt-0.5 text-slate-600">{invoice.customerContact}</p>}
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-3 py-2">Description</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {totals.lines.map(({ line, gross }) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2.5">{line.name}{line.sku && <span className="ml-1 text-[10px] text-slate-500">({line.sku})</span>}</td>
                    <td className="px-3 py-2.5 text-right">{line.quantity} {line.unit}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(line.unitPrice, store.currency)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{formatMoney(gross, store.currency)}</td>
                  </tr>
                ))}
                {!totals.lines.length && <tr><td colSpan={4} className="px-3 py-7 text-center text-slate-400">No items added</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="ml-auto w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between gap-4"><span className="text-slate-500">Subtotal</span><span>{formatMoney(totals.subtotal, store.currency)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500">{store.taxLabel || 'Tax'} ({store.taxRate}%){store.taxMode === 'inclusive' ? ' included' : ''}</span><span>{formatMoney(totals.tax, store.currency)}</span></div>
            {store.additionalTaxRate > 0 && <div className="flex justify-between gap-4"><span className="text-slate-500">{store.additionalTaxLabel || 'Additional tax'} ({store.additionalTaxRate}%){store.taxMode === 'inclusive' ? ' included' : ''}</span><span>{formatMoney(totals.additionalTax, store.currency)}</span></div>}
            {totals.charge > 0 && <div className="flex justify-between gap-4"><span className="text-slate-500">{store.chargeLabel || 'Other charge'}</span><span>{formatMoney(totals.charge, store.currency)}</span></div>}
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-sm font-extrabold"><span>Total</span><span>{formatMoney(totals.total, store.currency)}</span></div>
          </div>
          {invoice.notes && <div className="border-t border-slate-200 pt-3 text-xs"><p className="font-bold">Note</p><p className="mt-1 whitespace-pre-line text-slate-600">{invoice.notes}</p></div>}
          <p className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400">Created locally with MyDailyUtils POS & Bill Studio</p>
        </div>
        {editingNote && (
          <div lang={i18n.language} className="mt-3 space-y-2 rounded-xl bg-white p-3 print:hidden">
            <label htmlFor="pos-bill-note" className={labelClass}>{t('posBill.note')}</label>
            <textarea id="pos-bill-note" autoFocus className={fieldClass} rows={2} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder={t('posBill.notePlaceholder')} />
            <p className="text-xs text-stone-600">{t('posBill.noteHint')}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primaryButtonClass} onClick={() => { updateInvoice('notes', noteDraft); setEditingNote(false); }}>{t('posBill.noteSave')}</button>
              <button type="button" className={secondaryButtonClass} onClick={() => setEditingNote(false)}>{t('posBill.noteCancel')}</button>
            </div>
          </div>
        )}
        </div>
        <div lang={i18n.language} className="grid gap-3 sm:grid-cols-2 print:hidden">
          <div className="min-w-0 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <h3 className="text-sm font-bold text-stone-900">{t('posBill.shareTitle')}</h3>
            <p className="mt-1 text-xs text-stone-600">{t('posBill.shareDescription')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={shareButtonClass} onClick={() => window.print()} disabled={editingNote}><Printer className="h-3.5 w-3.5" />{t('posBill.print')}</button>
              <button type="button" className={shareButtonClass} onClick={() => void exportImage()} disabled={isExportingImage || editingNote}>
                <FileImage className="h-3.5 w-3.5" />{t(isExportingImage ? 'posBill.preparing' : 'posBill.image')}
              </button>
            </div>
          </div>
          <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <h3 className="text-sm font-bold text-stone-900">{t('posBill.backupTitle')}</h3>
            <p className="mt-1 text-xs text-stone-600">{t('posBill.backupDescription')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={backupButtonClass} onClick={() => downloadWorkspace()} disabled={editingNote}><Save className="h-3.5 w-3.5" />{t('posBill.saveJson')}</button>
              <button type="button" className={backupButtonClass} onClick={startNewInvoice} disabled={editingNote}><FilePlus2 className="h-3.5 w-3.5" />{t('posBill.saveNext')}</button>
            </div>
          </div>
        </div>
    </section>
  );
};
