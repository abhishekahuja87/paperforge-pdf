import React, { useDeferredValue, useMemo, useState } from 'react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { TableInput, type TableValue } from '../shared/TableInput';
import { buildInvoice, SAMPLE_CUSTOMERS, SAMPLE_ITEMS, type InvoiceCustomer, type InvoiceItem, type TaxLine } from '../../../lib/workbooks/invoice';
import { parseAmount } from '../../../lib/workbooks/dates';
import ui from '../../../locales/packs/workbooks.ui.en.json';
import ex from '../../../locales/packs/workbooks.examples.en.json';
import { BookPreview, ContentPanel, FilePanel, RegionPanel, TextField, usePersisted, useRegion } from './shared';

type StarterId = keyof typeof ex.invoice.starters;
const STARTERS = Object.keys(ex.invoice.starters) as StarterId[];
interface Saved { starter: StarterId; name: string; address: string; contact: string; taxId: string; title: string; invoiceNo: string; taxLabels: string[]; taxRates: string[]; lines: number; discount: boolean; roundOff: boolean; notes: string; sample: boolean; hinglish: boolean }
const DEFAULTS: Saved = { starter: 'freelance', name: '', address: '', contact: '', taxId: '', title: 'INVOICE', invoiceNo: 'INV-0001', taxLabels: ['', '', ''], taxRates: ['', '', ''], lines: 10, discount: true, roundOff: false, notes: ex.invoice.starters.freelance.notes, sample: false, hinglish: false };
const MAX_LIST = 200;
const t = ui.invoice;
const ITEM_FIELDS = [
  { key: 'name', label: t.fieldItem, aliases: ['product', 'service', 'name', 'item name'], required: true },
  { key: 'description', label: t.fieldDescription, aliases: ['details', 'note'] },
  { key: 'price', label: t.fieldPrice, aliases: ['rate', 'unit price', 'mrp', 'cost', 'amount'] },
];
const CUSTOMER_FIELDS = [
  { key: 'name', label: t.fieldCustomer, aliases: ['client', 'customer name', 'party', 'company'], required: true },
  { key: 'address', label: t.fieldAddress, aliases: ['billing address', 'location', 'city'] },
  { key: 'phone', label: t.fieldPhone, aliases: ['mobile', 'contact', 'tel', 'telephone'] },
];
const cellOf = (m: Record<string, number>, r: string[], key: string) => (m[key] !== undefined && m[key]! >= 0 ? (r[m[key]!] ?? '').trim() : '');

