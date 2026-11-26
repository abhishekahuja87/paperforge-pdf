import React, { useDeferredValue, useMemo, useState } from 'react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { TableInput, type TableValue } from '../shared/TableInput';
import { buildBilling, SAMPLE_CUSTOMERS, type BillingCustomer } from '../../../lib/workbooks/billing';
import { parseAmount } from '../../../lib/workbooks/dates';
import { labels } from '../../../lib/workbooks/common';
import ui from '../../../locales/packs/workbooks.ui.en.json';
import ex from '../../../locales/packs/workbooks.examples.en.json';
import { BookPreview, ContentPanel, FilePanel, NumberField, RegionPanel, TextField, inputClass, usePersisted, useRegion } from './shared';

type StarterId = keyof typeof ex.billing.starters;
const STARTERS = Object.keys(ex.billing.starters) as StarterId[];
interface Saved { starter: StarterId; business: string; product: string; unit: string; month: number; year: number; prefill: boolean; spare: number; defaultRate: string; defaultQty: string; message: string; sample: boolean; hinglish: boolean }
const now = new Date();
const DEFAULTS: Saved = { starter: 'milk', business: '', product: 'Milk', unit: 'litre', month: now.getMonth() + 1, year: now.getFullYear(), prefill: true, spare: 15, defaultRate: '', defaultQty: '1', message: ui.billing.defaultMessage, sample: false, hinglish: false };
const MAX_CUSTOMERS = 300;
const t = ui.billing;
const FIELDS = [
  { key: 'name', label: t.fieldName, aliases: ['customer', 'customer name', 'client', 'party'], required: true },
  { key: 'phone', label: t.fieldPhone, aliases: ['mobile', 'whatsapp', 'contact', 'phone number', 'tel'] },
  { key: 'rate', label: t.fieldRate, aliases: ['price', 'price per unit', 'rate per litre', 'cost'] },
  { key: 'qty', label: t.fieldQty, aliases: ['quantity', 'usual quantity', 'daily', 'per day', 'usual per day'] },
  { key: 'opening', label: t.fieldOpening, aliases: ['balance', 'previous balance', 'due', 'pending', 'old balance'] },
  { key: 'address', label: t.fieldAddress, aliases: ['flat', 'house', 'location', 'note', 'notes'] },
];

/** Monthly delivery bill Excel maker for milk, tiffin, newspapers and water cans. Runs in the browser. */
export const BillingWorkbook: React.FC = () => {
  const [saved, change, reset] = usePersisted<Saved>('mdu_wb_billing_v1', DEFAULTS);
  const [region, setPreset, patchRegion] = useRegion();
  const [table, setTable] = useState<TableValue | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const starter = ex.billing.starters[saved.starter] ?? ex.billing.starters.milk;
  const dRate = parseAmount(saved.defaultRate), dQty = parseAmount(saved.defaultQty);

  const customers = useMemo<BillingCustomer[]>(() => {
    if (!table) return [];
    const m = table.mapping, cell = (r: string[], key: string) => (m[key] !== undefined && m[key]! >= 0 ? (r[m[key]!] ?? '').trim() : '');
    return table.rows.map((r) => ({ name: cell(r, 'name'), phone: cell(r, 'phone').replace(/[^\d+]/g, ''), rate: parseAmount(cell(r, 'rate')) ?? dRate, qty: parseAmount(cell(r, 'qty')) ?? dQty, opening: parseAmount(cell(r, 'opening')) ?? 0, address: cell(r, 'address') })).filter((c) => c.name);
  }, [table, dRate, dQty]);
  const useList = customers.length > 0;
  const noRate = useList && customers.some((c) => c.rate === null);

  const make = (forceSample: boolean) => {
    const sample = !useList && (saved.sample || forceSample);
    return buildBilling({ business: saved.business, product: saved.product, unit: saved.unit, customers: useList ? customers.slice(0, MAX_CUSTOMERS) : sample ? SAMPLE_CUSTOMERS : [], year: saved.year, month: saved.month, prefill: saved.prefill, spareRows: saved.spare, message: saved.message, sample, region, hinglish: saved.hinglish });
  };
  const deferred = useDeferredValue({ saved, region, customers, forceSample: !useList && !saved.sample });
  const previewBook = useMemo(() => make(deferred.forceSample), [deferred.saved, deferred.region, deferred.customers]); // eslint-disable-line react-hooks/exhaustive-deps
  const version = JSON.stringify([saved, region, customers.length, customers[0]?.name]);
  const startAgain = () => { reset(); setTable(null); setResetKey((k) => k + 1); };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{t.starters}</p>
          <ChoiceButtons label={t.starters} value={saved.starter} onChange={(v) => { const s = ex.billing.starters[v as StarterId]; change({ starter: v as StarterId, product: s.product, unit: s.unit, defaultQty: String(s.qty) }); }} options={STARTERS.map((id) => ({ value: id, label: ex.billing.starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{starter.hint}</p></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label={t.business} value={saved.business} onChange={(v) => change({ business: v })} placeholder={t.businessPlaceholder} max={70} />
          <TextField label={t.product} value={saved.product} onChange={(v) => change({ product: v })} max={40} />
          <TextField label={t.unit} value={saved.unit} onChange={(v) => change({ unit: v })} max={20} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">{t.month}
            <select value={saved.month} onChange={(e) => change({ month: Number(e.target.value) })} className={inputClass}>{labels.common.months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
          <NumberField label={t.year} value={saved.year} onChange={(v) => change({ year: v })} min={2000} max={2100} />
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{t.usual}</h2>
        <p className="text-[11px] text-slate-500">{t.usualHint}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label={t.defaultRate} value={saved.defaultRate} onChange={(v) => change({ defaultRate: v.replace(/[^\d.,]/g, '') })} max={10} hint={t.defaultRateHint} />
          <TextField label={t.defaultQty} value={saved.defaultQty} onChange={(v) => change({ defaultQty: v.replace(/[^\d.,]/g, '') })} max={10} hint={t.defaultQtyHint} />
        </div>
        <Toggle label={t.prefill} hint={t.prefillHint} checked={saved.prefill} onChange={(v) => change({ prefill: v })} />
        <details className="rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.moreOptions}</summary>
          <div className="mt-3 space-y-3">
            <NumberField label={t.spare} value={saved.spare} onChange={(v) => change({ spare: v })} min={0} max={100} hint={t.spareHint} />
            <TextField label={t.message} value={saved.message} onChange={(v) => change({ message: v })} max={400} multiline={3} hint={t.messageHint} />
          </div>
        </details>
      </section>

      <RegionPanel region={region} onPreset={setPreset} onPatch={patchRegion} code word />

      <TableInput key={resetKey} name="customers" sampleHeaders={ex.billing.sampleHeaders} sampleRows={ex.billing.sampleRows} fields={FIELDS} intro={t.listIntro} onChange={setTable} />
      {noRate && <Note>{t.noRate}</Note>}
      {table && customers.length > MAX_CUSTOMERS && <Note>{t.tooMany.replace('{n}', String(MAX_CUSTOMERS))}</Note>}

      <ContentPanel sample={saved.sample} onSample={(v) => change({ sample: v })} hinglish={saved.hinglish} onHinglish={(v) => change({ hinglish: v })} hasList={useList} />
      <BookPreview book={previewBook} region={region} note={useList || saved.sample ? t.previewYours : t.previewSample} />
      <FilePanel getBook={() => make(false)} base="delivery-bill" version={version} onStartAgain={startAgain} blank={!useList && !saved.sample} />
    </div>
  );
};

export default BillingWorkbook;
