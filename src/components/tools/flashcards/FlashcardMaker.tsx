import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileUp } from 'lucide-react';
import { Note, SelectField } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Slider, Toggle, card, heading } from '../paper/controls';
import { PAGE_SIZES, type PageSizeId } from '../../../lib/paper/types';
import { alignmentDeck, buildPages, gridFor, mirrorAxis } from '../../../lib/flashcards/layout';
import { parseCards, parseTable } from '../../../lib/flashcards/parse';
import { buildFlashPdf } from '../../../lib/flashcards/pdf';
import { drawPage } from '../../../lib/flashcards/render';
import { DEFAULT_FLASH, FONT_STACKS, LAYOUTS, MAX_CARDS, SAMPLE_DECK, SWATCHES, pageDims, type FlashSettings, type FontFamily } from '../../../lib/flashcards/types';

const PREVIEW_PX_PER_MM = 3;

const Swatches: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <span className="block text-xs font-semibold text-slate-700">{label}</span>
    <div className="mt-1.5 flex flex-wrap gap-2">
      {SWATCHES.map((swatch) => (
        <button key={swatch.value} type="button" title={swatch.label} aria-label={swatch.label} aria-pressed={value === swatch.value} onClick={() => onChange(swatch.value)} className={`h-8 w-8 rounded-full border-2 ${value === swatch.value ? 'border-orange-600' : 'border-slate-300'}`} style={{ background: swatch.value }} />
      ))}
    </div>
  </div>
);

