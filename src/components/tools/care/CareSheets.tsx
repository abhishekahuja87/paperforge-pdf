import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { Note, SelectField } from '../../common/CalcKit';
import { ChoiceButtons, DateField, fieldClass } from '../../common/FieldKit';
import { buildPdfFromSheets } from '../../../lib/paper/pdf';
import { PAGE_SIZES, WEIGHTS, type PageSizeId, type Weight } from '../../../lib/paper/types';
import { buildCarePages } from '../../../lib/care/layout';
import {
  FOOD_NOTES, KINDS, LOG_COLUMNS, MAX_AMOUNT, MAX_DAYS, MAX_LOG_PAGES, MAX_MEDICINES, MAX_NAME, MAX_STRENGTH, MAX_TEXT, MAX_WEEKS, SLOTS,
  defaultCare, emptyMedicine, type CareKind, type CareSettings, type FoodNote, type LogColumn, type MedicineRow, type Slot,
} from '../../../lib/care/types';
import { Slider, Toggle, card, heading } from '../../common/PanelKit';
import { StylePicker } from '../paper/StylePicker';
import { SheetPreview } from '../paper/SheetPreview';
import { generateFileName } from '../../../lib/pdf/naming';
import { pdfBlob } from '../../../lib/pdf/toBlob';
import { saveBlob } from '../../../lib/images/canvas';
import { toFile } from '../../../lib/share/shareFile';
import { ShareFileButton, shareFileLargeClass } from '../../common/ShareFileButton';
import { PrintCreditToggle } from '../../common/PrintCredit';
import { printAs } from '../../../lib/pdf/printName';

/** The address each sheet opens on. */
const KIND_PAGES: Record<CareKind, string> = {
  medicine: '/medicine-schedule-chart-printable',
  log: '/health-log-sheet-printable',
  emergency: '/emergency-info-card-printable',
  visit: '/doctor-visit-sheet-printable',
  caregiver: '/caregiver-daily-log-printable',
};

/** What a page change carries over, so picking another sheet keeps the name, doctor, medicines and paper already chosen. */
type Carry = Pick<CareSettings, 'kind' | 'page' | 'landscape' | 'margin' | 'tone' | 'theme' | 'font' | 'weight' | 'person' | 'doctor' | 'large' | 'medicines' | 'blood' | 'allergies' | 'conditions' | 'takes' | 'contact1' | 'contact2'>;

const limit = (value: string, max: number) => value.slice(0, max);

