import React, { useState } from 'react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { FileDropZone } from '../../common/FileDropZone';
import { UploadNote } from '../../common/UploadNote';
import { PdfFileBar } from '../../common/PdfFileBar';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { useResultFile } from '../../../lib/useResultFile';
import { generateFileName } from '../../../lib/pdf/naming';
import { bookletSides, makeBooklet } from '../../../lib/more/booklet';
import { PAGE_SIZES, type PageSizeId } from '../../../lib/more/pageSize';
import { usePdfSource } from './usePdfSource';

const PAPERS: PageSizeId[] = ['a4', 'a3', 'letter', 'legal', 'tabloid'];

/** Put the pages of a PDF in booklet order, two to a sheet, to print double-sided and fold. No limit on pages or file size beyond your device. */
export const BookletMaker: React.FC = () => {
  const saved = useResultFile();
  const pdf = usePdfSource(() => saved.clear());
  const [paper, setPaper] = useState<PageSizeId>('a4');
  const [rightToLeft, setRightToLeft] = useState(false);
  const [gutter, setGutter] = useState('10');
  const [busy, setBusy] = useState(false);

  const settingsKey = JSON.stringify([pdf.source?.name, pdf.source?.size, paper, rightToLeft, gutter]);
  const outdated = saved.isOutdated(settingsKey);
  const startOver = () => { saved.clear(); pdf.clear(); };
  const pages = pdf.source?.pages ?? 0;
  const sheets = Math.ceil(pages / 4);
  const blanks = sheets * 4 - pages;
  const preview = pages > 0 && pages <= 24 ? bookletSides(pages, rightToLeft) : [];

  const run = async () => {
    if (!pdf.source) return;
    setBusy(true); pdf.setMessage('');
    try {
      const result = await makeBooklet(pdf.source.bytes, { paper, rightToLeft, gutter: Math.max(0, Number(gutter) || 0) * 2.835 });
      saved.set(new Blob([result.pdf as BlobPart], { type: 'application/pdf' }), generateFileName('booklet', 'pdf', { base: pdf.source.name }), { key: settingsKey, detail: `${result.sheets} sheets of paper, ${result.sheets * 2} printed sides` });
    } catch { pdf.setMessage('Could not make a booklet from this PDF. If it is damaged, try the Sanitize PDF tool first.'); } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {pdf.dialog}
      {!pdf.source && <UploadNote>Your pages are reordered and placed two to a sheet, ready to print on both sides and fold.</UploadNote>}
      {!pdf.source ? <FileDropZone accept=".pdf,application/pdf" readingPdf={pdf.reading} disabled={pdf.reading} onFiles={(files) => { void pdf.open(files); }} /> : <PdfFileBar name={pdf.source.name} size={pdf.source.size} pages={pdf.source.pages} onChange={startOver} />}

      {pdf.source && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>Booklet settings</h2>
          <ChoiceButtons label="Paper to print on" value={paper} onChange={(value) => setPaper(value as PageSizeId)} options={PAPERS.map((value) => ({ value, label: PAGE_SIZES[value].label }))} />
          <label className="block text-xs font-semibold text-slate-700">Space around each page (mm)<input type="number" min={0} max={30} value={gutter} onChange={(event) => setGutter(event.target.value)} className={`${fieldClass} w-28`} /></label>
          <Toggle label="Right-to-left book" hint="For Urdu, Arabic and Hebrew books, which open from the other side." checked={rightToLeft} onChange={setRightToLeft} />
          <p className="text-xs text-slate-700">{pages} pages need <span className="font-bold text-slate-900">{sheets} sheets of paper</span>{blanks > 0 ? `, with ${blanks} blank ${blanks === 1 ? 'page' : 'pages'} added at the end` : ''}.</p>
          {preview.length > 0 && (
            <ol className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 sm:grid-cols-4" aria-label="Pages on each printed side">
              {preview.map((side, index) => <li key={index} className="rounded-lg border border-slate-200 px-2 py-1">{index % 2 === 0 ? 'Front' : 'Back'} {Math.floor(index / 2) + 1}: {side.map((n) => (n < 0 ? 'blank' : n + 1)).join(' | ')}</li>)}
            </ol>
          )}
        </div>
      )}
      {pdf.source && (!saved.result || outdated) && <MainActionButton onClick={() => void run()} busy={busy} busyLabel="Making the booklet...">Make booklet</MainActionButton>}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label="Your booklet is ready" saveLabel="Save PDF" detail={saved.result.detail} outdated={outdated} />
          {!outdated && <Note>To print: choose double-sided, flip on the short edge, and print at 100% (actual size). Fold the stack in half and staple along the fold.</Note>}
          {!outdated && <StartOverButton onClick={startOver}>Make another booklet</StartOverButton>}
        </div>
      )}
      {pdf.message && <Note>{pdf.message}</Note>}
    </section>
  );
};

export default BookletMaker;
