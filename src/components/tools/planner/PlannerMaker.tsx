import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer, RotateCcw } from 'lucide-react';
import { Note, SelectField } from '../../finance/ui';
import { ChoiceButtons, DateField, fieldClass } from '../utilities/common';
import { buildPdfFromSheets } from '../../../lib/paper/pdf';
import { PAGE_SIZES, TONES, WEIGHTS, type PageSizeId, type ToneId, type Weight } from '../../../lib/paper/types';
import { buildPlannerPages } from '../../../lib/planner/layout';
import { monthName } from '../../../lib/planner/dates';
import { KINDS, LOCALES, MAX_COUNT, defaultPlanner, type PlannerKind, type PlannerSettings } from '../../../lib/planner/types';
import { Slider, Toggle, card, heading } from '../paper/controls';
import { SheetPreview } from '../paper/SheetPreview';
import { generateFileName } from '../../../lib/pdf/naming';

const clampInt = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));

export const PlannerMaker: React.FC<{ initialKind?: PlannerKind }> = ({ initialKind }) => {
  const make = (): PlannerSettings => ({ ...defaultPlanner(), kind: initialKind ?? 'month' });
  const [settings, setSettings] = useState<PlannerSettings>(make);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const update = (patch: Partial<PlannerSettings>) => { setSettings((current) => ({ ...current, ...patch })); setIndex(0); };

  const pages = useMemo(() => buildPlannerPages(settings), [settings]);
  const current = pages[Math.min(index, pages.length - 1)];
  const maxCount = MAX_COUNT[settings.kind];
  const countLabel = settings.kind === 'month' ? 'months' : settings.kind === 'week' ? 'weeks' : settings.kind === 'day' ? 'days' : 'pages';

  const download = async () => {
    setBusy(true);
    setMessage('');
    try {
      const bytes = await buildPdfFromSheets(pages, `${settings.kind} planner`);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName('planner', 'pdf', { details: `${settings.kind}-${settings.kind === 'month' ? `${settings.year}-${String(settings.month).padStart(2, '0')}` : settings.kind === 'year' ? settings.year : settings.startDate}` });
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setMessage('Could not build the PDF. Try fewer pages and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto min-w-0">
      <style>{`@media print { body * { visibility: hidden !important; } #planner-print, #planner-print * { visibility: visible !important; } #planner-print { position: fixed; left: 0; top: 0; width: ${current.width}mm !important; height: ${current.height}mm !important; box-shadow: none !important; border: 0 !important; } #planner-print svg { width: ${current.width}mm !important; height: ${current.height}mm !important; max-height: none !important; } @page { size: ${current.width}mm ${current.height}mm; margin: 0; } }`}</style>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] print:hidden">
        <div className="order-2 space-y-4 lg:order-1">
          <div className={card}>
            <h2 className={heading}>1. What to make</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {KINDS.map((item) => (
                <button key={item.id} type="button" aria-pressed={settings.kind === item.id} onClick={() => update({ kind: item.id, count: 1 })} className={`rounded-lg border px-3 py-2 text-left ${settings.kind === item.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                  <span className="block text-[11px] text-slate-500">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>2. Dates</h2>
            <div className="mt-3 space-y-3">
              {(settings.kind === 'month' || settings.kind === 'year') && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-700">Year
                    <input type="number" inputMode="numeric" min={1900} max={2200} value={settings.year} onChange={(event) => update({ year: clampInt(Number(event.target.value), 1900, 2200) })} className={fieldClass} />
                  </label>
                  {settings.kind === 'month' && (
                    <SelectField label="Starting month" value={String(settings.month)} onChange={(value) => update({ month: Number(value) })} options={Array.from({ length: 12 }, (_, m) => ({ value: String(m + 1), label: monthName(2026, m + 1, settings.locale) }))} />
                  )}
                </div>
              )}
              {(settings.kind === 'week' || settings.kind === 'day') && <DateField label={settings.kind === 'week' ? 'Any date in the first week' : 'First day'} value={settings.startDate} onChange={(startDate) => update({ startDate })} />}
              {settings.kind !== 'year' && <Slider label={`How many ${countLabel}`} value={Math.min(settings.count, maxCount)} min={1} max={maxCount} step={1} unit="" onChange={(count) => update({ count })} />}
              {settings.kind === 'month' && <p className="text-[11px] text-slate-500">Choose 12 to make a whole year of monthly pages in one PDF.</p>}
              <SelectField label="Week starts on" value={String(settings.weekStart)} onChange={(value) => update({ weekStart: Number(value) as 0 | 1 | 6 })} options={[{ value: '1', label: 'Monday' }, { value: '0', label: 'Sunday' }, { value: '6', label: 'Saturday' }]} />
              <SelectField label="Language for month and day names" value={settings.locale} onChange={(locale) => update({ locale })} options={LOCALES.map((item) => ({ value: item.id, label: item.label }))} />
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>3. Layout</h2>
            <div className="mt-3 space-y-3">
              <SelectField label="Page size" value={settings.page} onChange={(page) => update({ page: page as PageSizeId })} options={Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label }))} />
              <ChoiceButtons label="Orientation" value={settings.landscape ? 'landscape' : 'portrait'} onChange={(value) => update({ landscape: value === 'landscape' })} options={[{ value: 'landscape', label: 'Landscape' }, { value: 'portrait', label: 'Portrait' }]} />
              <Slider label="Margin" value={settings.margin} min={4} max={30} step={1} onChange={(margin) => update({ margin })} />
              {settings.margin < 5 && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">Many home printers cannot print closer than about 5 mm to the edge. Use 5 mm or more to be safe.</p>}
              <label className="block text-xs font-semibold text-slate-700">Heading on each page (optional)
                <input type="text" maxLength={40} value={settings.title} placeholder="Your name or project" onChange={(event) => update({ title: event.target.value })} className={fieldClass} />
              </label>
              {settings.kind === 'month' && <Toggle label="Notes lines under the calendar" checked={settings.notes} onChange={(notes) => update({ notes })} />}
              {settings.kind === 'day' && (
                <>
                  <Slider label="Schedule starts at" value={settings.hours.from} min={0} max={20} step={1} unit=":00" onChange={(from) => update({ hours: { ...settings.hours, from, to: Math.max(settings.hours.to, from + 2) } })} />
                  <Slider label="Schedule ends at" value={settings.hours.to} min={2} max={24} step={1} unit=":00" onChange={(to) => update({ hours: { ...settings.hours, to, from: Math.min(settings.hours.from, to - 2) } })} />
                  <ChoiceButtons label="Time slots" value={String(settings.hours.step)} onChange={(value) => update({ hours: { ...settings.hours, step: value === '30' ? 30 : 60 } })} options={[{ value: '60', label: 'Every hour' }, { value: '30', label: 'Every 30 minutes' }]} />
                </>
              )}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>4. Ink and lines</h2>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(Object.entries(TONES) as [ToneId, { label: string; color: string }][]).map(([id, tone]) => (
                  <button key={id} type="button" aria-pressed={settings.tone === id} onClick={() => update({ tone: id })} className={`flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${settings.tone === id ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>
                    <span className="h-3 w-3 rounded-full" style={{ background: tone.color }} aria-hidden="true" />{tone.label}
                  </button>
                ))}
              </div>
              <ChoiceButtons label="Line weight" value={settings.weight} onChange={(value) => update({ weight: value as Weight })} options={(Object.entries(WEIGHTS) as [Weight, { label: string }][]).map(([value, item]) => ({ value, label: item.label }))} />
            </div>
          </div>
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
            <div id="planner-print" className="mx-auto w-full max-w-3xl rounded-md border border-slate-300 bg-white shadow-sm">
              <SheetPreview sheet={current} id="planner-svg" pageLabel={null} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void download()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Building...' : `Download PDF${pages.length > 1 ? ` (${pages.length} pages)` : ''}`}</button>
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Printer className="h-4 w-4" aria-hidden="true" />Print this page</button>
              <button type="button" onClick={() => { setSettings(make()); setIndex(0); setMessage(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</button>
            </div>
            {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
            <p className="text-[11px] text-slate-500">Print uses the page shown, at 100% scale. To print several pages, download the PDF and print it with "Actual size".</p>
          </div>
        </div>
      </div>
      <div className="print:hidden"><Note>Dates are worked out in your browser and nothing is uploaded. Public holidays and school terms differ by country and year, so they are not printed; write them in by hand. Month and day names appear in the language you choose, for languages that use the Latin alphabet.</Note></div>
    </section>
  );
};

export default PlannerMaker;
