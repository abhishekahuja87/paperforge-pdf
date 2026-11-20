import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileDropZone } from '../../common/FileDropZone';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Slider, card, heading } from '../paper/controls';
import { formatBytes } from '../../../lib/browserTools';
import { ACCENTS, DEFAULT_STYLE, MARGIN_LABELS, PAPERS, SPACING_LABELS, THEMES, docCss, type DocStyle, type MarginId, type PaperId, type SpacingId, type ThemeId } from '../../../lib/secure/docStyle';
import { sdSanitize } from '../../../lib/secure/sanitizeCore.js';
import { TEMPLATES, templateById, type DocTemplate } from '../../../lib/secure/templates';
import { forget, keep, recall } from '../../../lib/secure/memory';
import { DocumentEditor } from './DocumentEditor';
import { LockPanel, MAX_BYTES, type Prepared } from './LockPanel';

type Mode = 'doc' | 'file';

const PAGES: { mode: Mode; path: string; label: string; hint: string }[] = [
  { mode: 'doc', path: '/password-protected-document-maker', label: 'Write a document', hint: 'Letters, notices, quotes' },
  { mode: 'file', path: '/lock-a-file-with-password', label: 'Lock a file I already have', hint: 'PDF, Word, Excel, photo, ZIP' },
];

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const chip = (active: boolean) => `rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${active ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`;

