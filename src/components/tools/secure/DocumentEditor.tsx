import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ColorField } from '../../common/ColorPicker';
import { Bold, Image as ImageIcon, Italic, Link2, Quote, Undo2 } from 'lucide-react';
import { docCss, FONT_CHOICES, type DocStyle } from '../../../lib/secure/docStyle';
import { sdSanitize } from '../../../lib/secure/sanitizeCore.js';
import {
  addColumn, addRow, closest, currentBlock, deleteColumn, deleteRow, fitImage, setBlock, setFontSize, setTableLook, tableHtml, tableLook,
  toggleChecklist, toggleHeaderRow, wordCount, type BlockChoice,
} from '../../../lib/secure/editing';
import { Icon } from './icons';
import ui from '../../../locales/packs/documenteditor.ui.en.json';

interface Props {
  /** The editable element, so the maker can read the finished document. */
  editorRef: React.MutableRefObject<HTMLDivElement | null>;
  style: DocStyle;
  header: string;
  footer: string;
  watermark: string;
  /** Called after every change with the number of words. */
  onChange: (words: number) => void;
}

const SIZES = [11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
const BLOCK_OPTIONS: { value: BlockChoice; label: string }[] = [
  { value: 'p', label: 'Normal text' }, { value: 'title', label: 'Title' }, { value: 'subtitle', label: 'Subtitle' }, { value: 'lead', label: 'Intro paragraph' },
  { value: 'h1', label: 'Heading 1' }, { value: 'h2', label: 'Heading 2' }, { value: 'h3', label: 'Heading 3' }, { value: 'h4', label: 'Heading 4' },
  { value: 'blockquote', label: 'Quote' }, { value: 'pre', label: 'Code or notes' },
];
const TEXT_COLORS = ['#111827', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#64748b'];
const MARKS = ['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8', '#fed7aa', '#e9d5ff'];

const EDITOR_CSS = `
.sd-edit{outline:none;min-height:60vh;caret-color:#c2410c}
.sd-edit > :first-child{margin-top:0}
.sd-edit img{cursor:pointer}
.sd-edit img.sd-picked{outline:3px solid #fb923c;outline-offset:2px}
.sd-edit .sd-break{position:relative;height:1.4em;border:0;border-top:1px dashed #94a3b8;margin:1em 0}
.sd-edit .sd-break::after{content:"Page break";position:absolute;right:0;top:-.7em;background:#fff;padding:0 .4em;font:600 11px system-ui,sans-serif;color:#64748b}
.sd-edit td,.sd-edit th{min-width:2.2em}
.sd-edit ::selection{background:#fed7aa}
`;

const Tool: React.FC<{ label: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode }> = ({ label, onClick, active, disabled, children }) => (
  <button type="button" title={label} aria-label={label} aria-pressed={active === undefined ? undefined : active} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}
    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-1.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 ${active ? 'bg-orange-100 text-orange-900' : 'text-slate-700'}`}>{children}</button>
);
const Sep = () => <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />;
const selectClass = 'h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800';

/** Word-style editor in the browser: styles, fonts, colours, lists, links, pictures and tables, drawn on a sheet of paper. */
export const DocumentEditor: React.FC<Props> = ({ editorRef, style, header, footer, watermark, onChange }) => {
  const saved = useRef<Range | null>(null);
  const [otherColor, setOtherColor] = useState('#111827');
  const [words, setWords] = useState(0);
  const [block, setBlockState] = useState<BlockChoice>('p');
  const [on, setOn] = useState({ bold: false, italic: false, underline: false, strike: false, ul: false, ol: false });
  const [cell, setCell] = useState<HTMLTableCellElement | null>(null);
  const [picked, setPicked] = useState<HTMLImageElement | null>(null);
  const [panel, setPanel] = useState<'' | 'link' | 'table' | 'colour'>('');
  const [link, setLink] = useState({ url: '', text: '' });
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headerRow, setHeaderRow] = useState(true);
  const [notice, setNotice] = useState('');

  const root = () => editorRef.current;

  const sync = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const count = wordCount(el);
    setWords(count);
    onChange(count);
  }, [editorRef, onChange]);

  // Track the selection: remember it for controls that take focus, and update the toolbar state.
  useEffect(() => {
    const read = () => {
      const el = editorRef.current;
      const selection = window.getSelection();
      if (!el || !selection || !selection.rangeCount || !el.contains(selection.anchorNode)) return;
      saved.current = selection.getRangeAt(0).cloneRange();
      setBlockState(currentBlock(el));
      const state = (command: string) => { try { return document.queryCommandState(command); } catch { return false; } };
      setOn({ bold: state('bold'), italic: state('italic'), underline: state('underline'), strike: state('strikeThrough'), ul: state('insertUnorderedList'), ol: state('insertOrderedList') });
      setCell(closest(selection.anchorNode, el, 'td,th') as HTMLTableCellElement | null);
    };
    document.addEventListener('selectionchange', read);
    return () => document.removeEventListener('selectionchange', read);
  }, [editorRef]);

  useEffect(() => {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* older browsers */ }
    sync();
  }, [sync]);

  /** Puts the cursor back where it was (a menu or colour picker may have taken focus), then runs the change. */
  const act = (change: () => void) => {
    const el = root();
    if (!el) return;
    el.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (saved.current && selection && !el.contains(selection.anchorNode)) {
      selection.removeAllRanges();
      selection.addRange(saved.current);
    }
    change();
    sync();
  };
  const exec = (command: string, value?: string) => act(() => { document.execCommand('styleWithCSS', false, 'true'); document.execCommand(command, false, value); });
  const insert = (html: string) => act(() => { document.execCommand('insertHTML', false, html); });

  const insertPicture = async (file: File) => {
    setNotice('');
    try {
      const src = await fitImage(file);
      insert(`<img src="${src}" alt="" style="max-width: 100%">`);
    } catch (problem) {
      setNotice(problem instanceof Error ? problem.message : 'That picture could not be added.');
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const image = Array.from(event.clipboardData.files).find((file) => file.type.startsWith('image/'));
    event.preventDefault();
    if (image) { void insertPicture(image); return; }
    const html = event.clipboardData.getData('text/html');
    if (html) document.execCommand('insertHTML', false, sdSanitize(html));
    else document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    sync();
  };

  const submitLink = (event: React.FormEvent) => {
    event.preventDefault();
    let url = link.url.trim();
    if (!url) return;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) url = `mailto:${url}`;
    else if (!/^(https?:|mailto:|tel:)/i.test(url)) url = `https://${url}`;
    if (/^javascript:/i.test(url)) return;
    const hasSelection = !!saved.current && !saved.current.collapsed;
    act(() => {
      if (hasSelection) document.execCommand('createLink', false, url);
      else document.execCommand('insertHTML', false, `<a href="${url.replace(/"/g, '%22')}">${(link.text || url).replace(/</g, '&lt;')}</a>&nbsp;`);
    });
    setLink({ url: '', text: '' });
    setPanel('');
  };

  const table = cell?.closest('table') as HTMLTableElement | null;
  const look = table ? tableLook(table) : null;
  const tableAct = (change: (c: HTMLTableCellElement, t: HTMLTableElement) => void) => act(() => { if (cell && table) { change(cell, table); } });

  const setPickedStyle = (patch: Partial<CSSStyleDeclaration>) => { if (picked) { Object.assign(picked.style, patch); sync(); } };

  return (
    <div className="min-w-0">
      <style>{docCss(style) + EDITOR_CSS}</style>
      <div className="sticky top-0 z-20 rounded-t-xl border border-b-0 border-slate-200 bg-white">
        <div className="flex gap-1 overflow-x-auto p-1.5" role="toolbar" aria-label={ui.textFormatting}>
          <Tool label="Undo" onClick={() => exec('undo')}><Undo2 className="h-4 w-4" aria-hidden="true" /></Tool>
          <Tool label="Redo" onClick={() => exec('redo')}><Icon name="redo" /></Tool>
          <Sep />
          <select aria-label={ui.paragraphStyle} className={`${selectClass} w-36 shrink-0`} value={block} onChange={(event) => act(() => setBlock(root()!, event.target.value as BlockChoice))}>
            {BLOCK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select aria-label={ui.font} className={`${selectClass} w-28 shrink-0`} defaultValue="" onChange={(event) => { const value = event.target.value; event.target.value = ''; if (value) act(() => { document.execCommand('styleWithCSS', false, 'true'); document.execCommand('fontName', false, value); }); }}>
            <option value="">{ui.font}</option>
            {FONT_CHOICES.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
          </select>
          <select aria-label={ui.textSize} className={`${selectClass} w-16 shrink-0`} defaultValue="" onChange={(event) => { const size = Number(event.target.value); if (size) act(() => setFontSize(root()!, size)); event.target.value = ''; }}>
            <option value="">{ui.size}</option>
            {SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <Sep />
          <Tool label="Bold" active={on.bold} onClick={() => exec('bold')}><Bold className="h-4 w-4" aria-hidden="true" /></Tool>
          <Tool label="Italic" active={on.italic} onClick={() => exec('italic')}><Italic className="h-4 w-4" aria-hidden="true" /></Tool>
          <Tool label="Underline" active={on.underline} onClick={() => exec('underline')}><Icon name="underline" /></Tool>
          <Tool label="Strikethrough" active={on.strike} onClick={() => exec('strikeThrough')}><Icon name="strike" /></Tool>
          <Tool label="Text colour and highlight" active={panel === 'colour'} onClick={() => setPanel(panel === 'colour' ? '' : 'colour')}><span className="border-b-4 border-rose-500 px-0.5 leading-none">A</span></Tool>
          <Tool label="Clear formatting" onClick={() => exec('removeFormat')}><Icon name="eraser" /></Tool>
          <Sep />
          <Tool label="Align left" onClick={() => exec('justifyLeft')}><Icon name="left" /></Tool>
          <Tool label="Centre" onClick={() => exec('justifyCenter')}><Icon name="center" /></Tool>
          <Tool label="Align right" onClick={() => exec('justifyRight')}><Icon name="right" /></Tool>
          <Tool label="Justify" onClick={() => exec('justifyFull')}><Icon name="justify" /></Tool>
          <Sep />
          <Tool label="Bullet list" active={on.ul} onClick={() => exec('insertUnorderedList')}><Icon name="ul" /></Tool>
          <Tool label="Numbered list" active={on.ol} onClick={() => exec('insertOrderedList')}><Icon name="ol" /></Tool>
          <Tool label="Checklist" onClick={() => act(() => toggleChecklist(root()!))}><Icon name="check" /></Tool>
          <Tool label="Indent" onClick={() => exec('indent')}><Icon name="indent" /></Tool>
          <Tool label="Outdent" onClick={() => exec('outdent')}><Icon name="outdent" /></Tool>
          <Sep />
          <Tool label="Link" active={panel === 'link'} onClick={() => { setLink({ url: '', text: saved.current?.toString() ?? '' }); setPanel(panel === 'link' ? '' : 'link'); }}><Link2 className="h-4 w-4" aria-hidden="true" /></Tool>
          <label className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md px-1.5 text-slate-700 hover:bg-slate-100" title={ui.insertAPicture}>
            <span className="sr-only">{ui.insertAPicture}</span><ImageIcon className="h-4 w-4" aria-hidden="true" />
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void insertPicture(file); }} />
          </label>
          <Tool label="Table" active={panel === 'table'} onClick={() => setPanel(panel === 'table' ? '' : 'table')}><Icon name="table" /></Tool>
          <Tool label="Horizontal line" onClick={() => insert('<hr><p><br></p>')}><Icon name="line" /></Tool>
          <Tool label="Page break for printing" onClick={() => insert('<div class="sd-break"></div><p><br></p>')}><Icon name="pagebreak" /></Tool>
          <Tool label="Quote" onClick={() => act(() => setBlock(root()!, 'blockquote'))}><Quote className="h-4 w-4" aria-hidden="true" /></Tool>
          <Tool label="Signature line" onClick={() => insert('<p class="sd-sign">{ui.nameAndDate}</p><p><br></p>')}><Icon name="sign" /></Tool>
          <Tool label="Today's date" onClick={() => insert(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}><Icon name="calendar" /></Tool>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 p-1.5 text-xs" aria-label={ui.highlightedBoxes}>
          <span className="shrink-0 self-center px-1 font-semibold text-slate-500">{ui.boxes}</span>
          {([['info', 'Note', 'bg-sky-100 text-sky-900'], ['ok', 'Good', 'bg-emerald-100 text-emerald-900'], ['warn', 'Warning', 'bg-amber-100 text-amber-900'], ['danger', 'Important', 'bg-rose-100 text-rose-900']] as const).map(([kind, label, tone]) => (
            <button key={kind} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insert(`<div class="sd-callout sd-${kind}"><p>${(saved.current?.toString() || `${label}: type here`).replace(/</g, '&lt;')}</p></div><p><br></p>`)} className={`shrink-0 rounded-md px-2.5 py-1.5 font-semibold ${tone}`}>{label} box</button>
          ))}
          <span className="ml-auto shrink-0 self-center px-2 text-slate-500">{words} words</span>
        </div>
        {panel === 'colour' && (
          <div className="space-y-2 border-t border-slate-100 p-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5"><span className="w-20 font-semibold text-slate-600">{ui.textColour}</span>
              {TEXT_COLORS.map((colour) => <button key={colour} type="button" aria-label={`Text colour ${colour}`} onMouseDown={(event) => event.preventDefault()} onClick={() => exec('foreColor', colour)} className="h-7 w-7 rounded-full border border-slate-300" style={{ background: colour }} />)}
              <label className="ml-1 inline-flex items-center gap-1 font-semibold text-slate-600">Other <ColorField value={otherColor} label="Pick a text colour" className="h-7 w-9" onChange={(hex) => { setOtherColor(hex); exec('foreColor', hex); }} /></label>
            </div>
            <div className="flex flex-wrap items-center gap-1.5"><span className="w-20 font-semibold text-slate-600">{ui.highlight}</span>
              {MARKS.map((colour) => <button key={colour} type="button" aria-label={`Highlight ${colour}`} onMouseDown={(event) => event.preventDefault()} onClick={() => act(() => { document.execCommand('styleWithCSS', false, 'true'); if (!document.execCommand('hiliteColor', false, colour)) document.execCommand('backColor', false, colour); })} className="h-7 w-7 rounded-md border border-slate-300" style={{ background: colour }} />)}
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => act(() => { document.execCommand('styleWithCSS', false, 'true'); if (!document.execCommand('hiliteColor', false, 'transparent')) document.execCommand('backColor', false, 'transparent'); })} className="rounded-md border border-slate-300 px-2 py-1 font-semibold text-slate-700">{ui.none}</button>
            </div>
          </div>
        )}
        {panel === 'link' && (
          <form onSubmit={submitLink} className="flex flex-wrap items-end gap-2 border-t border-slate-100 p-2.5 text-xs">
            <label className="min-w-40 flex-1 font-semibold text-slate-700">{ui.webAddressEmailOrPhone}<input type="text" value={link.url} onChange={(event) => setLink({ ...link, url: event.target.value })} placeholder={ui.httpsExampleCom} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm" /></label>
            {(!saved.current || saved.current.collapsed) && <label className="min-w-32 flex-1 font-semibold text-slate-700">{ui.textToShow}<input type="text" value={link.text} onChange={(event) => setLink({ ...link, text: event.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm" /></label>}
            <button type="submit" className="min-h-9 rounded-md bg-orange-700 px-3 font-bold text-white">{ui.addLink}</button>
            <button type="button" onClick={() => exec('unlink')} className="min-h-9 rounded-md border border-slate-200 px-3 font-semibold text-slate-700">{ui.removeLink}</button>
          </form>
        )}
        {panel === 'table' && (
          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 p-2.5 text-xs">
            <label className="font-semibold text-slate-700">{ui.rows}<input type="number" min={1} max={30} value={rows} onChange={(event) => setRows(Math.min(30, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 block w-16 rounded-md border border-slate-200 px-2 py-2 text-sm" /></label>
            <label className="font-semibold text-slate-700">{ui.columns}<input type="number" min={1} max={8} value={cols} onChange={(event) => setCols(Math.min(8, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 block w-16 rounded-md border border-slate-200 px-2 py-2 text-sm" /></label>
            <label className="flex items-center gap-1.5 pb-2 font-semibold text-slate-700"><input type="checkbox" checked={headerRow} onChange={(event) => setHeaderRow(event.target.checked)} className="h-4 w-4 accent-orange-700" />{ui.headerRow}</label>
            <button type="button" onClick={() => { insert(tableHtml(rows, cols, headerRow)); setPanel(''); }} className="min-h-9 rounded-md bg-orange-700 px-3 font-bold text-white">{ui.insertTable}</button>
          </div>
        )}
        {table && look && (
          <div className="flex gap-1 overflow-x-auto border-t border-slate-100 bg-orange-50/60 p-1.5 text-xs" aria-label={ui.tableTools}>
            <span className="shrink-0 self-center px-1 font-semibold text-orange-900">{ui.table}</span>
            {([['Row above', () => tableAct((c) => addRow(c, false))], ['Row below', () => tableAct((c) => addRow(c, true))], ['Column left', () => tableAct((c) => addColumn(c, false))], ['Column right', () => tableAct((c) => addColumn(c, true))], ['Delete row', () => tableAct((c) => deleteRow(c))], ['Delete column', () => tableAct((c) => deleteColumn(c))]] as const).map(([label, run]) => (
              <button key={label} type="button" onMouseDown={(event) => event.preventDefault()} onClick={run} className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-800">{label}</button>
            ))}
            <button type="button" onMouseDown={(event) => event.preventDefault()} aria-pressed={look.header} onClick={() => tableAct((_c, t) => toggleHeaderRow(t))} className={`shrink-0 rounded-md border px-2 py-1.5 font-semibold ${look.header ? 'border-orange-300 bg-orange-100 text-orange-900' : 'border-slate-200 bg-white text-slate-800'}`}>{ui.headerRow}</button>
            <button type="button" onMouseDown={(event) => event.preventDefault()} aria-pressed={look.striped} onClick={() => tableAct((_c, t) => setTableLook(t, tableLook(t).look, !tableLook(t).striped))} className={`shrink-0 rounded-md border px-2 py-1.5 font-semibold ${look.striped ? 'border-orange-300 bg-orange-100 text-orange-900' : 'border-slate-200 bg-white text-slate-800'}`}>{ui.stripes}</button>
            {(['grid', 'lines', 'plain'] as const).map((choice) => (
              <button key={choice} type="button" onMouseDown={(event) => event.preventDefault()} aria-pressed={look.look === choice} onClick={() => tableAct((_c, t) => setTableLook(t, choice, tableLook(t).striped))} className={`shrink-0 rounded-md border px-2 py-1.5 font-semibold ${look.look === choice ? 'border-orange-300 bg-orange-100 text-orange-900' : 'border-slate-200 bg-white text-slate-800'}`}>{choice === 'grid' ? 'Grid' : choice === 'lines' ? 'Lines' : 'No borders'}</button>
            ))}
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => tableAct((_c, t) => t.remove())} className="shrink-0 rounded-md border border-rose-200 bg-white px-2 py-1.5 font-semibold text-rose-800">{ui.deleteTable}</button>
          </div>
        )}
        {picked && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 bg-orange-50/60 p-1.5 text-xs" aria-label={ui.pictureTools}>
            <span className="px-1 font-semibold text-orange-900">{ui.picture}</span>
            {([['Small', '25%'], ['Medium', '50%'], ['Large', '75%'], ['Full width', '100%']] as const).map(([label, width]) => <button key={label} type="button" onClick={() => setPickedStyle({ width, maxWidth: '100%', height: 'auto' })} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-800">{label}</button>)}
            {([['Left', 'block', '0 auto 0 0'], ['Centre', 'block', '0 auto'], ['Right', 'block', '0 0 0 auto']] as const).map(([label, display, margin]) => <button key={label} type="button" onClick={() => setPickedStyle({ display, margin })} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-800">{label}</button>)}
            <label className="flex min-w-40 flex-1 items-center gap-1 font-semibold text-slate-700">{ui.describeIt}<input type="text" defaultValue={picked.alt} onChange={(event) => { picked.alt = event.target.value; }} className="w-full rounded-md border border-slate-200 px-2 py-1.5 font-normal" /></label>
            <button type="button" onClick={() => { picked.remove(); setPicked(null); sync(); }} className="rounded-md border border-rose-200 bg-white px-2 py-1.5 font-semibold text-rose-800">{ui.remove}</button>
          </div>
        )}
        {notice && <p role="alert" className="border-t border-slate-100 px-3 py-2 text-xs text-rose-800">{notice}</p>}
      </div>
      <div className="overflow-x-auto rounded-b-xl border border-slate-200 bg-slate-200 p-2 sm:p-5">
        <div className="sdoc">
          {header && <div className="sd-header">{header}</div>}
          <div
            ref={editorRef}
            className="sd-edit"
            contentEditable
            suppressContentEditableWarning
            spellCheck
            role="textbox"
            aria-multiline="true"
            aria-label={ui.document}
            onInput={sync}
            onPaste={onPaste}
            onClick={(event) => {
              const target = event.target;
              setPicked((previous) => { previous?.classList.remove('sd-picked'); if (target instanceof HTMLImageElement) { target.classList.add('sd-picked'); return target; } return null; });
            }}
            dangerouslySetInnerHTML={{ __html: '<p><br></p>' }}
          />
          {footer && <div className="sd-footer">{footer}</div>}
          {watermark && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden' }}><span style={{ transform: 'rotate(-28deg)', fontWeight: 800, fontSize: 'clamp(2rem, 9vw, 4.5rem)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(100,116,139,.15)', whiteSpace: 'nowrap' }}>{watermark}</span></div>}
        </div>
      </div>
    </div>
  );
};