/** Printable health and care sheets. Each sheet has its own address; the buttons are links to them. Everything is typed and printed in the browser. */
export const CareSheets: React.FC<{ initialKind?: CareKind }> = ({ initialKind }) => {
  const location = useLocation();
  const make = (): CareSettings => {
    const carry = (location.state as { carry?: Carry } | null)?.carry;
    return { ...defaultCare(), ...carry, kind: carry?.kind ?? initialKind ?? 'medicine' };
  };
  const [settings, setSettings] = useState<CareSettings>(make);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const update = (patch: Partial<CareSettings>) => { setSettings((current) => ({ ...current, ...patch })); setIndex(0); };

  const pages = useMemo(() => buildCarePages(settings), [settings]);
  const current = pages[Math.min(index, pages.length - 1)];
  const s = settings;

  const setMedicine = (row: number, patch: Partial<MedicineRow>) => update({ medicines: s.medicines.map((m, i) => (i === row ? { ...m, ...patch } : m)) });
  const setAmount = (row: number, slot: Slot, value: string) => setMedicine(row, { amounts: { ...s.medicines[row]!.amounts, [slot]: limit(value, MAX_AMOUNT) } });
  const toggleColumn = (id: LogColumn) => {
    const on = s.logColumns.includes(id);
    if (on && s.logColumns.length === 1) return;
    update({ logColumns: LOG_COLUMNS.map((col) => col.id).filter((col) => (col === id ? !on : s.logColumns.includes(col))) });
  };
  const toggleSection = (key: keyof CareSettings['visitSections']) => update({ visitSections: { ...s.visitSections, [key]: !s.visitSections[key] } });

  /** Builds the PDF and its file name; Save and Share both use it, so they always give the same file. */
  const makePdf = async (): Promise<{ blob: Blob; name: string }> => ({ blob: pdfBlob(await buildPdfFromSheets(pages, `${s.kind} sheet`)), name: generateFileName('health-sheet', 'pdf', { details: s.kind }) });

  const download = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { blob, name } = await makePdf();
      saveBlob(blob, name);
    } catch {
      setMessage('Could not build the PDF. Try fewer pages and try again.');
    } finally {
      setBusy(false);
    }
  };

  const textField = (label: string, key: 'person' | 'doctor' | 'blood' | 'allergies' | 'conditions' | 'takes' | 'contact1' | 'contact2', placeholder = '') => (
    <label className="block text-xs font-semibold text-slate-700">{label}
      <input type="text" maxLength={MAX_TEXT} value={s[key]} placeholder={placeholder} onChange={(event) => update({ [key]: event.target.value } as Partial<CareSettings>)} className={fieldClass} />
    </label>
  );

  return (
    <section className="mx-auto min-w-0">
      <style>{`@media print { html, body { margin: 0 !important; height: ${current.height}mm !important; max-height: ${current.height}mm !important; overflow: hidden !important; } body * { visibility: hidden !important; } #care-print, #care-print * { visibility: visible !important; } #care-print { position: fixed; left: 0; top: 0; width: ${current.width}mm !important; height: ${current.height}mm !important; box-shadow: none !important; border: 0 !important; } #care-print svg { width: ${current.width}mm !important; height: ${current.height}mm !important; max-height: none !important; } @page { size: ${current.width}mm ${current.height}mm; margin: 0; } }`}</style>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] print:m-0 print:block print:h-0 print:overflow-hidden">
        <div className="order-2 space-y-4 lg:order-1">
          <div className={card}>
            <h2 className={heading}>Which sheet</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {KINDS.map((item) => {
                const target = KIND_PAGES[item.id];
                const carry: Carry = { kind: item.id, page: s.page, landscape: s.landscape, margin: s.margin, tone: s.tone, theme: s.theme, font: s.font, weight: s.weight, person: s.person, doctor: s.doctor, large: s.large, medicines: s.medicines, blood: s.blood, allergies: s.allergies, conditions: s.conditions, takes: s.takes, contact1: s.contact1, contact2: s.contact2 };
                return (
                  <Link
                    key={item.id}
                    to={target}
                    state={{ carry }}
                    replace
                    aria-current={s.kind === item.id ? 'true' : undefined}
                    onClick={(event) => {
                      // Same address: just switch the sheet here, without reloading the page.
                      if (target === location.pathname) { event.preventDefault(); update({ kind: item.id }); }
                    }}
                    className={`rounded-lg border px-2 py-2 text-left ${s.kind === item.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                    <span className="block text-[11px] text-slate-500">{item.hint}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={`${card} space-y-3`}>
            <h2 className={heading}>Who it is for</h2>
            {textField('Name', 'person', 'e.g. Savitri Devi')}
            {s.kind !== 'log' && s.kind !== 'caregiver' && textField('Doctor or clinic (optional)', 'doctor')}
          </div>

          {s.kind === 'medicine' && (
            <div className={`${card} space-y-3`}>
              <h2 className={heading}>Medicines</h2>
              <p className="text-[11px] text-slate-500">Type what the doctor wrote on the prescription. In each part of the day, write how much to take, such as 1 or 1/2, and leave it empty if not taken then.</p>
              {s.medicines.map((m, row) => (
                <fieldset key={row} className="space-y-2 rounded-lg border border-slate-200 p-2">
                  <legend className="px-1 text-xs font-bold text-slate-800">Medicine {row + 1}</legend>
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,6.5rem)] gap-2">
                    <label className="block text-[11px] font-semibold text-slate-600">Name
                      <input type="text" maxLength={MAX_NAME} value={m.name} onChange={(event) => setMedicine(row, { name: event.target.value })} className={fieldClass} />
                    </label>
                    <label className="block text-[11px] font-semibold text-slate-600">Strength
                      <input type="text" maxLength={MAX_STRENGTH} value={m.strength} placeholder="500 mg" onChange={(event) => setMedicine(row, { strength: event.target.value })} className={fieldClass} />
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {SLOTS.map((slot) => (
                      <label key={slot} className="block text-[11px] font-semibold text-slate-600">{slot}
                        <input type="text" inputMode="text" maxLength={MAX_AMOUNT} value={m.amounts[slot]} onChange={(event) => setAmount(row, slot, event.target.value)} className={fieldClass} />
                      </label>
                    ))}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <SelectField label="Note" value={m.food} onChange={(value) => setMedicine(row, { food: value as FoodNote })} options={FOOD_NOTES.map((item) => ({ value: item.value, label: item.label }))} />
                    </div>
                    {s.medicines.length > 1 && (
                      <button type="button" aria-label={`Remove medicine ${row + 1}`} onClick={() => update({ medicines: s.medicines.filter((_, i) => i !== row) })} className="mb-0.5 inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                    )}
                  </div>
                </fieldset>
              ))}
              {s.medicines.length < MAX_MEDICINES && (
                <button type="button" onClick={() => update({ medicines: [...s.medicines, emptyMedicine()] })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"><Plus className="h-4 w-4" aria-hidden="true" />Add a medicine</button>
              )}
              <Toggle label="Large print" checked={s.large} onChange={(large) => update({ large })} hint="Bigger names and amounts on the plan, easier to read." />
              <Slider label="Weekly tick charts after the plan" value={s.weeks} min={0} max={MAX_WEEKS} step={1} unit="weeks" onChange={(weeks) => update({ weeks })} />
              {s.weeks > 0 && <DateField label="First day of the tick chart" value={s.startDate} onChange={(startDate) => update({ startDate })} />}
            </div>
          )}

          {s.kind === 'log' && (
            <div className={`${card} space-y-3`}>
              <h2 className={heading}>Columns</h2>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Columns to print">
                {LOG_COLUMNS.map((col) => {
                  const on = s.logColumns.includes(col.id);
                  return <button key={col.id} type="button" aria-pressed={on} onClick={() => toggleColumn(col.id)} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{col.label}</button>;
                })}
              </div>
              <Slider label="Rows on each page" value={s.logRows} min={8} max={40} step={1} unit="rows" onChange={(logRows) => update({ logRows })} />
              <Slider label="Pages" value={s.logPages} min={1} max={MAX_LOG_PAGES} step={1} unit="pages" onChange={(logPages) => update({ logPages })} />
              <p className="text-[11px] text-slate-500">The sheet is blank to write in. It has no normal ranges; ask the doctor what values to watch for.</p>
            </div>
          )}

          {s.kind === 'emergency' && (
            <div className={`${card} space-y-3`}>
              <h2 className={heading}>Details on the card</h2>
              <ChoiceButtons label="Print as" value={s.format} onChange={(format) => update({ format: format as 'cards' | 'sheet' })} options={[{ value: 'cards', label: 'Wallet cards (cut out)' }, { value: 'sheet', label: 'One big fridge sheet' }]} />
              {textField('Blood group', 'blood', 'e.g. B positive')}
              {textField('Allergies', 'allergies')}
              {textField('Health conditions', 'conditions')}
              {textField('Medicines taken', 'takes')}
              {textField('Contact 1 (name and phone)', 'contact1')}
              {textField('Contact 2 (name and phone)', 'contact2')}
            </div>
          )}

          {s.kind === 'visit' && (
            <div className={`${card} space-y-3`}>
              <h2 className={heading}>Sections</h2>
              <label className="block text-xs font-semibold text-slate-700">Date of visit (optional)
                <input type="text" maxLength={20} value={s.visitDate} placeholder="25 Nov 2026" onChange={(event) => update({ visitDate: event.target.value })} className={fieldClass} />
              </label>
              <Toggle label="Why I am going" checked={s.visitSections.problem} onChange={() => toggleSection('problem')} />
              <Toggle label="Medicines I take now" checked={s.visitSections.medicines} onChange={() => toggleSection('medicines')} />
              <Toggle label="Allergies" checked={s.visitSections.allergies} onChange={() => toggleSection('allergies')} />
              <Toggle label="Questions to ask" checked={s.visitSections.questions} onChange={() => toggleSection('questions')} />
              <Toggle label="What the doctor said" checked={s.visitSections.notes} onChange={() => toggleSection('notes')} />
              <Toggle label="Tests and next visit" checked={s.visitSections.next} onChange={() => toggleSection('next')} />
              {s.visitSections.questions && <Slider label="Numbered question lines" value={s.questions} min={2} max={14} step={1} unit="lines" onChange={(questions) => update({ questions })} />}
            </div>
          )}

          {s.kind === 'caregiver' && (
            <div className={`${card} space-y-3`}>
              <h2 className={heading}>Days</h2>
              <DateField label="First day" value={s.startDate} onChange={(startDate) => update({ startDate })} />
              <Slider label="How many days (one page each)" value={s.days} min={1} max={MAX_DAYS} step={1} unit="days" onChange={(days) => update({ days })} />
              <Slider label="Parts of the day on each page" value={s.caregiverSlots} min={2} max={6} step={1} unit="parts" onChange={(caregiverSlots) => update({ caregiverSlots })} />
            </div>
          )}

          <details className={card}>
            <summary className="cursor-pointer text-sm font-bold text-slate-900">Adjust everything <span className="font-normal text-slate-500">(paper, ink)</span></summary>
            <div className="mt-4 space-y-5">
              <div className="space-y-3">
                <h2 className={heading}>Paper</h2>
                <SelectField label="Page size" value={s.page} onChange={(page) => update({ page: page as PageSizeId })} options={Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label }))} />
                <ChoiceButtons label="Orientation" value={s.landscape ? 'landscape' : 'portrait'} onChange={(value) => update({ landscape: value === 'landscape' })} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
                <Slider label="Margin" value={s.margin} min={4} max={30} step={1} onChange={(margin) => update({ margin })} />
                {s.margin < 5 && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">Many home printers cannot print closer than about 5 mm to the edge. Use 5 mm or more to be safe.</p>}
              </div>
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h2 className={heading}>Ink and lines</h2>
                <StylePicker value={{ tone: s.tone, theme: s.theme, font: s.font }} onChange={(patch) => update(patch)} />
                <ChoiceButtons label="Line weight" value={s.weight} onChange={(value) => update({ weight: value as Weight })} options={(Object.entries(WEIGHTS) as [Weight, { label: string }][]).map(([value, item]) => ({ value, label: item.label }))} />
              </div>
            </div>
          </details>
        </div>

        <div className="order-1 lg:order-2">
          <div className="sticky top-2 z-10 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:top-4">
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
              <span>Live preview · {Math.round(current.width * 10) / 10} × {Math.round(current.height * 10) / 10} mm</span>
              {pages.length > 1 && (
                <span className="flex items-center gap-1">
                  <button type="button" aria-label="Previous page" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} className="rounded border border-slate-200 bg-white p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
                  <span>Page {Math.min(index, pages.length - 1) + 1} of {pages.length}</span>
                  <button type="button" aria-label="Next page" disabled={index >= pages.length - 1} onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))} className="rounded border border-slate-200 bg-white p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
                </span>
              )}
            </div>
            <div id="care-print" className="mx-auto w-full max-w-3xl rounded-md border border-slate-300 bg-white shadow-sm">
              <SheetPreview sheet={current} id="care-svg" pageLabel={null} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void download()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Building...' : `Download PDF${pages.length > 1 ? ` (${pages.length} pages)` : ''}`}</button>
              <ShareFileButton className={shareFileLargeClass} getFile={async () => { const { blob, name } = await makePdf(); return toFile(blob, name); }} />
              <button type="button" onClick={() => printAs('health-sheet', { details: settings.kind })} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Printer className="h-4 w-4" aria-hidden="true" />Print this page</button><PrintCreditToggle />
              <button type="button" onClick={() => { setSettings(make()); setIndex(0); setMessage(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</button>
            </div>
            {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
            <p className="text-[11px] text-slate-500">Print uses the page shown, at 100% scale. To print several pages, download the PDF and print it with "Actual size".</p>
          </div>
        </div>
      </div>
      <div className="print:hidden"><Note>Health details you type are printed on the sheet. These sheets help you organise; they are not medical advice.</Note></div>
    </section>
  );
};

export default CareSheets;