const WriteDocument: React.FC = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const start = useRef(recall());
  const [title, setTitle] = useState(start.current?.title ?? '');
  const [style, setStyle] = useState<DocStyle>(start.current?.style ?? { ...DEFAULT_STYLE });
  const [header, setHeader] = useState(start.current?.header ?? '');
  const [footer, setFooter] = useState(start.current?.footer ?? '');
  const [watermark, setWatermark] = useState(start.current?.watermark ?? '');
  const [template, setTemplate] = useState(start.current?.template ?? '');
  const [words, setWords] = useState(0);
  const [blanks, setBlanks] = useState(0);
  const [confirm, setConfirm] = useState<DocTemplate | null>(null);

  const html = useRef(start.current?.html ?? '');
  const latest = useRef({ title, style, header, footer, watermark, template });
  latest.current = { title, style, header, footer, watermark, template };

  // Bring back what was written before moving between pages; keep it again when leaving.
  useEffect(() => {
    const el = editorRef.current;
    if (el && start.current?.html) { el.innerHTML = start.current.html; el.dispatchEvent(new Event('input', { bubbles: true })); }
    // The editor element is already gone when this runs, so the last text is kept in a ref by onChange.
    return () => { keep({ html: html.current, ...latest.current }); };
  }, []);

  const set = (patch: Partial<DocStyle>) => setStyle((s) => ({ ...s, ...patch }));

  const onChange = (count: number) => {
    setWords(count);
    if (editorRef.current) html.current = editorRef.current.innerHTML;
    const text = editorRef.current?.textContent ?? '';
    setBlanks((text.match(/\[[^\]\n]{1,80}\]/g) ?? []).length);
  };

  const apply = (item: DocTemplate) => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = item.html;
    setStyle((s) => ({ ...s, ...item.style }));
    setHeader(item.header ?? '');
    setFooter(item.footer ?? '');
    setWatermark(item.watermark ?? '');
    setTemplate(item.id);
    setConfirm(null);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus({ preventScroll: true });
  };
  const pickTemplate = (item: DocTemplate) => { if (words > 0) setConfirm(item); else apply(item); };

  const prepare = async (): Promise<Prepared | string> => {
    const el = editorRef.current;
    if (!el) return 'The editor is not ready yet.';
    const copy = el.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('.sd-picked').forEach((node) => node.classList.remove('sd-picked'));
    if (!copy.textContent?.trim() && !copy.querySelector('img,table,hr')) return 'The page is empty. Write something or choose a template first.';
    const parts = [
      header.trim() ? `<div class="sd-header">${escapeHtml(header.trim())}</div>` : '',
      sdSanitize(copy.innerHTML),
      footer.trim() ? `<div class="sd-footer">${escapeHtml(footer.trim())}</div>` : '',
      watermark.trim() ? `<div class="sd-wm">${escapeHtml(watermark.trim().slice(0, 30))}</div>` : '',
    ];
    const name = title.trim() || 'Document';
    return { header: { m: 'doc', t: name, c: docCss(style) }, body: new TextEncoder().encode(parts.join('')), fileBase: name };
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-4">
        <details open className={card}>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">Start from a template <span className="font-normal text-slate-500">(or just type)</span></summary>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TEMPLATES.map((item) => (
              <button key={item.id} type="button" aria-pressed={template === item.id} onClick={() => pickTemplate(item)} className={`rounded-lg border px-2.5 py-2 text-left ${template === item.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                <span className="block text-[11px] text-slate-500">{item.hint}</span>
              </button>
            ))}
          </div>
          {confirm && (
            <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
              <span className="flex-1">Replace what you wrote with the "{templateById(confirm.id).label}" template?</span>
              <button type="button" onClick={() => apply(confirm)} className="min-h-9 rounded-md bg-orange-700 px-3 font-bold text-white">Replace</button>
              <button type="button" onClick={() => setConfirm(null)} className="min-h-9 rounded-md border border-amber-300 bg-white px-3 font-semibold">Keep mine</button>
            </div>
          )}
        </details>
        <DocumentEditor editorRef={editorRef} style={style} header={header} footer={footer} watermark={watermark} onChange={onChange} />
        {blanks > 0 && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">{blanks} placeholder{blanks === 1 ? '' : 's'} in [square brackets] still need your own words.</p>}
        <p className="text-[11px] text-slate-500">Tip: select text to style it. Tap a picture to resize it. Put the cursor in a table to add rows and columns. Pictures are shrunk to keep the locked file small.</p>
      </div>
      <div className="min-w-0 space-y-4">
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>Document</h2>
          <label className="block text-xs font-semibold text-slate-700">Title
            <span className="block text-[11px] font-normal text-slate-500">Used as the tab name and in the file name. It is locked with the document.</span>
            <input type="text" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Offer letter" className={fieldClass} />
          </label>
        </div>
        <details className={card}>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">Look and page <span className="font-normal text-slate-500">(theme, colour, paper)</span></summary>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-700">Theme</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(Object.entries(THEMES) as [ThemeId, { label: string; hint: string }][]).map(([id, item]) => (
                  <button key={id} type="button" aria-pressed={style.theme === id} onClick={() => set({ theme: id })} className={`rounded-lg border px-2.5 py-2 text-left ${style.theme === id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <span className="block text-xs font-bold text-slate-900">{item.label}</span><span className="block text-[11px] text-slate-500">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Accent colour</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {ACCENTS.map((item) => <button key={item.value} type="button" aria-label={item.label} aria-pressed={style.accent === item.value} onClick={() => set({ accent: item.value })} className={`h-8 w-8 rounded-full border-2 ${style.accent === item.value ? 'border-slate-900' : 'border-white ring-1 ring-slate-300'}`} style={{ background: item.value }} />)}
              </div>
            </div>
            <ChoiceButtons label="Paper" value={style.paper} onChange={(value) => set({ paper: value as PaperId })} options={Object.entries(PAPERS).map(([value, item]) => ({ value, label: item.label }))} />
            <ChoiceButtons label="Margins" value={style.margin} onChange={(value) => set({ margin: value as MarginId })} options={Object.entries(MARGIN_LABELS).map(([value, label]) => ({ value, label }))} />
            <ChoiceButtons label="Line spacing" value={style.spacing} onChange={(value) => set({ spacing: value as SpacingId })} options={Object.entries(SPACING_LABELS).map(([value, label]) => ({ value, label }))} />
            <Slider label="Text size" value={style.size} min={12} max={22} step={1} unit="px" onChange={(size) => set({ size })} />
            <label className="block text-xs font-semibold text-slate-700">Header line
              <input type="text" maxLength={90} value={header} onChange={(event) => setHeader(event.target.value)} placeholder="Company name · Confidential" className={fieldClass} />
            </label>
            <label className="block text-xs font-semibold text-slate-700">Footer line
              <input type="text" maxLength={90} value={footer} onChange={(event) => setFooter(event.target.value)} placeholder="Prepared for [name]" className={fieldClass} />
            </label>
            <label className="block text-xs font-semibold text-slate-700">Watermark
              <input type="text" maxLength={24} value={watermark} onChange={(event) => setWatermark(event.target.value)} placeholder="Confidential" className={fieldClass} />
              <span className="block text-[11px] font-normal text-slate-500">Faint text across the page, also when printed.</span>
            </label>
            <button type="button" onClick={() => { setStyle({ ...DEFAULT_STYLE }); setHeader(''); setFooter(''); setWatermark(''); }} className={chip(false)}>Reset the look</button>
          </div>
        </details>
        <LockPanel noun="document" prepare={prepare} />
        <button type="button" onClick={() => { const el = editorRef.current; if (el) { el.innerHTML = '<p><br></p>'; el.dispatchEvent(new Event('input', { bubbles: true })); } setTemplate(''); setTitle(''); setStyle({ ...DEFAULT_STYLE }); setHeader(''); setFooter(''); setWatermark(''); forget(); }} className={chip(false)}>Clear the page and start again</button>
      </div>
    </div>
  );
};

const LockFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [asPage, setAsPage] = useState(true);
  const [error, setError] = useState('');
  const isHtml = !!file && /\.html?$/i.test(file.name);

  const choose = (files: File[]) => {
    const next = files[0];
    if (!next) return;
    setError('');
    if (next.size > MAX_BYTES) { setFile(null); setError(`That file is ${formatBytes(next.size)}. The limit is ${formatBytes(MAX_BYTES)}, so the locked file still fits in an email.`); return; }
    setFile(next);
    setAsPage(/\.html?$/i.test(next.name));
  };

  const prepare = async (): Promise<Prepared | string> => {
    if (!file) return 'Choose a file first.';
    const body = new Uint8Array(await file.arrayBuffer());
    if (isHtml && asPage) return { header: { m: 'html', t: file.name }, body, fileBase: file.name };
    return { header: { m: 'file', t: file.name, n: file.name, y: file.type || 'application/octet-stream' }, body, fileBase: file.name };
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>Choose the file to lock</h2>
        <FileDropZone onFiles={choose} />
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900">{error}</p>}
        {file && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
            <p className="font-bold break-all">{file.name}</p>
            <p className="text-slate-500">{formatBytes(file.size)}{file.type ? ` · ${file.type}` : ''}</p>
          </div>
        )}
        {isHtml && (
          <ChoiceButtons label="When it is unlocked" value={asPage ? 'page' : 'file'} onChange={(value) => setAsPage(value === 'page')} options={[{ value: 'page', label: 'Show it as a page' }, { value: 'file', label: 'Offer it as a download' }]} />
        )}
        <p className="text-[11px] text-slate-500">Works with PDF, Word, Excel, PowerPoint, photos, ZIP and any other file. The file name is locked too. The person unlocks it, then downloads the original file.</p>
      </div>
      <LockPanel noun="file" prepare={prepare} />
    </div>
  );
};

