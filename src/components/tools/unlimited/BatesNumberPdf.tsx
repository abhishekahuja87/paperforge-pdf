import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons, fieldClass } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { FileDropZone } from '../../common/FileDropZone';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { useProtectedPdf } from '../../common/ProtectedPdfGate';
import { formatFileSize } from '../../../lib/pdf/fileName';
import { useResultFile } from '../../../lib/useResultFile';
import { fillTemplate, formatBates, type StampSpot } from '../../../lib/unlimited/bates';
import { displaySize, displayToPage, normRotation } from '../../../lib/unlimited/geometry';

const SPOTS: { value: StampSpot; label: string }[] = [
  { value: 'top-left', label: 'Top left' }, { value: 'top-center', label: 'Top middle' }, { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' }, { value: 'bottom-center', label: 'Bottom middle' }, { value: 'bottom-right', label: 'Bottom right' },
];
const SUPPORTED = /^[\x20-\x7E\xA0-\xFF]*$/;
const COLORS = { black: [0.07, 0.07, 0.07], grey: [0.35, 0.35, 0.35], blue: [0.11, 0.3, 0.85] } as const;
const tick = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));
const today = () => new Date().toLocaleDateString('en-GB');

/** Number every page across one or many PDFs (Bates numbers) and add header and footer text. No limit on files or pages; done in your browser. */
export const BatesNumberPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const saved = useResultFile();
  const [files, setFiles] = useState<File[]>([]);
  const [stampNumber, setStampNumber] = useState(true);
  const [spot, setSpot] = useState<StampSpot>('bottom-right');
  const [prefix, setPrefix] = useState('ABC-');
  const [start, setStart] = useState('1');
  const [digits, setDigits] = useState('6');
  const [suffix, setSuffix] = useState('');
  const [header, setHeader] = useState('');
  const [headerSpot, setHeaderSpot] = useState<StampSpot>('top-center');
  const [footer, setFooter] = useState('');
  const [footerSpot, setFooterSpot] = useState<StampSpot>('bottom-left');
  const [size, setSize] = useState('9');
  const [color, setColor] = useState<keyof typeof COLORS>('black');
  const [continueAcross, setContinueAcross] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');

  const settingsKey = JSON.stringify([files.map((file) => `${file.name}:${file.size}`), stampNumber, spot, prefix, start, digits, suffix, header, headerSpot, footer, footerSpot, size, color, continueAcross]);
  const outdated = saved.isOutdated(settingsKey);
  const addFiles = async (chosen: File[]) => {
    const accepted: File[] = [];
    for (const file of chosen.filter((item) => /pdf$/i.test(item.type) || /\.pdf$/i.test(item.name))) {
      const ready = await prepare(file);
      if (ready) accepted.push(ready);
    }
    if (accepted.length) { setMessage(''); setFiles((list) => [...list, ...accepted]); }
  };
  const startOver = () => { saved.clear(); setFiles([]); setMessage(''); };

  const startNumber = Math.max(0, Math.floor(Number(start)) || 0);
  const sample = formatBates(prefix, startNumber, Number(digits) || 1, suffix);

  const move = (index: number, by: number) => setFiles((list) => { const next = [...list]; const to = index + by; if (to < 0 || to >= next.length) return list; [next[index], next[to]] = [next[to]!, next[index]!]; return next; });

  const run = async () => {
    if (files.length === 0) return;
    const texts = [prefix, suffix, header, footer].join('');
    if (!SUPPORTED.test(texts)) { setMessage('Only letters, digits and keyboard symbols can be stamped. Remove other characters, such as the rupee sign or Hindi letters.'); return; }
    if (!stampNumber && !header.trim() && !footer.trim()) { setMessage('Turn on the Bates number, or type a header or footer.'); return; }
    setBusy(true); setMessage('');
    try {
      const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib');
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let counter = startNumber; let stamped = 0;
      const fontSize = Math.max(5, Math.min(24, Number(size) || 9));
      const margin = 24;
      const [cr, cg, cb] = COLORS[color];
      for (const [fileIndex, file] of files.entries()) {
        setProgress(`File ${fileIndex + 1} of ${files.length}…`);
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
        const font = await doc.embedFont(StandardFonts.Helvetica);
        if (!continueAcross) counter = startNumber;
        const count = doc.getPageCount();
        const base = file.name.replace(/\.pdf$/i, '');
        doc.getPages().forEach((page, index) => {
          const { width, height } = page.getSize();
          const rotation = normRotation(page.getRotation().angle);
          const shown = displaySize(rotation, width, height);
          const put = (text: string, where: StampSpot) => {
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const dx = where.endsWith('left') ? margin : where.endsWith('right') ? shown.w - margin - textWidth : (shown.w - textWidth) / 2;
            const dy = where.startsWith('top') ? margin + fontSize * 0.8 : shown.h - margin;
            const origin = displayToPage(rotation, width, height, dx, dy);
            page.drawText(text, { x: origin.x, y: origin.y, size: fontSize, font, color: rgb(cr, cg, cb), ...(rotation ? { rotate: degrees(rotation) } : {}) });
          };
          const values = { page: index + 1, pages: count, file: base, date: today() };
          if (stampNumber) { put(formatBates(prefix, counter, Number(digits) || 1, suffix), spot); counter += 1; stamped += 1; }
          if (header.trim()) put(fillTemplate(header, values), headerSpot);
          if (footer.trim()) put(fillTemplate(footer, values), footerSpot);
        });
        const out = await doc.save();
        if (files.length === 1) { saved.set(new Blob([out as BlobPart], { type: 'application/pdf' }), `${base}-stamped.pdf`, { key: settingsKey, detail: stampNumber ? `Numbers ${sample} to ${formatBates(prefix, counter - 1, Number(digits) || 1, suffix)}` : undefined }); return; }
        zip.file(`${base}-stamped.pdf`, out);
        await tick();
      }
      setProgress('Making the ZIP…');
      saved.set(await zip.generateAsync({ type: 'blob' }), 'stamped-pdfs.zip', { key: settingsKey, detail: stampNumber ? `Numbers ${sample} to ${formatBates(prefix, counter - 1, Number(digits) || 1, suffix)} (${stamped} pages)` : undefined });
    } catch { setMessage('Could not stamp one of the files. If a PDF is protected, unlock it first, then try again.'); }
    finally { setBusy(false); setProgress(''); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {passwordDialog}
      <FileDropZone accept=".pdf,application/pdf" multiple onFiles={(chosen) => { void addFiles(chosen); }} />
      {files.length > 0 && (
        <div className="space-y-2">
          <ol className="space-y-1">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700">
                <span className="min-w-0 flex-1 break-all">{index + 1}. {file.name} <span className="text-stone-400">({formatFileSize(file.size)})</span></span>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${file.name} up`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === files.length - 1} aria-label={`Move ${file.name} down`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => setFiles((list) => list.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-red-700 hover:bg-stone-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-stone-500">The order here is the order of the numbers.</p>
        </div>
      )}

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>What to stamp</h2>
        <Toggle label="Running page number (Bates number)" checked={stampNumber} onChange={setStampNumber} />
        {stampNumber && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-xs font-semibold text-slate-700">Before the number<input value={prefix} maxLength={20} onChange={(event) => setPrefix(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Start at<input type="number" min={0} value={start} onChange={(event) => setStart(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Digits<input type="number" min={1} max={12} value={digits} onChange={(event) => setDigits(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700">After the number<input value={suffix} maxLength={20} onChange={(event) => setSuffix(event.target.value)} className={fieldClass} /></label>
            </div>
            <ChoiceButtons label="Number position" value={spot} onChange={(value) => setSpot(value as StampSpot)} options={SPOTS} />
            <Toggle label="Keep counting from one file to the next" hint="Turn off to start again at the first number in every file." checked={continueAcross} onChange={setContinueAcross} />
            <p className="text-xs text-slate-600">First stamp: <span className="font-bold text-slate-900">{sample}</span></p>
          </>
        )}
        <label className="block text-xs font-semibold text-slate-700">Header text (optional)<input value={header} maxLength={120} onChange={(event) => setHeader(event.target.value)} placeholder="Confidential - {file}" className={fieldClass} /></label>
        {header.trim() && <ChoiceButtons label="Header position" value={headerSpot} onChange={(value) => setHeaderSpot(value as StampSpot)} options={SPOTS} />}
        <label className="block text-xs font-semibold text-slate-700">Footer text (optional)<input value={footer} maxLength={120} onChange={(event) => setFooter(event.target.value)} placeholder="Page {page} of {pages}" className={fieldClass} /></label>
        {footer.trim() && <ChoiceButtons label="Footer position" value={footerSpot} onChange={(value) => setFooterSpot(value as StampSpot)} options={SPOTS} />}
        <p className="text-[11px] text-slate-500">In header and footer text, {'{page}'}, {'{pages}'}, {'{file}'} and {'{date}'} are replaced for each page.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-700">Text size (pt)<input type="number" min={5} max={24} value={size} onChange={(event) => setSize(event.target.value)} className={fieldClass} /></label>
          <div><p className="mb-1.5 text-xs font-semibold text-slate-700">Colour</p><ChoiceButtons label="Colour" value={color} onChange={(value) => setColor(value as keyof typeof COLORS)} options={[{ value: 'black', label: 'Black' }, { value: 'grey', label: 'Grey' }, { value: 'blue', label: 'Blue' }]} /></div>
        </div>
      </div>
      {files.length > 0 && (!saved.result || outdated) && (
        <MainActionButton onClick={() => void run()} busy={busy} busyLabel={progress || 'Working...'}>{files.length > 1 ? 'Stamp all PDFs' : 'Stamp PDF'}</MainActionButton>
      )}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label={saved.result.name.endsWith('.zip') ? 'Your stamped PDFs are ready (ZIP)' : 'Your stamped PDF is ready'} saveLabel={saved.result.name.endsWith('.zip') ? 'Save ZIP' : 'Save PDF'} detail={saved.result.detail} outdated={outdated} />
          {!outdated && <StartOverButton onClick={startOver}>Stamp other PDFs</StartOverButton>}
        </div>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default BatesNumberPdf;
