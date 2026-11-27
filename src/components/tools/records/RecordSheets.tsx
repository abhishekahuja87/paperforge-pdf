import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Printer, RotateCcw } from 'lucide-react';
import { Note, SelectField } from '../../common/CalcKit';
import { ChoiceButtons, DateField, fieldClass } from '../../common/FieldKit';
import { buildPdfFromSheets } from '../../../lib/paper/pdf';
import type { FontId } from '../../../lib/paper/geometry';
import { PAGE_SIZES, WEIGHTS, type PageSizeId, type ToneId, type Weight } from '../../../lib/paper/types';
import type { ThemeId } from '../../../lib/records/theme';
import type { Logo } from '../../../lib/paper/image';
import { clearProfile, loadProfile, saveProfile } from '../../../lib/records/profile';
import { LogoPicker } from '../paper/LogoPicker';
import { StylePicker } from '../paper/StylePicker';
import type { Common, Family, Field, SheetDef, Values } from '../../../lib/records';
import { MAX_LINE, MAX_TEXT } from '../../../lib/records/types';
import { Slider, Toggle, card, heading } from '../../common/PanelKit';
import { SheetPreview } from '../paper/SheetPreview';
import { generateFileName } from '../../../lib/pdf/naming';

/** What a page change carries over: the paper and ink, the name, and everything typed on each sheet, so picking another sheet keeps it. */
interface Carry { common: Omit<Common, 'landscape'>; valuesById: Record<string, Values> }

/** What a device remembers when the person ticks Remember: loaded once, only when the page was not opened from another sheet. */
const remembered = (familyKey: string): { look?: Partial<Common>; logo?: Logo | null } => {
  const saved = loadProfile();
  if (!saved) return {};
  return { look: { ...saved.look, heading: saved.headings?.[familyKey] ?? '' }, logo: saved.logo ?? null };
};

const startValues = (family: Family): Record<string, Values> => Object.fromEntries(family.sheets.map((sheet) => [sheet.id, { ...sheet.defaults }]));