/** Write a document and lock it, or lock a file you already have. Each way has its own address; the two buttons are links to them. */
export const SecureMaker: React.FC<{ initial: Mode }> = ({ initial }) => {
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(initial);
  return (
    <section className="mx-auto min-w-0">
      <div className={`${card} mb-4`}>
        <h2 className={heading}>What would you like to lock?</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PAGES.map((item) => (
            <Link
              key={item.mode}
              to={item.path}
              replace
              aria-current={mode === item.mode ? 'true' : undefined}
              onClick={(event) => { if (item.path === location.pathname) { event.preventDefault(); setMode(item.mode); } }}
              className={`rounded-lg border px-3 py-2.5 text-left ${mode === item.mode ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <span className="block text-sm font-bold text-slate-900">{item.label}</span>
              <span className="block text-xs text-slate-500">{item.hint}</span>
            </Link>
          ))}
        </div>
      </div>
      {mode === 'doc' ? <WriteDocument /> : <LockFile />}
      <div className="mt-4"><Note>Everything happens in your browser. The document, the file and the password are never sent to us or to anyone else. What you type is not saved on this device either; if you close the tab it is gone, so keep a copy of the locked file. Locking protects the file while it travels. It cannot stop a person who has the password from copying or sharing what they read.</Note></div>
    </section>
  );
};

export default SecureMaker;