/** Invoice Excel maker: a printable invoice that fills prices and addresses from your lists. Runs in the browser. */
export const InvoiceWorkbook: React.FC = () => {
  const [saved, change, reset] = usePersisted<Saved>('mdu_wb_invoice_v1', DEFAULTS);
  const [region, setPreset, patchRegion] = useRegion();
  const [itemsTable, setItemsTable] = useState<TableValue | null>(null);
  const [customersTable, setCustomersTable] = useState<TableValue | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const starter = ex.invoice.starters[saved.starter] ?? ex.invoice.starters.freelance;

  const items = useMemo<InvoiceItem[]>(() => (itemsTable ? itemsTable.rows.map((r) => ({ name: cellOf(itemsTable.mapping, r, 'name'), description: cellOf(itemsTable.mapping, r, 'description'), price: parseAmount(cellOf(itemsTable.mapping, r, 'price')) })).filter((x) => x.name) : []), [itemsTable]);
  const customers = useMemo<InvoiceCustomer[]>(() => (customersTable ? customersTable.rows.map((r) => ({ name: cellOf(customersTable.mapping, r, 'name'), address: cellOf(customersTable.mapping, r, 'address'), phone: cellOf(customersTable.mapping, r, 'phone') })).filter((x) => x.name) : []), [customersTable]);
  const hasList = items.length > 0 || customers.length > 0;

  const taxes = (sample: boolean): TaxLine[] => {
    const out = saved.taxLabels.map((label, i) => ({ label: label.trim(), rate: saved.taxRates[i]!.trim() === '' ? null : Math.max(0, Math.min(100, Number(saved.taxRates[i]!.replace(',', '.')) || 0)) / 100 }));
    if (sample && !out.some((x) => x.rate !== null)) out[0] = { label: region.tax, rate: 0.1 };
    return out;
  };
  const make = (forceSample: boolean) => {
    const sample = !hasList && (saved.sample || forceSample);
    return buildInvoice({
      seller: sample && !saved.name ? { name: ui.invoice.sampleSeller, address: ui.invoice.sampleAddress, contact: ui.invoice.sampleContact, taxId: '' } : { name: saved.name, address: saved.address, contact: saved.contact, taxId: saved.taxId },
      title: saved.title, invoiceNo: saved.invoiceNo, taxes: taxes(sample), items: items.length ? items.slice(0, MAX_LIST) : sample ? SAMPLE_ITEMS : [], customers: customers.length ? customers.slice(0, MAX_LIST) : sample ? SAMPLE_CUSTOMERS : [],
      lines: saved.lines, discountColumn: saved.discount, roundOff: saved.roundOff, notes: saved.notes, sample, region, hinglish: saved.hinglish,
    });
  };
  const deferred = useDeferredValue({ saved, region, items, customers, forceSample: !hasList && !saved.sample });
  const previewBook = useMemo(() => make(deferred.forceSample), [deferred.saved, deferred.region, deferred.items, deferred.customers]); // eslint-disable-line react-hooks/exhaustive-deps
  const version = JSON.stringify([saved, region, items.length, customers.length]);
  const startAgain = () => { reset(); setItemsTable(null); setCustomersTable(null); setResetKey((k) => k + 1); };
  const setTax = (i: number, key: 'taxLabels' | 'taxRates', v: string) => change({ [key]: saved[key].map((x, k) => (k === i ? v : x)) } as Partial<Saved>);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{t.starters}</p>
          <ChoiceButtons label={t.starters} value={saved.starter} onChange={(v) => { const s = ex.invoice.starters[v as StarterId]; change({ starter: v as StarterId, title: s.title, discount: s.discount, lines: s.lines, notes: s.notes }); }} options={STARTERS.map((id) => ({ value: id, label: ex.invoice.starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{starter.hint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.you}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label={t.name} value={saved.name} onChange={(v) => change({ name: v })} placeholder={t.sampleSeller} max={70} />
          <TextField label={t.contact} value={saved.contact} onChange={(v) => change({ contact: v })} placeholder={t.sampleContact} max={90} />
          <TextField label={t.address} value={saved.address} onChange={(v) => change({ address: v })} placeholder={t.sampleAddress} max={140} />
          <TextField label={t.taxId} value={saved.taxId} onChange={(v) => change({ taxId: v })} placeholder={t.taxIdPlaceholder} max={60} hint={t.taxIdHint} />
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.taxes}</h2>
        <p className="text-[11px] text-slate-500">{t.taxesHint}</p>
        <div className="space-y-2">{[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><TextField label={`${t.taxName} ${i + 1}`} value={saved.taxLabels[i]!} onChange={(v) => setTax(i, 'taxLabels', v)} placeholder={i === 0 ? region.tax : ''} max={24} /></div>
            <TextField label={t.taxRate} value={saved.taxRates[i]!} onChange={(v) => setTax(i, 'taxRates', v.replace(/[^\d.,]/g, ''))} placeholder="%" max={6} />
          </div>))}</div>
        <Note>{t.taxNote}</Note>
        <details className="rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.moreOptions}</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label={t.docTitle} value={saved.title} onChange={(v) => change({ title: v })} max={24} />
            <TextField label={t.numberStart} value={saved.invoiceNo} onChange={(v) => change({ invoiceNo: v })} max={24} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{t.lines}</p>
              <ChoiceButtons label={t.lines} value={String(saved.lines)} onChange={(v) => change({ lines: Number(v) })} options={[10, 15, 25, 40].map((n) => ({ value: String(n), label: String(n) }))} /></div>
            <div className="space-y-2"><Toggle label={t.discount} checked={saved.discount} onChange={(v) => change({ discount: v })} /><Toggle label={t.roundOff} hint={t.roundOffHint} checked={saved.roundOff} onChange={(v) => change({ roundOff: v })} /></div>
          </div>
          <div className="mt-3"><TextField label={t.notes} value={saved.notes} onChange={(v) => change({ notes: v })} max={400} multiline={3} /></div>
        </details>
      </section>

      <RegionPanel region={region} onPreset={setPreset} onPatch={patchRegion} tax />

      <details className="rounded-2xl border border-slate-200 bg-white p-3" open={false}>
        <summary className="cursor-pointer text-sm font-bold text-slate-900">{t.itemsList}</summary>
        <div className="mt-3"><TableInput key={`i${resetKey}`} name="items" sampleHeaders={ex.invoice.itemHeaders} sampleRows={ex.invoice.itemRows} fields={ITEM_FIELDS} intro={t.itemsIntro} onChange={setItemsTable} /></div>
      </details>
      <details className="rounded-2xl border border-slate-200 bg-white p-3" open={false}>
        <summary className="cursor-pointer text-sm font-bold text-slate-900">{t.customersList}</summary>
        <div className="mt-3"><TableInput key={`c${resetKey}`} name="customers" sampleHeaders={ex.invoice.customerHeaders} sampleRows={ex.invoice.customerRows} fields={CUSTOMER_FIELDS} intro={t.customersIntro} onChange={setCustomersTable} /></div>
      </details>
      {(items.length > MAX_LIST || customers.length > MAX_LIST) && <Note>{t.tooMany.replace('{n}', String(MAX_LIST))}</Note>}

      <ContentPanel sample={saved.sample} onSample={(v) => change({ sample: v })} hinglish={saved.hinglish} onHinglish={(v) => change({ hinglish: v })} hasList={hasList} />
      <BookPreview book={previewBook} region={region} note={hasList || saved.sample ? t.previewYours : t.previewSample} />
      <FilePanel getBook={() => make(false)} base="invoice" version={version} onStartAgain={startAgain} blank={!hasList && !saved.sample} />
    </div>
  );
};

export default InvoiceWorkbook;