export const FlashcardMaker: React.FC<{ focus?: 'general' | 'duplex' }> = ({ focus = 'general' }) => {
  const [text, setText] = useState(SAMPLE_DECK);
  const [settings, setSettings] = useState<FlashSettings>(DEFAULT_FLASH);
  const [hasHeader, setHasHeader] = useState(false);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<FlashSettings>) => { setSettings((current) => ({ ...current, ...patch })); setIndex(0); };
  const parsed = useMemo(() => parseCards(text), [text]);
  const pages = useMemo(() => buildPages(parsed.cards, settings), [parsed.cards, settings]);
  const grid = useMemo(() => gridFor(settings), [settings]);
  const dims = pageDims(settings);
  const current = pages[Math.min(index, Math.max(0, pages.length - 1))];
  const duplex = settings.mode !== 'fold';
  const axis = mirrorAxis(settings);
  const cardSize = `${Math.round(grid.cardW)} × ${Math.round(grid.cardH)} mm`;
  const sheets = duplex ? pages.length / 2 : pages.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !current) return;
    canvas.width = Math.round(dims.w * PREVIEW_PX_PER_MM);
    canvas.height = Math.round(dims.h * PREVIEW_PX_PER_MM);
    drawPage(ctx, current, settings, PREVIEW_PX_PER_MM);
  }, [current, settings, dims.w, dims.h]);

  const download = async (cards = parsed.cards, name = 'flashcards.pdf') => {
    setMessage('');
    setBusy(0);
    try {
      const bytes = await buildFlashPdf(buildPages(cards, settings), settings, (fraction) => setBusy(fraction));
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setMessage('Could not build the PDF. Try fewer cards or a smaller page size and try again.');
    } finally {
      setBusy(null);
    }
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    const converted = /\.(csv|tsv)$/i.test(file.name) ? parseTable(content, hasHeader) : content;
    setText(converted);
    setIndex(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const flipHelp = settings.mode === 'long'
    ? `In the print window choose double-sided and "flip on long edge". The back pages are mirrored ${axis === 'x' ? 'left to right' : 'top to bottom'} so each answer lands behind its question.`
    : settings.mode === 'short'
      ? `In the print window choose double-sided and "flip on short edge". The back pages are mirrored ${axis === 'x' ? 'left to right' : 'top to bottom'} so each answer lands behind its question.`
      : 'Print one-sided. Each card has the question on the left and the answer on the right with a dashed fold line. Cut out, fold and glue or tape.';

  const alignmentTest = (
    <div className={card}>
      <h2 className={heading}>Test your printer first</h2>
      <p className="mt-1 text-[11px] text-slate-500">Printers differ in how they flip a sheet. Print this one-sheet test with the same settings. Hold it to the light: every FRONT n should sit exactly behind BACK n. If they do not line up, switch between the two flip options.</p>
      <button type="button" disabled={busy !== null || !duplex} onClick={() => void download(alignmentDeck(grid.perPage), 'flashcards-alignment-test.pdf')} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />Download alignment test (2 pages)</button>
    </div>
  );

  return (
    <section className="mx-auto min-w-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="order-2 space-y-4 lg:order-1">
          <div className={card}>
            <h2 className={heading}>1. Your cards</h2>
            <p className="mt-1 text-[11px] text-slate-500">One card per line: front, then back, split with a bar (|), a tab or ::. Use \n for a line break inside a side. Any language works.</p>
            <textarea value={text} rows={9} onChange={(event) => { setText(event.target.value); setIndex(0); }} aria-label="Cards, one per line" className={`${fieldClass} font-mono`} placeholder={'Question | Answer'} />
            <p className="mt-2 text-[11px] text-slate-600">{parsed.cards.length} cards{parsed.noBack > 0 ? ` · ${parsed.noBack} with no back side` : ''}{parsed.truncated ? ` · only the first ${MAX_CARDS} are used` : ''}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"><FileUp className="h-4 w-4" aria-hidden="true" />Import CSV, TSV or text</button>
              <Toggle label="First row is a header" checked={hasHeader} onChange={setHasHeader} />
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/plain,text/csv" className="hidden" aria-label="Import a deck file" onChange={(event) => void importFile(event.target.files?.[0])} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Exports from Anki, Quizlet, Google Sheets and Excel work: take the first two columns.</p>
          </div>

          {focus === 'duplex' && alignmentTest}

          <div className={card}>
            <h2 className={heading}>2. Page and card size</h2>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Page size" value={settings.page} onChange={(page) => update({ page: page as PageSizeId })} options={Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label }))} />
                <ChoiceButtons label="Orientation" value={settings.landscape ? 'landscape' : 'portrait'} onChange={(value) => update({ landscape: value === 'landscape' })} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
              </div>
              <div className="flex flex-wrap gap-2">
                {LAYOUTS.map((layout) => (
                  <button key={layout.label} type="button" aria-pressed={settings.cols === layout.cols && settings.rows === layout.rows} onClick={() => update({ cols: layout.cols, rows: layout.rows })} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${settings.cols === layout.cols && settings.rows === layout.rows ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{layout.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Columns" value={settings.cols} min={1} max={5} step={1} unit="" onChange={(cols) => update({ cols })} />
                <Slider label="Rows" value={settings.rows} min={1} max={8} step={1} unit="" onChange={(rows) => update({ rows })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Page margin" value={settings.margin} min={4} max={25} step={1} onChange={(margin) => update({ margin })} />
                <Slider label="Gap between cards" value={settings.gap} min={0} max={10} step={1} onChange={(gap) => update({ gap })} />
              </div>
              <p className="text-[11px] text-slate-500">Each card is {cardSize}{settings.mode === 'fold' ? ' when folded open (half that wide when folded shut)' : ''}. Many home printers cannot print closer than 5 mm to the edge.</p>
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>3. How you will print</h2>
            <div className="mt-3 space-y-3">
              <ChoiceButtons label="Printing" value={settings.mode} onChange={(mode) => update({ mode: mode as FlashSettings['mode'] })} options={[{ value: 'long', label: 'Two-sided, long edge' }, { value: 'short', label: 'Two-sided, short edge' }, { value: 'fold', label: 'One-sided, fold' }]} />
              <p className="text-[11px] text-slate-600">{flipHelp}</p>
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>4. Look</h2>
            <div className="mt-3 space-y-3">
              <ChoiceButtons label="Font" value={settings.font} onChange={(font) => update({ font: font as FontFamily })} options={(Object.keys(FONT_STACKS) as FontFamily[]).map((font) => ({ value: font, label: FONT_STACKS[font].label }))} />
              <Slider label="Largest text size" value={settings.maxFont} min={10} max={60} step={1} unit="pt" onChange={(maxFont) => update({ maxFont })} />
              <p className="text-[11px] text-slate-500">Text shrinks automatically so long answers still fit on the card.</p>
              <Swatches label="Front colour" value={settings.frontColor} onChange={(frontColor) => update({ frontColor })} />
              <Swatches label="Back colour" value={settings.backColor} onChange={(backColor) => update({ backColor })} />
              <ChoiceButtons label="Cutting guides" value={settings.guides} onChange={(guides) => update({ guides: guides as FlashSettings['guides'] })} options={[{ value: 'lines', label: 'Dashed lines' }, { value: 'ticks', label: 'Corner ticks' }, { value: 'none', label: 'None' }]} />
              <Toggle label="Number the cards" checked={settings.numbers} onChange={(numbers) => update({ numbers })} hint="Helps you put a dropped stack back in order" />
              <label className="block text-xs font-semibold text-slate-700">Deck name on each card (optional)
                <input type="text" maxLength={30} value={settings.label} onChange={(event) => update({ label: event.target.value })} className={fieldClass} />
              </label>
            </div>
          </div>

          {focus !== 'duplex' && alignmentTest}
        </div>

        <div className="order-1 lg:order-2">
          <div className="sticky top-2 z-10 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:top-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <span>{pages.length === 0 ? 'Add cards to see the preview' : `Page ${Math.min(index, pages.length - 1) + 1} of ${pages.length} · ${current?.kind === 'back' ? 'back' : current?.kind === 'fold' ? 'folded cards' : 'front'} · ${sheets % 1 === 0 ? sheets : Math.ceil(sheets)} sheet${sheets === 1 ? '' : 's'} of paper`}</span>
              <span className="flex gap-1">
                <button type="button" aria-label="Previous page" disabled={index <= 0} onClick={() => setIndex(index - 1)} className="rounded-lg border border-slate-300 bg-white p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" aria-label="Next page" disabled={index >= pages.length - 1} onClick={() => setIndex(index + 1)} className="rounded-lg border border-slate-300 bg-white p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
              </span>
            </div>
            <div className="mx-auto w-full max-w-xl rounded-md border border-slate-300 bg-white shadow-sm">
              <canvas ref={canvasRef} role="img" aria-label="Preview of the current page" className="block h-auto w-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={busy !== null || pages.length === 0} onClick={() => void download()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy === null ? 'Download PDF' : `Building ${Math.round(busy * 100)}%`}</button>
            </div>
            {message && <p role="alert" className="text-xs font-semibold text-red-700">{message}</p>}
            <p className="text-[11px] text-slate-500">Print the PDF at "Actual size" or 100% with "Fit to page" off, or the card edges will shift.</p>
          </div>
        </div>
      </div>
      <Note>Your cards are never uploaded. The pages are drawn and the PDF is built on your device. Text is placed as high-resolution images (300 dpi) so any language your browser can display prints correctly.</Note>
    </section>
  );
};

export default FlashcardMaker;
