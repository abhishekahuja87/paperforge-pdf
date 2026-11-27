import React, { useEffect, useState } from 'react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons, fieldClass } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { FileDropZone } from '../../common/FileDropZone';
import { UploadNote } from '../../common/UploadNote';
import { PdfFileBar } from '../../common/PdfFileBar';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { useResultFile } from '../../../lib/useResultFile';
import { generateFileName } from '../../../lib/pdf/naming';
import { PAGE_SIZES, fitScales, readPageSizes, resizePdf, sameSize, sizeSummary, targetFor, type FitMode, type Orientation, type PageSizeId, type ResizeOptions } from '../../../lib/more/pageSize';
import { usePdfSource } from './usePdfSource';

type SizeChoice = PageSizeId | 'custom';
const MM = 72 / 25.4;

/** Change every page of a PDF to A4, Letter or another paper size, keeping text and pictures sharp. No limit on pages or file size beyond your device. */
export const ResizePdfPageSize: React.FC = () => {
  const saved = useResultFile();
  const pdf = usePdfSource(() => saved.clear());
  const [size, setSize] = useState<SizeChoice>('a4');
  const [customW, setCustomW] = useState('216');
  const [customH, setCustomH] = useState('330');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [fit, setFit] = useState<FitMode>('fit');
  const [margin, setMargin] = useState('0');
  const [keepMatching, setKeepMatching] = useState(true);
  const [sizes, setSizes] = useState<{ w: number; h: number }[]>([]);
  const [busy, setBusy] = useState(false);

  const bytes = pdf.source?.bytes;
  useEffect(() => {
    let live = true;
    setSizes([]);
    if (bytes) readPageSizes(bytes).then((list) => { if (live) setSizes(list); }).catch(() => undefined);
    return () => { live = false; };
  }, [bytes]);

  const options: ResizeOptions = {
    size, orientation, fit, margin: Math.max(0, Number(margin) || 0) * MM, keepMatching,
    custom: { w: (Number(customW) || 0) * MM, h: (Number(customH) || 0) * MM },
  };
  const customOk = size !== 'custom' || ((Number(customW) || 0) >= 20 && (Number(customH) || 0) >= 20);
  const paperLabel = size === 'custom' ? `${customW} × ${customH} mm` : PAGE_SIZES[size].label;
  const matching = sizes.filter((shown) => sameSize(shown, targetFor(shown, options))).length;
  const scales = sizes.length ? fitScales(sizes, options) : [];
  const smallest = scales.length ? Math.min(...scales) : 1;
  const largest = scales.length ? Math.max(...scales) : 1;

  const settingsKey = JSON.stringify([pdf.source?.name, pdf.source?.size, size, customW, customH, orientation, fit, margin, keepMatching]);
  const outdated = saved.isOutdated(settingsKey);
  const startOver = () => { saved.clear(); pdf.clear(); };

  const run = async () => {
    if (!pdf.source || !customOk) return;
    setBusy(true); pdf.setMessage('');
    try {
      const out = await resizePdf(pdf.source.bytes, options);
      const kept = keepMatching && matching > 0 ? (matching === 1 ? ', 1 was already the right size and kept as it was' : `, ${matching} were already the right size and kept as they were`) : '';
      saved.set(new Blob([out as BlobPart], { type: 'application/pdf' }), generateFileName('resized', 'pdf', { base: pdf.source.name, details: size }), { key: settingsKey, detail: `${pdf.source.pages} pages on ${paperLabel}${kept}` });
    } catch { pdf.setMessage('Could not resize this PDF. If it is damaged, try the Sanitize PDF tool first.'); } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {pdf.dialog}
      {!pdf.source && <UploadNote>Choose the paper size, and every page is redrawn on it. You see what size your pages are now, and how much they will shrink, before you save.</UploadNote>}
      {!pdf.source ? <FileDropZone accept=".pdf,application/pdf" readingPdf={pdf.reading} disabled={pdf.reading} onFiles={(files) => { void pdf.open(files); }} /> : <PdfFileBar name={pdf.source.name} size={pdf.source.size} pages={pdf.source.pages} onChange={startOver} />}

      {pdf.source && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>New page size</h2>
          {sizes.length > 0 && <p className="text-xs text-slate-700"><span className="font-semibold text-slate-900">Your pages now:</span> {sizeSummary(sizes)}.</p>}
          <ChoiceButtons label="Paper size" value={size} onChange={(value) => setSize(value as SizeChoice)} options={[...Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label })), { value: 'custom', label: 'Custom (mm)' }]} />
          {size === 'custom' && (
            <div className="flex flex-wrap gap-3">
              <label className="block text-xs font-semibold text-slate-700">Width (mm)<input type="number" min={20} max={1200} value={customW} onChange={(event) => setCustomW(event.target.value)} className={`${fieldClass} w-28`} /></label>
              <label className="block text-xs font-semibold text-slate-700">Height (mm)<input type="number" min={20} max={1200} value={customH} onChange={(event) => setCustomH(event.target.value)} className={`${fieldClass} w-28`} /></label>
              {!customOk && <p role="alert" className="w-full text-xs text-amber-800">Enter a width and a height of at least 20 mm.</p>}
            </div>
          )}
          <ChoiceButtons label="Orientation" value={orientation} onChange={(value) => setOrientation(value as Orientation)} options={[{ value: 'auto', label: 'Keep each page as it is' }, { value: 'portrait', label: 'All portrait' }, { value: 'landscape', label: 'All landscape' }]} />
          <ChoiceButtons label="How the page fits" value={fit} onChange={(value) => setFit(value as FitMode)} options={[{ value: 'fit', label: 'Fit whole page' }, { value: 'fill', label: 'Fill the page (edges may be cut)' }, { value: 'stretch', label: 'Stretch' }]} />
          <label className="block text-xs font-semibold text-slate-700">Margin (mm)<input type="number" min={0} max={40} value={margin} onChange={(event) => setMargin(event.target.value)} className={`${fieldClass} w-28`} /></label>
          {matching > 0 && (
            <Toggle
              label={matching === sizes.length ? `Leave the pages that are already ${paperLabel} unchanged` : matching === 1 ? `Leave the 1 page that is already ${paperLabel} unchanged` : `Leave the ${matching} pages that are already ${paperLabel} unchanged`}
              hint="They are copied as they are, so their links and form fields are kept and nothing is scaled."
              checked={keepMatching}
              onChange={setKeepMatching}
            />
          )}
          {sizes.length > 0 && matching === sizes.length && keepMatching && <Note>Every page is already {paperLabel}. Turn the option above off if you want to add a margin or change the fit anyway.</Note>}
          {sizes.length > 0 && fit === 'fit' && smallest < 0.85 && (
            <Note>Some pages will shrink to about {Math.round(smallest * 100)}% of their size, so small print may be hard to read. A larger paper size, a smaller margin or Fill keeps text bigger.</Note>
          )}
          {sizes.length > 0 && fit === 'fit' && smallest >= 0.85 && largest > 1.15 && (
            <p className="text-[11px] text-slate-500">Some pages will be enlarged to about {Math.round(largest * 100)}% of their size. Scanned pages may look softer when enlarged.</p>
          )}
        </div>
      )}
      {pdf.source && (!saved.result || outdated) && <MainActionButton onClick={() => void run()} busy={busy} busyLabel="Resizing..." disabled={!customOk}>Resize PDF</MainActionButton>}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label="Your resized PDF is ready" saveLabel="Save PDF" detail={saved.result.detail} outdated={outdated} />
          {!outdated && <StartOverButton onClick={startOver}>Resize another PDF</StartOverButton>}
        </div>
      )}
      {pdf.message && <Note>{pdf.message}</Note>}
    </section>
  );
};

export default ResizePdfPageSize;
