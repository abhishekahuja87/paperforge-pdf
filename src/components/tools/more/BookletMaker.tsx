import React, { useState } from 'react';
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
import { bookletPlan, makeBooklet } from '../../../lib/more/booklet';
import { PAGE_SIZES, type PageSizeId } from '../../../lib/more/pageSize';
import { usePdfSource } from './usePdfSource';

const PAPERS: PageSizeId[] = ['a4', 'a3', 'letter', 'legal', 'tabloid'];
/** Sheets per folded set. 0 = one booklet. Sets of 4 to 8 sheets fold flat on office paper. */
const SET_SIZES = ['0', '4', '5', '6', '8'];

/** Put the pages of a PDF in booklet order, two to a sheet, to print double-sided and fold. No limit on pages or file size beyond your device. */
export const BookletMaker: React.FC = () => {
  const saved = useResultFile();
  const pdf = usePdfSource(() => saved.clear());
  const [paper, setPaper] = useState<PageSizeId>('a4');
  const [rightToLeft, setRightToLeft] = useState(false);
  const [gutter, setGutter] = useState('10');
  const [backCover, setBackCover] = useState(false);
  const [setSize, setSetSize] = useState('0');
  const [printer, setPrinter] = useState<'both' | 'one'>('both');
  const [reverseBacks, setReverseBacks] = useState(false);
  const [rotateBacks, setRotateBacks] = useState(false);
  const [busy, setBusy] = useState(false);

  const manual = printer === 'one';
  const sheetsPerSet = Number(setSize) || 0;
  const settingsKey = JSON.stringify([pdf.source?.name, pdf.source?.size, paper, rightToLeft, gutter, backCover, setSize, printer, reverseBacks, rotateBacks]);
  const outdated = saved.isOutdated(settingsKey);
  const startOver = () => { saved.clear(); pdf.clear(); };
  const pages = pdf.source?.pages ?? 0;
  const plan = pages > 0 ? bookletPlan(pages, rightToLeft, { backCover, sheetsPerSet }) : null;
  const sheets = plan?.sheets ?? 0;
  const blanks = plan?.blanks ?? 0;
  const sets = plan?.sets.length ?? 0;
  const showPreview = pages > 0 && pages <= 48;
  const pageLabel = (n: number) => (n < 0 ? 'blank' : String(n + 1));

  const run = async () => {
    if (!pdf.source) return;
    setBusy(true); pdf.setMessage('');
    try {
      const result = await makeBooklet(pdf.source.bytes, { paper, rightToLeft, gutter: Math.max(0, Number(gutter) || 0) * 2.835, backCover, sheetsPerSet, manualDuplex: manual, reverseBacks, rotateBacks });
      const setText = result.sets > 1 ? `, in ${result.sets} sets to fold separately` : '';
      saved.set(new Blob([result.pdf as BlobPart], { type: 'application/pdf' }), generateFileName('booklet', 'pdf', { base: pdf.source.name }), { key: settingsKey, detail: `${result.sheets} sheets of paper, ${result.sheets * 2} printed sides${setText}` });
    } catch { pdf.setMessage('Could not make a booklet from this PDF. If it is damaged, try the Sanitize PDF tool first.'); } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {pdf.dialog}
      {!pdf.source && <UploadNote>Your pages are reordered and placed two to a sheet, ready to print on both sides and fold. Works with printers that print one side only, too.</UploadNote>}
      {!pdf.source ? <FileDropZone accept=".pdf,application/pdf" readingPdf={pdf.reading} disabled={pdf.reading} onFiles={(files) => { void pdf.open(files); }} /> : <PdfFileBar name={pdf.source.name} size={pdf.source.size} pages={pdf.source.pages} onChange={startOver} />}

      {pdf.source && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>Booklet settings</h2>
          <ChoiceButtons label="Paper to print on" value={paper} onChange={(value) => setPaper(value as PageSizeId)} options={PAPERS.map((value) => ({ value, label: PAGE_SIZES[value].label }))} />
          <ChoiceButtons label="Your printer" value={printer} onChange={(value) => setPrinter(value as 'both' | 'one')} options={[{ value: 'both', label: 'Prints both sides' }, { value: 'one', label: 'One side only (I turn the paper)' }]} />
          {manual && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Toggle label="Put the backs in reverse order" hint="Turn on if your printer drops pages face up, so the last front ends up on top." checked={reverseBacks} onChange={setReverseBacks} />
              <Toggle label="Turn the backs upside down" hint="Turn on if a test sheet came out with the back printed upside down." checked={rotateBacks} onChange={setRotateBacks} />
            </div>
          )}
          <ChoiceButtons label="Fold as" value={setSize} onChange={setSetSize} options={SET_SIZES.map((value) => ({ value, label: value === '0' ? 'One booklet' : `Sets of ${value} sheets` }))} />
          <p className="text-[11px] text-slate-500">More than about 8 to 10 sheets folded together will not lie flat. For a thick booklet, fold each set on its own and stack the sets in order before stapling or stitching.</p>
          <Toggle label="Keep the last page as the back cover" hint="Blank pages go just before the last page instead of after it." checked={backCover} onChange={setBackCover} />
          <label className="block text-xs font-semibold text-slate-700">Space around each page (mm)<input type="number" min={0} max={30} value={gutter} onChange={(event) => setGutter(event.target.value)} className={`${fieldClass} w-28`} /></label>
          <Toggle label="Right-to-left book" hint="For Urdu, Arabic and Hebrew books, which open from the other side." checked={rightToLeft} onChange={setRightToLeft} />
          <p className="text-xs text-slate-700">
            {pages} pages need <span className="font-bold text-slate-900">{sheets} sheets of paper</span>
            {blanks > 0 ? `, with ${blanks} blank ${blanks === 1 ? 'page' : 'pages'} added ${backCover ? 'before the last page' : 'at the end'}` : ''}
            {sets > 1 ? `, folded as ${sets} sets` : ''}.
          </p>
          {showPreview && plan && (
            <div className="space-y-2" aria-label="Pages on each printed side">
              {plan.sets.map((setSides, setIndex) => (
                <div key={setIndex}>
                  {sets > 1 && <p className="mb-1 text-[11px] font-semibold text-slate-700">Set {setIndex + 1}</p>}
                  <ol className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 sm:grid-cols-4">
                    {setSides.map((side, index) => <li key={index} className="rounded-lg border border-slate-200 px-2 py-1">{index % 2 === 0 ? 'Front' : 'Back'} of sheet {Math.floor(index / 2) + 1}: {side.map(pageLabel).join(' | ')}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {pdf.source && (!saved.result || outdated) && <MainActionButton onClick={() => void run()} busy={busy} busyLabel="Making the booklet...">Make booklet</MainActionButton>}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label="Your booklet is ready" saveLabel="Save PDF" detail={saved.result.detail} outdated={outdated} />
          {!outdated && !manual && <Note>To print: choose double-sided, flip on the short edge, and print at 100% (actual size). Fold {sets > 1 ? 'each set in half, stack the sets in order' : 'the stack in half'} and staple along the fold.</Note>}
          {!outdated && manual && (
            <Note>
              {`To print on a one-sided printer: 1) Print pages 1 to ${sheets} at 100% (actual size); these are the fronts. 2) Put the printed stack back in the paper tray, printed side as your printer needs for the second side, with the top edge going in the same way. 3) Print pages ${sheets + 1} to ${sheets * 2}; these are the backs. Try one sheet first (pages 1 and ${sheets + 1}). If the back comes out upside down, turn on "Turn the backs upside down"; if fronts and backs do not match, turn on "Put the backs in reverse order", then make the booklet again.`}
            </Note>
          )}
          {!outdated && <StartOverButton onClick={startOver}>Make another booklet</StartOverButton>}
        </div>
      )}
      {pdf.message && <Note>{pdf.message}</Note>}
    </section>
  );
};

export default BookletMaker;
