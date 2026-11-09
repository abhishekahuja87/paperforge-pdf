import React, { useMemo, useRef, useState } from 'react';
import { Download, FolderOpen, Printer, RotateCcw, Save } from 'lucide-react';
import { Note, SelectField } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from '../utilities/common';
import { buildSheet, hasBackSide } from '../../../lib/paper/geometry';
import { buildPaperPdf } from '../../../lib/paper/pdf';
import { PRESETS, parseSettingsFile, serializeSettings } from '../../../lib/paper/settings';
import { encodeShare, decodeShare } from '../../../lib/paper/share';
import { DEFAULT_SETTINGS, HEADER_LABELS, PAGE_SIZES, STORY_RATIOS, STYLES, TONES, WEIGHTS, canTwoUp, type HeaderField, type PaperSettings, type PaperStyle, type ToneId, type Weight } from '../../../lib/paper/types';
import { SheetPreview } from './SheetPreview';
import { Slider, Toggle, card, heading } from './controls';

const presetButtons = (spacings: { label: string; value: number }[], current: number, onPick: (value: number) => void) => (
  <div className="flex flex-wrap gap-2">
    {spacings.map((item) => (
      <button key={item.label} type="button" aria-pressed={current === item.value} onClick={() => onPick(item.value)} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${current === item.value ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{item.label}</button>
    ))}
  </div>
);

export const PaperMaker: React.FC<{ initialStyle?: PaperStyle }> = ({ initialStyle }) => {
  const [settings, setSettings] = useState<PaperSettings>(() => (typeof window !== 'undefined' ? decodeShare(window.location.hash) : null) ?? { ...DEFAULT_SETTINGS, style: initialStyle ?? DEFAULT_SETTINGS.style });
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<PaperSettings>) => setSettings((current) => ({ ...current, ...patch }));
  const sheet = useMemo(() => buildSheet(settings, hasBackSide(settings) ? side : 'front'), [settings, side]);
  const margins = settings.margins;
  const tightMargin = Math.min(margins.top, margins.bottom, margins.left, margins.right) < 5;
  const isCornell = settings.style === 'cornell';
  const headerApplies = settings.style !== 'cornell' && settings.style !== 'tracker';
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#${encodeShare(settings)}` : '';
  const twoUpOk = canTwoUp(settings);
  const sizeLabel = `${Math.round(sheet.width * 10) / 10} × ${Math.round(sheet.height * 10) / 10} mm`;

  const setMargin = (key: keyof PaperSettings['margins'], value: number) => update({ margins: { ...margins, [key]: value } });
  const toggleField = (field: HeaderField) => update({ headerFields: settings.headerFields.includes(field) ? settings.headerFields.filter((item) => item !== field) : [...settings.headerFields, field] });

  const download = async () => {
    setBusy(true);
    setMessage('');
    try {
      const bytes = await buildPaperPdf(settings);
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${settings.style}-paper-${settings.page}${settings.pages > 1 ? `-${settings.pages}pages` : ''}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setMessage('Could not build the PDF. Try fewer pages or a larger spacing, then try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = () => {
    const url = URL.createObjectURL(new Blob([serializeSettings(settings)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'paper-settings.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const loadSettings = async (file: File | undefined) => {
    if (!file) return;
    const loaded = parseSettingsFile(await file.text());
    setMessage(loaded ? 'Settings loaded.' : 'That file is not a paper settings file.');
    if (loaded) setSettings(loaded);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="mx-auto min-w-0">
      <style>{`@media print { body * { visibility: hidden !important; } #paper-print, #paper-print * { visibility: visible !important; } #paper-print { position: fixed; left: 0; top: 0; width: ${sheet.width}mm !important; height: ${sheet.height}mm !important; box-shadow: none !important; border: 0 !important; } #paper-print svg { width: ${sheet.width}mm !important; height: ${sheet.height}mm !important; max-height: none !important; } @page { size: ${sheet.width}mm ${sheet.height}mm; margin: 0; } }`}</style>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] print:hidden">
        <div className="order-2 space-y-4 lg:order-1">
          <div className={card}>
            <h2 className={heading}>Quick start</h2>
            <p className="mt-1 text-[11px] text-slate-500">One click sets a template, size and options for a common use. You can change anything afterwards.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button key={preset.id} type="button" title={preset.hint} onClick={() => setSettings((current) => preset.patch(current))} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{preset.label}</button>
              ))}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>1. Paper style</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {STYLES.map((item) => (
                <button key={item.id} type="button" aria-pressed={settings.style === item.id} onClick={() => update({ style: item.id })} className={`rounded-lg border px-3 py-2 text-left ${settings.style === item.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                  <span className="block text-[11px] text-slate-500">{item.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {settings.style === 'dot' && (<>
                {presetButtons([{ label: 'Compact 3.5 mm', value: 3.5 }, { label: 'Standard 5 mm', value: 5 }, { label: 'Wide 7 mm', value: 7 }], settings.dot.spacing, (spacing) => update({ dot: { ...settings.dot, spacing } }))}
                <Slider label="Dot spacing" value={settings.dot.spacing} min={2} max={15} step={0.5} onChange={(spacing) => update({ dot: { ...settings.dot, spacing } })} />
                <ChoiceButtons label="Dot size" value={settings.dot.size} onChange={(size) => update({ dot: { ...settings.dot, size: size as 'fine' | 'medium' | 'bold' } })} options={[{ value: 'fine', label: 'Fine' }, { value: 'medium', label: 'Medium' }, { value: 'bold', label: 'Bold' }]} />
              </>)}
              {settings.style === 'graph' && (<>
                {presetButtons([{ label: '2.5 mm', value: 2.5 }, { label: '5 mm', value: 5 }, { label: '10 mm', value: 10 }], settings.graph.size, (size) => update({ graph: { ...settings.graph, size } }))}
                <Slider label="Square size" value={settings.graph.size} min={1.5} max={25} step={0.5} onChange={(size) => update({ graph: { ...settings.graph, size } })} />
                <ChoiceButtons label="Darker line every" value={String(settings.graph.major)} onChange={(value) => update({ graph: { ...settings.graph, major: value === '0' ? 0 : value === '10' ? 10 : 5 } })} options={[{ value: '0', label: 'Off' }, { value: '5', label: 'Every 5th' }, { value: '10', label: 'Every 10th' }]} />
                <Toggle label="Draw x and y axes through the middle" checked={settings.graph.axes} onChange={(axes) => update({ graph: { ...settings.graph, axes } })} hint="Handy for plotting graphs" />
              </>)}
              {settings.style === 'lined' && (<>
                {presetButtons([{ label: 'Narrow 6.35 mm', value: 6.35 }, { label: 'College 7.1 mm', value: 7.1 }, { label: 'Wide 8.7 mm', value: 8.7 }], settings.lined.spacing, (spacing) => update({ lined: { ...settings.lined, spacing } }))}
                <Slider label="Line spacing" value={settings.lined.spacing} min={4} max={15} step={0.1} onChange={(spacing) => update({ lined: { ...settings.lined, spacing } })} />
                <Toggle label="Margin line on the left" checked={settings.lined.marginLine} onChange={(marginLine) => update({ lined: { ...settings.lined, marginLine } })} />
                <Toggle label="Dotted midline between lines" checked={settings.lined.midline} onChange={(midline) => update({ lined: { ...settings.lined, midline } })} hint="A guide for the height of small letters when practising handwriting" />
              </>)}
              {settings.style === 'cornell' && (<>
                <Slider label="Cue column width" value={settings.cornell.cuePercent} min={15} max={40} step={1} unit="%" onChange={(cuePercent) => update({ cornell: { ...settings.cornell, cuePercent } })} />
                <Slider label="Summary box height" value={settings.cornell.summaryMm} min={20} max={90} step={1} onChange={(summaryMm) => update({ cornell: { ...settings.cornell, summaryMm } })} />
                <ChoiceButtons label="Notes area" value={settings.cornell.body} onChange={(body) => update({ cornell: { ...settings.cornell, body: body as 'lined' | 'dot' | 'plain' } })} options={[{ value: 'lined', label: 'Lined' }, { value: 'dot', label: 'Dot grid' }, { value: 'plain', label: 'Plain' }]} />
              </>)}
              {settings.style === 'isometric' && (<>
                {presetButtons([{ label: '5 mm', value: 5 }, { label: '8 mm', value: 8 }, { label: '10 mm', value: 10 }], settings.isometric.pitch, (pitch) => update({ isometric: { ...settings.isometric, pitch } }))}
                <Slider label="Grid pitch" value={settings.isometric.pitch} min={3} max={20} step={0.5} onChange={(pitch) => update({ isometric: { ...settings.isometric, pitch } })} />
                <ChoiceButtons label="Grid type" value={settings.isometric.mode} onChange={(mode) => update({ isometric: { ...settings.isometric, mode: mode as 'dots' | 'lines' } })} options={[{ value: 'dots', label: 'Dots' }, { value: 'lines', label: 'Lines' }]} />
                <ChoiceButtons label="Direction" value={settings.isometric.axis} onChange={(axis) => update({ isometric: { ...settings.isometric, axis: axis as 'vertical' | 'horizontal' } })} options={[{ value: 'vertical', label: 'Vertical axis (3D drawing)' }, { value: 'horizontal', label: 'Horizontal rows' }]} />
              </>)}
              {settings.style === 'music' && (<>
                <ChoiceButtons label="Music sheet type" value={settings.music.mode} onChange={(mode) => update({ music: { ...settings.music, mode: mode as 'staff' | 'tab' } })} options={[{ value: 'staff', label: '5-line staff' }, { value: 'tab', label: '6-line guitar TAB' }]} />
                <Slider label="Line spacing" value={settings.music.space} min={1.2} max={3} step={0.1} onChange={(space) => update({ music: { ...settings.music, space } })} />
                <Slider label="Space between staves" value={settings.music.gap} min={6} max={30} step={1} onChange={(gap) => update({ music: { ...settings.music, gap } })} />
                {settings.music.mode === 'staff' && <Toggle label="Leave space for the clef" checked={settings.music.clefSpace} onChange={(clefSpace) => update({ music: { ...settings.music, clefSpace } })} hint="Marks a clef box at the start of each staff; draw the clef by hand" />}
              </>)}
              {settings.style === 'hex' && (<>
                {presetButtons([{ label: 'Small 4 mm', value: 4 }, { label: '6 mm', value: 6 }, { label: 'Map 10 mm', value: 10 }], settings.hex.radius, (radius) => update({ hex: { ...settings.hex, radius } }))}
                <Slider label="Hexagon radius (centre to corner)" value={settings.hex.radius} min={3} max={20} step={0.5} onChange={(radius) => update({ hex: { ...settings.hex, radius } })} />
                <ChoiceButtons label="Orientation" value={settings.hex.orientation} onChange={(orientation) => update({ hex: { ...settings.hex, orientation: orientation as 'pointy' | 'flat' } })} options={[{ value: 'pointy', label: 'Pointy top' }, { value: 'flat', label: 'Flat top' }]} />
                <Toggle label="Dot in the centre of each hexagon" checked={settings.hex.centers} onChange={(centers) => update({ hex: { ...settings.hex, centers } })} hint="Useful for placing tokens or counting steps" />
              </>)}
              {settings.style === 'calligraphy' && (<>
                {presetButtons([{ label: 'Copperplate 55°', value: 55 }, { label: 'Spencerian 52°', value: 52 }, { label: 'Italic 8°', value: 82 }, { label: 'Vertical', value: 90 }], settings.calligraphy.slant, (slant) => update({ calligraphy: { ...settings.calligraphy, slant } }))}
                <Slider label="Slant angle from the baseline" value={settings.calligraphy.slant} min={0} max={90} step={1} unit="°" onChange={(slant) => update({ calligraphy: { ...settings.calligraphy, slant } })} />
                <Slider label="x-height (body of small letters)" value={settings.calligraphy.xHeight} min={2.5} max={10} step={0.5} onChange={(xHeight) => update({ calligraphy: { ...settings.calligraphy, xHeight } })} />
                <Slider label="Ascender height (in x-heights)" value={settings.calligraphy.ascender} min={1} max={4} step={0.25} unit="×" onChange={(ascender) => update({ calligraphy: { ...settings.calligraphy, ascender } })} />
                <Slider label="Descender depth (in x-heights)" value={settings.calligraphy.descender} min={1} max={4} step={0.25} unit="×" onChange={(descender) => update({ calligraphy: { ...settings.calligraphy, descender } })} />
                <Slider label="Space between lines of writing" value={settings.calligraphy.gap} min={0} max={15} step={0.5} onChange={(gap) => update({ calligraphy: { ...settings.calligraphy, gap } })} />
                <Toggle label="Slant guide lines" checked={settings.calligraphy.slantLines} onChange={(slantLines) => update({ calligraphy: { ...settings.calligraphy, slantLines } })} />
                {settings.calligraphy.slantLines && <Slider label="Distance between slant lines" value={settings.calligraphy.slantSpacing} min={4} max={30} step={1} onChange={(slantSpacing) => update({ calligraphy: { ...settings.calligraphy, slantSpacing } })} />}
              </>)}
              {settings.style === 'crossstitch' && (<>
                {presetButtons([{ label: 'Beads 5 mm', value: 5 }, { label: '11 count', value: 11 }, { label: '14 count', value: 14 }, { label: '16 count', value: 16 }, { label: '18 count', value: 18 }], settings.crossstitch.count, (count) => update({ crossstitch: { ...settings.crossstitch, count } }))}
                <Slider label="Stitches per inch (Aida count)" value={settings.crossstitch.count} min={5} max={32} step={1} unit="" onChange={(count) => update({ crossstitch: { ...settings.crossstitch, count } })} />
                <p className="text-[11px] text-slate-500">Each square is {Math.round((25.4 / settings.crossstitch.count) * 100) / 100} mm, the size of one stitch on this fabric count.</p>
                <Toggle label="Darker line every 10 squares" checked={settings.crossstitch.major} onChange={(major) => update({ crossstitch: { ...settings.crossstitch, major } })} hint="Makes counting stitches faster" />
                <Toggle label="Dashed centre lines" checked={settings.crossstitch.centerLines} onChange={(centerLines) => update({ crossstitch: { ...settings.crossstitch, centerLines } })} hint="Start stitching from the middle of the fabric" />
              </>)}
              {settings.style === 'storyboard' && (<>
                <ChoiceButtons label="Panel shape" value={settings.storyboard.ratio} onChange={(ratio) => update({ storyboard: { ...settings.storyboard, ratio: ratio as keyof typeof STORY_RATIOS } })} options={(Object.keys(STORY_RATIOS) as (keyof typeof STORY_RATIOS)[]).map((ratio) => ({ value: ratio, label: ratio }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Slider label="Columns" value={settings.storyboard.cols} min={1} max={4} step={1} unit="" onChange={(cols) => update({ storyboard: { ...settings.storyboard, cols } })} />
                  <Slider label="Rows" value={settings.storyboard.rows} min={1} max={5} step={1} unit="" onChange={(rows) => update({ storyboard: { ...settings.storyboard, rows } })} />
                </div>
                <Slider label="Note lines under each panel" value={settings.storyboard.memo} min={0} max={5} step={1} unit="" onChange={(memo) => update({ storyboard: { ...settings.storyboard, memo } })} />
                <Slider label="Gap between panels" value={settings.storyboard.gutter} min={3} max={12} step={1} onChange={(gutter) => update({ storyboard: { ...settings.storyboard, gutter } })} />
                <Toggle label="Number the panels" checked={settings.storyboard.numbers} onChange={(numbers) => update({ storyboard: { ...settings.storyboard, numbers } })} />
              </>)}
              {settings.style === 'tracker' && (<>
                <ChoiceButtons label="Days in the month" value={String(settings.tracker.days)} onChange={(value) => update({ tracker: { ...settings.tracker, days: Number(value) } })} options={[{ value: '28', label: '28' }, { value: '30', label: '30' }, { value: '31', label: '31' }]} />
                <Slider label="Number of habits or tasks" value={settings.tracker.rows} min={3} max={30} step={1} unit="rows" onChange={(rows) => update({ tracker: { ...settings.tracker, rows } })} />
                <label className="block text-xs font-semibold text-slate-700">Habit names (one per line, optional)
                  <textarea value={settings.tracker.habits} rows={5} placeholder={'Drink water\nRead 20 pages\nExercise'} onChange={(event) => update({ tracker: { ...settings.tracker, habits: event.target.value } })} className={fieldClass} />
                </label>
              </>)}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>2. Page and margins</h2>
            <div className="mt-3 space-y-3">
              <SelectField label="Page size" value={settings.page} onChange={(page) => update({ page: page as PaperSettings['page'] })} options={Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label }))} />
              <ChoiceButtons label="Orientation" value={settings.landscape ? 'landscape' : 'portrait'} onChange={(value) => update({ landscape: value === 'landscape' })} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Top" value={margins.top} min={0} max={40} step={1} onChange={(v) => setMargin('top', v)} />
                <Slider label="Bottom" value={margins.bottom} min={0} max={40} step={1} onChange={(v) => setMargin('bottom', v)} />
                <Slider label="Left" value={margins.left} min={0} max={40} step={1} onChange={(v) => setMargin('left', v)} />
                <Slider label="Right" value={margins.right} min={0} max={40} step={1} onChange={(v) => setMargin('right', v)} />
              </div>
              {tightMargin && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">Many home printers cannot print closer than about 5 mm to the edge, so lines near the edge may be cut off. Use 5 mm or more to be safe.</p>}
              <Toggle label="Binding or hole-punch margin" checked={settings.binding} onChange={(binding) => update({ binding })} hint={`Adds 12 mm on the ${settings.landscape ? 'top' : 'left'} edge so punched holes and spiral rings stay clear of the pattern`} />
              {settings.binding && <Toggle label="Switch the binding edge on back pages" checked={settings.bindingAlternate} onChange={(bindingAlternate) => update({ bindingAlternate })} hint="For double-sided printing: back pages get the extra margin on the opposite edge, so holes line up" />}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>3. Ink and line weight</h2>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(Object.entries(TONES) as [ToneId, { label: string; color: string }][]).map(([id, tone]) => (
                  <button key={id} type="button" aria-pressed={settings.tone === id} onClick={() => update({ tone: id })} className={`flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${settings.tone === id ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>
                    <span className="h-3 w-3 rounded-full" style={{ background: tone.color }} aria-hidden="true" />{tone.label}
                  </button>
                ))}
              </div>
              <ChoiceButtons label="Line weight" value={settings.weight} onChange={(value) => update({ weight: value as Weight })} options={(Object.entries(WEIGHTS) as [Weight, { label: string }][]).map(([value, item]) => ({ value, label: item.label }))} />
              <p className="text-[11px] text-slate-500">Light tones use less ink and stay out of the way of your writing.</p>
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>4. Header and page numbers</h2>
            <div className="mt-3 space-y-3">
              {headerApplies && <Toggle label="Add a header bar" checked={settings.header} onChange={(header) => update({ header })} />}
              {(settings.header || !headerApplies) && (
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(HEADER_LABELS) as HeaderField[]).filter((field) => !(isCornell && field !== 'page')).filter((field) => !(settings.style === 'tracker' && field !== 'page')).map((field) => (
                    <button key={field} type="button" aria-pressed={settings.headerFields.includes(field)} onClick={() => toggleField(field)} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${settings.headerFields.includes(field) ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>{HEADER_LABELS[field]}</button>
                  ))}
                </div>
              )}
              {isCornell && <p className="text-[11px] text-slate-500">Cornell notes always have Topic, Date and Subject lines. You can add a page number.</p>}
              {settings.pages > 1 && <Slider label="First page number" value={settings.startPage} min={1} max={500} step={1} unit="" onChange={(startPage) => update({ startPage })} />}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>5. Extras</h2>
            <div className="mt-3 space-y-3">
              <ChoiceButtons label="Punch-hole guides" value={settings.holes} onChange={(holes) => update({ holes: holes as PaperSettings['holes'] })} options={[{ value: 'none', label: 'None' }, { value: '2', label: '2 holes' }, { value: '3', label: '3 holes' }, { value: '4', label: '4 holes' }]} />
              {settings.holes !== 'none' && <p className="text-[11px] text-slate-500">Rings are drawn 12 mm from the binding edge at the standard spacing ({settings.holes === '3' ? '108 mm, US 3-ring' : '80 mm'}), and the pattern is kept clear of them. Holes that do not fit the page are left out. Use the rings as a guide for a punch, not as a template for the printer.</p>}
              <label className="block text-xs font-semibold text-slate-700">Corner label (name, class or "Draft")
                <input type="text" maxLength={40} value={settings.stamp.text} onChange={(event) => update({ stamp: { ...settings.stamp, text: event.target.value } })} className={fieldClass} />
              </label>
              {settings.stamp.text.trim() !== '' && <ChoiceButtons label="Label position" value={settings.stamp.corner} onChange={(corner) => update({ stamp: { ...settings.stamp, corner: corner as PaperSettings['stamp']['corner'] } })} options={[{ value: 'tl', label: 'Top left' }, { value: 'tr', label: 'Top right' }, { value: 'bl', label: 'Bottom left' }, { value: 'br', label: 'Bottom right' }]} />}
              <Toggle label="Two A5 pages on one A4 sheet" checked={settings.twoUp && twoUpOk} onChange={(twoUp) => update({ twoUp })} hint={twoUpOk ? 'Prints two copies side by side with a dashed cut line, so one A4 sheet makes two A5 pages. Page numbers are not printed in this layout.' : 'Available when the page size is A5 in portrait.'} />
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>6. How many pages</h2>
            <div className="mt-3">
              <Slider label={settings.twoUp && twoUpOk ? 'Sheets in the PDF (2 pages each)' : 'Pages in the PDF'} value={settings.pages} min={1} max={50} step={1} unit="pages" onChange={(pages) => update({ pages })} />
              <p className="mt-2 text-[11px] text-slate-500">Make a ready-to-print notebook or binder refill in one file. Identical pages are stored once, so the file stays small.</p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="sticky top-2 z-10 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:top-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <span>Live preview · {sizeLabel}</span>
              {hasBackSide(settings) && <ChoiceButtons label="Preview side" value={side} onChange={(value) => setSide(value as 'front' | 'back')} options={[{ value: 'front', label: 'Front' }, { value: 'back', label: 'Back' }]} />}
            </div>
            <div id="paper-print" className="mx-auto w-full max-w-xl rounded-md border border-slate-300 bg-white shadow-sm">
              <SheetPreview sheet={sheet} id="paper-svg" pageLabel={`Page ${settings.startPage + (side === 'back' ? 1 : 0)}`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void download()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Building...' : 'Download PDF'}</button>
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Printer className="h-4 w-4" aria-hidden="true" />Print this sheet</button>
              <CopyButton text={shareLink} label="Copy link to these settings" />
              <button type="button" onClick={saveSettings} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Save className="h-4 w-4" aria-hidden="true" />Save settings</button>
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FolderOpen className="h-4 w-4" aria-hidden="true" />Load settings</button>
              <button type="button" onClick={() => { setSettings({ ...DEFAULT_SETTINGS, style: initialStyle ?? DEFAULT_SETTINGS.style }); setMessage(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Load settings file" onChange={(event) => void loadSettings(event.target.files?.[0])} />
            </div>
            {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
            <p className="text-[11px] text-slate-500">Print uses the sheet shown, at 100% scale. To print every page of a bundle, download the PDF and print it, choosing "Actual size".</p>
          </div>
        </div>
      </div>
      <div className="print:hidden"><Note>Your settings stay in this browser. Nothing is uploaded and the PDF is built on your device. Printers add their own small unprintable border, so choose "Actual size" or "100%" in the print window and turn off "Fit to page".</Note></div>
    </section>
  );
};

export default PaperMaker;
