import React, { useMemo, useState } from 'react';
import { CalcFooter, Note, SelectField, calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from '../utilities/common';
import { buildCitation, emptyCitation, toHtml, toPlainText, type CitationInput, type CitationStyle, type SourceType } from '../../../lib/students/citation';
import { RowButton, nextRowId } from '../shared/rows';

const STYLES: { value: CitationStyle; label: string }[] = [
  { value: 'apa', label: 'APA 7' }, { value: 'mla', label: 'MLA 9' }, { value: 'chicago', label: 'Chicago (author-date)' }, { value: 'harvard', label: 'Harvard' },
];

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string; type?: string }> = ({ label, value, onChange, placeholder, hint, type = 'text' }) => (
  <label className="block text-xs font-semibold text-slate-700">
    {label}
    <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
    {hint && <span className="mt-1 block text-[11px] font-normal text-slate-500">{hint}</span>}
  </label>
);

interface Saved { id: string; text: string; html: string }

const Rendered: React.FC<{ segments: { text: string; italic?: boolean }[] }> = ({ segments }) => (
  <>{segments.map((segment, index) => (segment.italic ? <i key={index}>{segment.text}</i> : <React.Fragment key={index}>{segment.text}</React.Fragment>))}</>
);

export const CitationGenerator: React.FC = () => {
  const [input, setInput] = useState<CitationInput>(emptyCitation);
  const [list, setList] = useState<Saved[]>([]);
  const [copied, setCopied] = useState(false);
  const set = (key: keyof CitationInput) => (value: string) => setInput((current) => ({ ...current, [key]: value }));
  const result = useMemo(() => buildCitation(input), [input]);
  const text = toPlainText(result.segments);
  const html = toHtml(result.segments);
  const ready = input.title.trim() !== '';
  const sorted = [...list].sort((a, b) => a.text.localeCompare(b.text));
  const isJournal = input.type === 'journal';
  const isBook = input.type === 'book';

  const copyFormatted = async (value: string, plain: string) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([value], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard formatting is not available in every browser; the plain-text copy button still works. */
    }
  };

  return (
    <section className={calcCard}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Citation style" value={input.style} onChange={(value) => set('style')(value)} options={STYLES} />
        <div>
          <p className="text-xs font-semibold text-slate-700">Source type</p>
          <div className="mt-1.5">
            <ChoiceButtons label="Source type" value={input.type} onChange={(value) => set('type')(value as SourceType)} options={[{ value: 'website', label: 'Website' }, { value: 'book', label: 'Book' }, { value: 'journal', label: 'Journal article' }]} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
          Authors (one per line)
          <textarea value={input.authors} onChange={(event) => set('authors')(event.target.value)} rows={3} placeholder={'Jane Doe\nPatel, Raj'} className={fieldClass} />
          <span className="mt-1 block text-[11px] font-normal text-slate-500">Write "First Last" or "Last, First". Leave empty if there is no author.</span>
        </label>
        <div className="sm:col-span-2"><Field label="Title" value={input.title} onChange={set('title')} placeholder={isJournal ? 'Title of the article' : isBook ? 'Title of the book' : 'Title of the page'} /></div>
        {!isBook && <Field label={isJournal ? 'Journal name' : 'Website name'} value={input.container} onChange={set('container')} />}
        {(isBook || input.type === 'website') && <Field label={isBook ? 'Publisher' : 'Publisher (if different from the website)'} value={input.publisher} onChange={set('publisher')} />}
        {isBook && <Field label="City of publication" value={input.place} onChange={set('place')} hint="Used by Chicago and Harvard" />}
        {isBook && <Field label="Edition" value={input.edition} onChange={set('edition')} placeholder="3rd" />}
        <Field label="Year" value={input.year} onChange={set('year')} placeholder="2024" />
        {input.type === 'website' && <Field label="Month (number or name)" value={input.month} onChange={set('month')} placeholder="3" />}
        {input.type === 'website' && <Field label="Day" value={input.day} onChange={set('day')} placeholder="5" />}
        {isJournal && <Field label="Volume" value={input.volume} onChange={set('volume')} />}
        {isJournal && <Field label="Issue" value={input.issue} onChange={set('issue')} />}
        {isJournal && <Field label="Pages" value={input.pages} onChange={set('pages')} placeholder="45-60" />}
        {isJournal && <Field label="DOI" value={input.doi} onChange={set('doi')} placeholder="10.1234/abcd" />}
        {input.type !== 'journal' && <Field label="Web address (URL)" value={input.url} onChange={set('url')} placeholder="https://" />}
        {input.type === 'website' && <Field label="Date you read it" type="date" value={input.accessed} onChange={set('accessed')} />}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your citation</p>
        {ready ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-900" data-testid="citation-output"><Rendered segments={result.segments} /></p>
        ) : <p className="mt-2 text-sm text-slate-500">Type a title to see the citation.</p>}
        {ready && result.missing.filter((item) => item !== 'title').length > 0 && (
          <p role="status" className="mt-2 text-xs text-amber-800">Missing: {result.missing.filter((item) => item !== 'title').join(', ')}. The citation is still shown, but most styles expect these details.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <CopyButton text={text} label="Copy as text" disabled={!ready} />
          <RowButton onClick={() => void copyFormatted(html, text)}>{copied ? 'Copied' : 'Copy with italics'}</RowButton>
          <RowButton onClick={() => { if (ready) setList((current) => [...current, { id: nextRowId(), text, html }]); }}>Add to reference list</RowButton>
          <RowButton onClick={() => setInput((current) => ({ ...emptyCitation(), style: current.style, type: current.type }))}>Clear form</RowButton>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-900">Reference list ({sorted.length})</h3>
          <p className="mt-1 text-xs text-slate-600">Sorted A to Z, as most styles require. Check that each entry is in the same style.</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-900">
            {sorted.map((item) => (
              <li key={item.id}>
                <span dangerouslySetInnerHTML={{ __html: item.html }} />{' '}
                <button type="button" onClick={() => setList((current) => current.filter((entry) => entry.id !== item.id))} className="text-xs font-semibold text-rose-700 underline print:hidden">Remove</button>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            <CopyButton text={sorted.map((item) => item.text).join('\n\n')} label="Copy the list" />
            <RowButton onClick={() => void copyFormatted(sorted.map((item) => `<p>${item.html}</p>`).join(''), sorted.map((item) => item.text).join('\n\n'))}>Copy list with italics</RowButton>
            <RowButton onClick={() => window.print()}>Print or save as PDF</RowButton>
          </div>
        </div>
      )}
      <Note>Style guides differ between editions and between teachers. This follows the common rules for each style; check your assignment brief or your library's style guide for special cases, such as many authors, missing dates or online-only sources. Nothing you type leaves this page.</Note>
      <CalcFooter />
    </section>
  );
};

export default CitationGenerator;