/** A family of printable record sheets. Each sheet has its own address; the buttons are links to them. Everything is typed and printed in the browser. */
export const RecordSheets: React.FC<{ family: Family; initialId: string }> = ({ family, initialId }) => {
  const location = useLocation();
  const make = () => {
    const carry = (location.state as { carry?: Carry } | null)?.carry;
    const saved: ReturnType<typeof remembered> = carry ? {} : remembered(family.key);
    return { remembered: Boolean(!carry && loadProfile()), values: { ...startValues(family), ...carry?.valuesById }, common: { page: 'a4' as PageSizeId, margin: 10, tone: 'charcoal' as ToneId, weight: 'normal' as Weight, heading: '', theme: 'classic' as ThemeId, font: 'sans' as FontId, logo: (saved.logo ?? null) as Logo | null, ...saved.look, ...carry?.common } };
  };
  const initial = useMemo(make, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeId, setActiveId] = useState(initialId);
  const def: SheetDef = family.sheets.find((sheet) => sheet.id === activeId) ?? family.sheets[0]!;
  const [valuesById, setValuesById] = useState<Record<string, Values>>(initial.values);
  const [paper, setPaper] = useState(initial.common);
  const [remember, setRemember] = useState(initial.remembered);
  useEffect(() => {
    if (!remember) return;
    const saved = loadProfile();
    saveProfile({ look: { page: paper.page, margin: paper.margin, tone: paper.tone, weight: paper.weight, theme: paper.theme ?? 'classic', font: paper.font ?? 'sans' }, logo: paper.logo ?? null, headings: { ...saved?.headings, [family.key]: paper.heading } });
  }, [remember, paper, family.key]);
  const [landscapeFor, setLandscapeFor] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const values = valuesById[def.id] ?? def.defaults;
  const landscape = landscapeFor[def.id] ?? def.landscape;
  const common: Common = { ...paper, landscape };
  const pages = useMemo(() => def.build(values, common), [def, values, paper, landscape]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = pages[Math.min(index, pages.length - 1)]!;
  const setValue = (key: string, value: string | number | boolean) => { setValuesById((all) => ({ ...all, [def.id]: { ...all[def.id], [key]: value } })); setIndex(0); };
  const setPaperValue = (patch: Partial<typeof paper>) => { setPaper((p) => ({ ...p, ...patch })); setIndex(0); };

  const download = async () => {
    setBusy(true);
    setMessage('');
    try {
      const bytes = await buildPdfFromSheets(pages, def.label);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName(def.id.replace(/-printable$/, ''), 'pdf');
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setMessage('Could not build the PDF. Try fewer pages and try again.');
    } finally {
      setBusy(false);
    }
  };

  const renderField = (field: Field) => {
    const value = values[field.key];
    switch (field.type) {
      case 'text':
        return (
          <label key={field.key} className="block text-xs font-semibold text-slate-700">{field.label}
            <input type="text" maxLength={field.max ?? MAX_TEXT} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => setValue(field.key, event.target.value)} className={fieldClass} />
          </label>
        );
      case 'number':
        return <Slider key={field.key} label={field.label} value={Number(value ?? field.min)} min={field.min} max={field.max} step={field.step ?? 1} unit={field.unit ?? ''} onChange={(next) => setValue(field.key, next)} />;
      case 'date':
        return <DateField key={field.key} label={field.label} value={String(value ?? '')} onChange={(next) => setValue(field.key, next)} />;
      case 'toggle':
        return <Toggle key={field.key} label={field.label} hint={field.hint} checked={Boolean(value)} onChange={(next) => setValue(field.key, next)} />;
      case 'select':
        return <SelectField key={field.key} label={field.label} value={String(value ?? '')} onChange={(next) => setValue(field.key, next)} options={field.options} />;
      case 'list':
        return (
          <label key={field.key} className="block text-xs font-semibold text-slate-700">{field.label}
            {field.hint && <span className="block text-[11px] font-normal text-slate-500">{field.hint}</span>}
            <textarea rows={4} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => setValue(field.key, event.target.value.split(/\r?\n/).slice(0, field.max).map((l) => l.slice(0, MAX_LINE)).join('\n'))} className={fieldClass} />
          </label>
        );
    }
  };

  return (
    <section className="mx-auto min-w-0">
      <style>{`@media print { body * { visibility: hidden !important; } #rec-print, #rec-print * { visibility: visible !important; } #rec-print { position: fixed; left: 0; top: 0; width: ${current.width}mm !important; height: ${current.height}mm !important; box-shadow: none !important; border: 0 !important; } #rec-print svg { width: ${current.width}mm !important; height: ${current.height}mm !important; max-height: none !important; } @page { size: ${current.width}mm ${current.height}mm; margin: 0; } }`}</style>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] print:m-0 print:block print:h-0 print:overflow-hidden">
        <div className="order-2 space-y-4 lg:order-1">
          <div className={card}>
            <h2 className={heading}>Which sheet</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {family.sheets.map((item) => {
                const carry: Carry = { common: { page: paper.page, margin: paper.margin, tone: paper.tone, weight: paper.weight, heading: paper.heading, theme: paper.theme, font: paper.font, logo: paper.logo }, valuesById };
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    state={{ carry }}
                    replace
                    aria-current={def.id === item.id ? 'true' : undefined}
                    onClick={(event) => {
                      // Same address: just switch the sheet here, without reloading the page.
                      if (item.path === location.pathname) { event.preventDefault(); setActiveId(item.id); setIndex(0); }
                    }}
                    className={`rounded-lg border px-2 py-2 text-left ${def.id === item.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                    <span className="block text-[11px] text-slate-500">{item.hint}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={`${card} space-y-3`}>
            <h2 className={heading}>Name on the sheet</h2>
            <label className="block text-xs font-semibold text-slate-700">{family.headingLabel}
              <input type="text" maxLength={MAX_TEXT} value={paper.heading} placeholder={family.headingPlaceholder} onChange={(event) => setPaperValue({ heading: event.target.value })} className={fieldClass} />
            </label>
            <LogoPicker logo={paper.logo ?? null} onChange={(logo) => setPaperValue({ logo })} />
            <label className="flex items-start gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={remember} onChange={(event) => { setRemember(event.target.checked); if (!event.target.checked) clearProfile(); }} className="mt-0.5 h-4 w-4" />
              <span><span className="font-semibold">Remember the name, logo and look on this device.</span> <span className="text-slate-500">Saved only in this browser, never uploaded. Untick to forget.</span></span>
            </label>
          </div>

          <div className={`${card} space-y-3`}>
            <h2 className={heading}>{def.label}</h2>
            {def.fields.map(renderField)}
          </div>

          <details className={card}>
            <summary className="cursor-pointer text-sm font-bold text-slate-900">Adjust everything <span className="font-normal text-slate-500">(paper, ink)</span></summary>
            <div className="mt-4 space-y-5">
              <div className="space-y-3">
                <h2 className={heading}>Paper</h2>
                <SelectField label="Page size" value={paper.page} onChange={(page) => setPaperValue({ page: page as PageSizeId })} options={Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label }))} />
                <ChoiceButtons label="Orientation" value={landscape ? 'landscape' : 'portrait'} onChange={(value) => { setLandscapeFor((all) => ({ ...all, [def.id]: value === 'landscape' })); setIndex(0); }} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
                <Slider label="Margin" value={paper.margin} min={4} max={30} step={1} onChange={(margin) => setPaperValue({ margin })} />
                {paper.margin < 5 && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">Many home printers cannot print closer than about 5 mm to the edge. Use 5 mm or more to be safe.</p>}
              </div>
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h2 className={heading}>Colour, font and lines</h2>
                <StylePicker value={{ tone: paper.tone, theme: paper.theme, font: paper.font }} onChange={(patch) => setPaperValue(patch)} />
                <ChoiceButtons label="Line weight" value={paper.weight} onChange={(value) => setPaperValue({ weight: value as Weight })} options={(Object.entries(WEIGHTS) as [Weight, { label: string }][]).map(([value, item]) => ({ value, label: item.label }))} />
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
            <div id="rec-print" className="mx-auto w-full max-w-3xl rounded-md border border-slate-300 bg-white shadow-sm">
              <SheetPreview sheet={current} id="rec-svg" pageLabel={null} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void download()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Building...' : `Download PDF${pages.length > 1 ? ` (${pages.length} pages)` : ''}`}</button>
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Printer className="h-4 w-4" aria-hidden="true" />Print this page</button>
              <button type="button" onClick={() => { const fresh = make(); setValuesById(startValues(family)); setPaper({ ...fresh.common, heading: '' }); setLandscapeFor({}); setIndex(0); setMessage(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</button>
            </div>
            {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
            <p className="text-[11px] text-slate-500">Print uses the page shown, at 100% scale. To print several pages, download the PDF and print it with "Actual size".</p>
          </div>
        </div>
      </div>
      <div className="print:hidden"><Note>What you type is printed on the sheet; the name, logo and look are saved on this device only if you tick Remember. {family.note ?? "These sheets help you keep records; check your own rules and your vet's or accountant's advice where it matters."}</Note></div>
    </section>
  );
};

export default RecordSheets;
