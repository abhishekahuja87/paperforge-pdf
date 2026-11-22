import React, { useState } from 'react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { card, heading } from '../paper/controls';
import { FileDropZone } from '../../common/FileDropZone';
import { UploadNote } from '../../common/UploadNote';
import { PdfFileBar } from '../../common/PdfFileBar';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { useResultFile } from '../../../lib/useResultFile';
import { generateFileName } from '../../../lib/pdf/naming';
import { PAGE_SIZES, resizePdf, type FitMode, type Orientation, type PageSizeId } from '../../../lib/more/pageSize';
import { usePdfSource } from './usePdfSource';

/** Change every page of a PDF to A4, Letter or another paper size, keeping text and pictures sharp. No limit on pages or file size beyond your device. */
export const ResizePdfPageSize: React.FC = () => {
  const saved = useResultFile();
  const pdf = usePdfSource(() => saved.clear());
  const [size, setSize] = useState<PageSizeId>('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [fit, setFit] = useState<FitMode>('fit');
  const [margin, setMargin] = useState('0');
  const [busy, setBusy] = useState(false);

  const settingsKey = JSON.stringify([pdf.source?.name, pdf.source?.size, size, orientation, fit, margin]);
  const outdated = saved.isOutdated(settingsKey);
  const startOver = () => { saved.clear(); pdf.clear(); };

  const run = async () => {
    if (!pdf.source) return;
    setBusy(true); pdf.setMessage('');
    try {
      const out = await resizePdf(pdf.source.bytes, { size, orientation, fit, margin: Math.max(0, Number(margin) || 0) * 2.835 });
      saved.set(new Blob([out as BlobPart], { type: 'application/pdf' }), generateFileName('resized', 'pdf', { base: pdf.source.name, details: size }), { key: settingsKey, detail: `${pdf.source.pages} pages on ${PAGE_SIZES[size].label}` });
    } catch { pdf.setMessage('Could not resize this PDF. If it is damaged, try the Sanitize PDF tool first.'); } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {pdf.dialog}
      {!pdf.source && <UploadNote>Choose the paper size, and every page is redrawn on it.</UploadNote>}
      {!pdf.source ? <FileDropZone accept=".pdf,application/pdf" readingPdf={pdf.reading} disabled={pdf.reading} onFiles={(files) => { void pdf.open(files); }} /> : <PdfFileBar name={pdf.source.name} size={pdf.source.size} pages={pdf.source.pages} onChange={startOver} />}

      {pdf.source && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>New page size</h2>
          <ChoiceButtons label="Paper size" value={size} onChange={(value) => setSize(value as PageSizeId)} options={Object.entries(PAGE_SIZES).map(([value, item]) => ({ value, label: item.label }))} />
          <ChoiceButtons label="Orientation" value={orientation} onChange={(value) => setOrientation(value as Orientation)} options={[{ value: 'auto', label: 'Keep each page as it is' }, { value: 'portrait', label: 'All portrait' }, { value: 'landscape', label: 'All landscape' }]} />
          <ChoiceButtons label="How the page fits" value={fit} onChange={(value) => setFit(value as FitMode)} options={[{ value: 'fit', label: 'Fit whole page' }, { value: 'fill', label: 'Fill the page (edges may be cut)' }, { value: 'stretch', label: 'Stretch' }]} />
          <label className="block text-xs font-semibold text-slate-700">Margin (mm)<input type="number" min={0} max={40} value={margin} onChange={(event) => setMargin(event.target.value)} className={`${fieldClass} w-28`} /></label>
        </div>
      )}
      {pdf.source && (!saved.result || outdated) && <MainActionButton onClick={() => void run()} busy={busy} busyLabel="Resizing...">Resize PDF</MainActionButton>}
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
