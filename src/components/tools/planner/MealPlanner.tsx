import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Printer, RotateCcw } from 'lucide-react';
import { Note, SelectField } from '../../common/CalcKit';
import { ChoiceButtons, DateField, fieldClass } from '../../common/FieldKit';
import { buildPdfFromSheets } from '../../../lib/paper/pdf';
import { PAGE_SIZES, WEIGHTS, type PageSizeId, type Weight } from '../../../lib/paper/types';
import { buildMealPages } from '../../../lib/mealplan/layout';
import { weekdayName, monthName } from '../../../lib/planner/dates';
import { KINDS, MAX_COUNT, MAX_DISH, MEAL_CHOICES, defaultMeal, type MealKind, type MealSettings } from '../../../lib/mealplan/types';
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

const clampInt = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));

/** The address each kind of menu opens on. */
const KIND_PAGES: Record<MealKind, string> = { week: '/printable-meal-planner', day: '/daily-menu-planner-printable', month: '/monthly-menu-planner-printable' };

/** What a page change carries over, so picking another kind keeps the meals, paper and style already chosen. */
type Carry = Pick<MealSettings, 'kind' | 'meals' | 'page' | 'landscape' | 'margin' | 'tone' | 'theme' | 'font' | 'weight' | 'weekStart' | 'title' | 'dishes'>;

