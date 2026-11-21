import React, { useMemo, useState } from 'react';
import { FileUp } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { diffTokens, tokenize, type DiffUnit } from '../../../lib/safeshare/diff';
import { extractTextFromPdf } from '../../../lib/pdf/extractText';

const MAX_BYTES = 30 * 1024 * 1024;
type Source = 'text' | 'pdf';
interface Side { text: string; name: string }

const PdfPicker: React.FC<{ label: string; side: Side; onPick: (file: File | undefined) => void }> = ({ label, side, onPick }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-semibold text-slate-700">{label}</p>
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
      <FileUp className="h-4 w-4" aria-hidden="true" />{side.name ? 'Change PDF' : 'Choose a PDF'}
      <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { onPick(event.target.files?.[0]); event.target.value = ''; }} />
    </label>
    <p className="break-all text-[11px] text-slate-500">{side.name || 'No file chosen'}</p>
  </div>
);

/** Shows what changed between two versions of a document or text: what was removed, what was added and what stayed the same. */
export const ComparePdf: React.FC = () => {
  const [source, setSource] = useState<Source>('text');
  const [unit, setUnit] = useState<DiffUnit>('lines');
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [before, setBefore] = useState<Side>({ text: '', name: '' });
  const [after, setAfter] = useState<Side>({ text: '', name: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined, set: (side: Side) => void) => {
    if (!file) return;
    setMessage('');
    if (file.size > MAX_BYTES) { setMessage('That file is over 30 MB. Compress it first, then compare.'); return; }
    setBusy(true);
    try {
      const pages = await extractTextFromPdf(await file.arrayBuffer());
      const text = pages.map((p) => p.text).join('\n\n').trim();
      if (!text) setMessage(`${file.name} has no text to read. It may be a scan. Run it through Scan to Searchable PDF (OCR) first, then compare.`);
      set({ text, name: file.name });
    } catch { setMessage('Could not read that PDF. If it has a password, unlock it first.'); } finally { setBusy(false); }
  };

  const result = useMemo(() => {
    if (!before.text.trim() && !after.text.trim()) return null;
    const parts = diffTokens(tokenize(before.text, unit), tokenize(after.text, unit));
    if (!parts) return { parts: null, added: 0, removed: 0, same: 0 };
    const counted = (kind: string) => parts.filter((part) => part.kind === kind && part.text.trim() !== '').length;
    return { parts, added: counted('add'), removed: counted('del'), same: counted('same') };
  }, [before.text, after.text, unit]);

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. What do you want to compare?</h2>
        <ChoiceButtons label="Compare" value={source} onChange={(value) => setSource(value as Source)} options={[{ value: 'text', label: 'Pasted text' }, { value: 'pdf', label: 'Two PDF files' }]} />
        {source === 'text' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">Old version
              <textarea value={before.text} onChange={(event) => setBefore({ text: event.target.value, name: '' })} rows={8} className={fieldClass} placeholder="Paste the first version here" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">New version
              <textarea value={after.text} onChange={(event) => setAfter({ text: event.target.value, name: '' })} rows={8} className={fieldClass} placeholder="Paste the changed version here" />
            </label>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <PdfPicker label="Old version (PDF)" side={before} onPick={(file) => void pick(file, setBefore)} />
            <PdfPicker label="New version (PDF)" side={after} onPick={(file) => void pick(file, setAfter)} />
          </div>
        )}
        {busy && <p className="text-xs text-slate-600">Reading the PDF…</p>}
        <p className="text-[11px] text-slate-500">Your text and files stay on your device. Nothing is uploaded.</p>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>2. What changed</h2>
        <ChoiceButtons label="Compare by" value={unit} onChange={(value) => setUnit(value as DiffUnit)} options={[{ value: 'lines', label: 'Whole lines' }, { value: 'words', label: 'Word by word' }]} />
        {unit === 'lines' && <Toggle label="Show only the changed lines" checked={onlyChanges} onChange={setOnlyChanges} />}
        {!result && <p className="text-xs text-slate-600">Add both versions to see the differences.</p>}
        {result && !result.parts && <Note>These two texts are very long and very different, so they cannot be compared on this device. Compare a few pages at a time.</Note>}
        {result?.parts && (
          <>
            <p className="text-xs font-semibold text-slate-800" role="status">
              {result.added === 0 && result.removed === 0 ? 'No difference found: the two versions have the same text.' : `${result.removed} removed, ${result.added} added, ${result.same} unchanged (${unit === 'lines' ? 'lines' : 'words'}).`}
            </p>
            {unit === 'lines' ? (
              <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 text-xs">
                {result.parts.filter((part) => !onlyChanges || part.kind !== 'same').map((part, index) => (
                  <div key={index} className={`flex gap-2 whitespace-pre-wrap break-words px-3 py-1 ${part.kind === 'add' ? 'bg-emerald-50 text-emerald-900' : part.kind === 'del' ? 'bg-red-50 text-red-900 line-through' : 'text-slate-700'}`}>
                    <span aria-hidden="true" className="w-3 shrink-0 font-bold">{part.kind === 'add' ? '+' : part.kind === 'del' ? '−' : ''}</span>
                    <span className="sr-only">{part.kind === 'add' ? 'Added: ' : part.kind === 'del' ? 'Removed: ' : ''}</span>
                    <span className="min-w-0">{part.text || ' '}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 p-3 text-sm leading-relaxed text-slate-800">
                {result.parts.map((part, index) => part.kind === 'same' ? <span key={index}>{part.text}</span>
                  : part.kind === 'add' ? <ins key={index} className="rounded bg-emerald-100 text-emerald-900 no-underline"><span className="sr-only">Added: </span>{part.text}</ins>
                  : <del key={index} className="rounded bg-red-100 text-red-900"><span className="sr-only">Removed: </span>{part.text}</del>)}
              </p>
            )}
            <p className="text-[11px] text-slate-500">Red with a line through = in the old version only. Green = in the new version only.</p>
          </>
        )}
      </div>
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default ComparePdf;
