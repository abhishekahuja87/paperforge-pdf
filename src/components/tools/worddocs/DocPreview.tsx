import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import T from '../../../locales/packs/worddocs.text.en.json';
import { buttonClass } from '../workbooks/shared';
import { PAPER, runsOf, type Block, type DocModel, type Para, type Run } from '../../../lib/docx/model';

const PAGE_PX = 600;
/** The document drawn as a page, from the same description that is saved as the Word file. Line breaks can differ a little in Word. */
const Page: React.FC<{ doc: DocModel }> = ({ doc }) => {
  const paper = PAPER[doc.paper], px = PAGE_PX / paper.w, pt = (PAGE_PX / ((paper.w / 25.4) * 72)), margin = (doc.margin ?? 20) * px, base = (doc.size ?? 11) * pt;
  const run = (r: Run, key: string, base: { bold?: boolean; italic?: boolean; color?: string; size?: number }) => {
    const bold = r.bold ?? base.bold, italic = r.italic ?? base.italic, color = r.color ?? base.color, size = r.size ?? base.size;
    return <span key={key} style={{ fontWeight: bold ? 700 : undefined, fontStyle: italic ? 'italic' : undefined, color: color ? `#${color}` : undefined, fontSize: size ? `${size * pt}px` : undefined, whiteSpace: 'pre-wrap' }}>{r.text}</span>;
  };
  const para = (p: Para, i: number) => (
    <div key={i} style={{ textAlign: p.align === 'both' ? 'justify' : p.align, fontSize: `${(p.size ?? doc.size ?? 11) * pt}px`, fontWeight: p.bold || p.style ? 700 : undefined, fontStyle: p.italic ? 'italic' : undefined, color: p.color ? `#${p.color}` : undefined, marginTop: (p.before ?? 0) * pt, marginBottom: (p.after ?? 6) * pt, paddingLeft: (p.indent ?? 0) * pt + (p.bullet ? 14 * pt : 0), position: 'relative', borderBottom: p.rule ? `1px solid #${p.rule}` : undefined, paddingBottom: p.rule ? 1 : undefined, minHeight: runsOf(p.runs).every((r) => !r.text) ? base * 0.4 : undefined }}>
      {p.bullet && <span style={{ position: 'absolute', left: 3 * pt }}>•</span>}
      {runsOf(p.runs).map((r, k) => run(r, `${i}-${k}`, p))}
    </div>
  );
  const table = (b: Extract<Block, { type: 'table' }>, i: number) => {
    const total = b.widths.reduce((a, c) => a + c, 0) || 1;
    return (
      <table key={i} style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: 2 * pt }}>
        <colgroup>{b.widths.map((w, k) => <col key={k} style={{ width: `${(w / total) * 100}%` }} />)}</colgroup>
        <tbody>{b.rows.map((row, r) => <tr key={r}>{row.map((c, k) => <td key={k} style={{ padding: `${2 * pt}px ${4 * pt}px`, border: b.lines ? `1px solid #${b.lines}` : undefined, background: c.fill ? `#${c.fill}` : undefined, textAlign: c.align === 'both' ? 'justify' : c.align, fontSize: `${(c.size ?? doc.size ?? 11) * pt}px`, fontWeight: c.bold ? 700 : undefined, color: c.color ? `#${c.color}` : undefined, verticalAlign: 'top', wordBreak: 'break-word' }}>{runsOf(c.runs).map((x, q) => run(x, `${k}-${q}`, c))}</td>)}</tr>)}</tbody>
      </table>
    );
  };
  const toc = (b: Extract<Block, { type: 'toc' }>, i: number) => (
    <div key={i} style={{ marginBottom: 6 * pt }}>{b.entries.map((e, k) => <div key={k} style={{ paddingLeft: (e.level - 1) * 14 * pt, marginBottom: 3 * pt }}>{e.text}</div>)}</div>
  );
  return (
    <div className="bg-white shadow-sm" style={{ width: PAGE_PX, minHeight: PAGE_PX * (paper.h / paper.w) * 0.5, padding: margin, fontFamily: `${doc.font ?? 'Calibri'}, Carlito, Arial, sans-serif`, fontSize: base, lineHeight: 1.25, color: '#111' }}>
      {doc.blocks.map((b, i) => (b.type === 'p' ? para(b, i) : b.type === 'table' ? table(b, i) : b.type === 'toc' ? toc(b, i) : <hr key={i} className="my-4 border-dashed" />))}
    </div>
  );
};

/** The page shrunk to the width it is given, so it never needs sideways scrolling. At most `max` times its natural size. */
const FitPage: React.FC<{ doc: DocModel; max: number; minScale?: number }> = ({ doc, max, minScale = 0 }) => {
  const frame = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1), [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const f = frame.current, n = inner.current; if (!f || !n) return undefined;
    const update = () => { setScale(Math.max(minScale, Math.min(max, f.clientWidth / PAGE_PX))); setHeight(n.offsetHeight); };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update); ro.observe(f); ro.observe(n);
    return () => ro.disconnect();
  }, [max, minScale, doc]);
  return (
    <div ref={frame} style={{ width: '100%', height: height * scale }}>
      <div ref={inner} style={{ width: PAGE_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}><Page doc={doc} /></div>
    </div>
  );
};

const c = T.common;
/** The document drawn as a page that fits the screen, from the same description that is saved as the Word file. A button opens a larger view. Line breaks can differ a little in Word. */
export const DocPreview: React.FC<{ doc: DocModel }> = ({ doc }) => {
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (!big) return undefined;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setBig(false); };
    window.addEventListener('keydown', key);
    const before = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = before; };
  }, [big]);
  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-slate-100 p-2 sm:p-4"><FitPage doc={doc} max={1} /></div>
      <button type="button" onClick={() => setBig(true)} className={`${buttonClass} gap-2`}><Maximize2 className="h-4 w-4" aria-hidden="true" />{c.zoom}</button>
      {big && (
        <div role="dialog" aria-modal="true" aria-label={c.zoom} className="fixed inset-0 z-50 flex flex-col bg-slate-900/80">
          <div className="flex items-center justify-between px-3 py-2 text-white"><span className="text-sm font-semibold">{c.zoomHint}</span><button type="button" onClick={() => setBig(false)} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-white px-3 text-sm font-bold text-slate-900"><X className="h-4 w-4" aria-hidden="true" />{c.zoomClose}</button></div>
          <div className="flex-1 overflow-auto p-2" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}><div className="mx-auto" style={{ width: 'min(100%, 1000px)', minWidth: 'min(100%, 720px)' }}><FitPage doc={doc} max={1.7} minScale={1.2} /></div></div>
        </div>
      )}
    </div>
  );
};