/** A printable weekly, daily or monthly menu. Each kind has its own address; picking a kind goes to its address. Plain boxes to write in, or type the dishes first. */
export const MealPlanner: React.FC<{ initialKind?: MealKind }> = ({ initialKind }) => {
  const location = useLocation();
  const make = (): MealSettings => {
    const carry = (location.state as { carry?: Carry } | null)?.carry;
    return { ...defaultMeal(), ...carry, kind: carry?.kind ?? initialKind ?? 'week' };
  };
  const [settings, setSettings] = useState<MealSettings>(make);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const update = (patch: Partial<MealSettings>) => { setSettings((current) => ({ ...current, ...patch })); setIndex(0); };

  const pages = useMemo(() => buildMealPages(settings), [settings]);
  const current = pages[Math.min(index, pages.length - 1)];
  const maxCount = MAX_COUNT[settings.kind];
  const countLabel = settings.kind === 'month' ? 'months' : settings.kind === 'week' ? 'weeks' : 'days';
  const weekdays = Array.from({ length: 7 }, (_, i) => (settings.weekStart + i) % 7);
  const hasDishes = Object.values(settings.dishes).some((row) => Object.values(row).some((value) => value.trim()));

  const toggleMeal = (meal: string) => {
    const on = settings.meals.includes(meal);
    if (on && settings.meals.length === 1) return;
    update({ meals: MEAL_CHOICES.filter((item) => (item === meal ? !on : settings.meals.includes(item))) });
  };
  const setDish = (weekday: number, meal: string, value: string) =>
    update({ dishes: { ...settings.dishes, [String(weekday)]: { ...settings.dishes[String(weekday)], [meal]: value.slice(0, MAX_DISH) } } });

  /** Builds the PDF and its file name; Save and Share both use it, so they always give the same file. */
  const makePdf = async (): Promise<{ blob: Blob; name: string }> => ({ blob: pdfBlob(await buildPdfFromSheets(pages, `${settings.kind} menu`)), name: generateFileName('meal-planner', 'pdf', { details: `${settings.kind}-${settings.kind === 'month' ? `${settings.year}-${String(settings.month).padStart(2, '0')}` : settings.startDate}` }) });

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

  return (
    <section className="mx-auto min-w-0">
      <style>{`@media print { html, body { margin: 0 !important; height: ${current.height}mm !important; max-height: ${current.height}mm !important; overflow: hidden !important; } body * { visibility: hidden !important; } #meal-print, #meal-print * { visibility: visible !important; } #meal-print { position: fixed; left: 0; top: 0; width: ${current.width}mm !important; height: ${current.height}mm !important; box-shadow: none !important; border: 0 !important; } #meal-print svg { width: ${current.width}mm !important; height: ${current.height}mm !important; max-height: none !important; } @page { size: ${current.width}mm ${current.height}mm; margin: 0; } }`}</style>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] print:m-0 print:block print:h-0 print:overflow-hidden">
        <div className="order-2 space-y-4 lg:order-1">
          <div className={card}>
            <h2 className={heading}>What to make</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {KINDS.map((item) => {
                const target = KIND_PAGES[item.id];
                const carry: Carry = { kind: item.id, meals: settings.meals, page: settings.page, landscape: settings.landscape, margin: settings.margin, tone: settings.tone, theme: settings.theme, font: settings.font, weight: settings.weight, weekStart: settings.weekStart, title: settings.title, dishes: settings.dishes };
                return (
                  <Link
                    key={item.id}
                    to={target}
                    state={{ carry }}
                    replace
                    aria-current={settings.kind === item.id ? 'true' : undefined}
                    onClick={(event) => {
                      // Same address: just switch the kind here, without reloading the page.
                      if (target === location.pathname) { event.preventDefault(); update({ kind: item.id as MealKind, count: 1 }); }
                    }}
                    className={`rounded-lg border px-2 py-2 text-left ${settings.kind === item.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                    <span className="block text-[11px] text-slate-500">{item.hint}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>Meals to print</h2>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Meals to print">
              {MEAL_CHOICES.map((meal) => {
                const on = settings.meals.includes(meal);
                return (
                  <button key={meal} type="button" aria-pressed={on} onClick={() => toggleMeal(meal)} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{meal}</button>
                );
              })}
            </div>
          </div>

          <details className={card}>
            <summary className="cursor-pointer text-sm font-bold text-slate-900">Adjust everything <span className="font-normal text-slate-500">(dates, dishes, paper, ink)</span></summary>
            <div className="mt-4 space-y-5">
              <div className="space-y-3">
                <h2 className={heading}>Dates</h2>
                {settings.kind === 'month' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-slate-700">Year
                      <input type="number" inputMode="numeric" min={1900} max={2200} value={settings.year} onChange={(event) => update({ year: clampInt(Number(event.target.value), 1900, 2200) })} className={fieldClass} />
                    </label>
                    <SelectField label="Starting month" value={String(settings.month)} onChange={(value) => update({ month: Number(value) })} options={Array.from({ length: 12 }, (_, m) => ({ value: String(m + 1), label: monthName(2026, m + 1, 'en') }))} />
                  </div>
                ) : (
                  <DateField label={settings.kind === 'week' ? 'Any date in the first week' : 'First day'} value={settings.startDate} onChange={(startDate) => update({ startDate })} />
                )}
                <Slider label={`How many ${countLabel}`} value={Math.min(settings.count, maxCount)} min={1} max={maxCount} step={1} unit="" onChange={(count) => update({ count })} />
                <SelectField label="Week starts on" value={String(settings.weekStart)} onChange={(value) => update({ weekStart: Number(value) as 0 | 1 | 6 })} options={[{ value: '1', label: 'Monday' }, { value: '0', label: 'Sunday' }, { value: '6', label: 'Saturday' }]} />
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h2 className={heading}>Extras</h2>
                <label className="block text-xs font-semibold text-slate-700">Heading on each page (optional)
                  <input type="text" maxLength={40} value={settings.title} placeholder="Our family menu" onChange={(event) => update({ title: event.target.value })} className={fieldClass} />
                </label>
                {settings.kind === 'week' && <Toggle label="Shopping list beside the week" checked={settings.shopping} onChange={(shopping) => update({ shopping })} />}
                {settings.kind !== 'week' && <Toggle label="Notes lines" checked={settings.notes} onChange={(notes) => update({ notes })} />}
              </div>

              {settings.kind !== 'month' && (
                <div className="border-t border-slate-200 pt-4">
                  <h2 className={heading}>Type the dishes <span className="font-normal text-slate-500">(optional)</span></h2>
                  <p className="mt-1 text-[11px] text-slate-500">Leave empty to print blank boxes to write in. The same menu repeats every week.</p>
                  <div className="mt-3 space-y-3">
                    {weekdays.map((weekday) => (
                      <fieldset key={weekday} className="rounded-lg border border-slate-200 p-2">
                        <legend className="px-1 text-xs font-bold text-slate-800">{weekdayName(weekday, 'en', 'long')}</legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {settings.meals.map((meal) => (
                            <label key={meal} className="block text-[11px] font-semibold text-slate-600">{meal}
                              <input type="text" maxLength={MAX_DISH} value={settings.dishes[String(weekday)]?.[meal] ?? ''} onChange={(event) => setDish(weekday, meal, event.target.value)} className={fieldClass} />
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                  {hasDishes && <button type="button" onClick={() => update({ dishes: {} })} className="mt-3 min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Clear all dishes</button>}
                </div>
              )}

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h2 className={heading}>Paper</h2>
                <SelectField label="Page size" value={settings.page} onChange={(page) => update({ page: page as PageSizeId })} options={Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label }))} />
                <ChoiceButtons label="Orientation" value={settings.landscape ? 'landscape' : 'portrait'} onChange={(value) => update({ landscape: value === 'landscape' })} options={[{ value: 'landscape', label: 'Landscape' }, { value: 'portrait', label: 'Portrait' }]} />
                <Slider label="Margin" value={settings.margin} min={4} max={30} step={1} onChange={(margin) => update({ margin })} />
                {settings.margin < 5 && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">Many home printers cannot print closer than about 5 mm to the edge. Use 5 mm or more to be safe.</p>}
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h2 className={heading}>Ink and lines</h2>
                <StylePicker value={{ tone: settings.tone, theme: settings.theme, font: settings.font }} onChange={(patch) => update(patch)} />
                <ChoiceButtons label="Line weight" value={settings.weight} onChange={(value) => update({ weight: value as Weight })} options={(Object.entries(WEIGHTS) as [Weight, { label: string }][]).map(([value, item]) => ({ value, label: item.label }))} />
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
            <div id="meal-print" className="mx-auto w-full max-w-3xl rounded-md border border-slate-300 bg-white shadow-sm">
              <SheetPreview sheet={current} id="meal-svg" pageLabel={null} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void download()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Building...' : `Download PDF${pages.length > 1 ? ` (${pages.length} pages)` : ''}`}</button>
              <ShareFileButton className={shareFileLargeClass} getFile={async () => { const { blob, name } = await makePdf(); return toFile(blob, name); }} />
              <button type="button" onClick={() => printAs('meal-planner', { base: settings.title, details: `${settings.kind}-${settings.kind === 'month' ? `${settings.year}-${String(settings.month).padStart(2, '0')}` : settings.startDate}` })} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Printer className="h-4 w-4" aria-hidden="true" />Print this page</button><PrintCreditToggle />
              <button type="button" onClick={() => { setSettings(make()); setIndex(0); setMessage(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</button>
            </div>
            {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
            <p className="text-[11px] text-slate-500">Print uses the page shown, at 100% scale. To print several pages, download the PDF and print it with "Actual size".</p>
          </div>
        </div>
      </div>
      <div className="print:hidden"><Note>The dishes you type are printed on the sheet; the same menu repeats every week.</Note></div>
    </section>
  );
};

export default MealPlanner;