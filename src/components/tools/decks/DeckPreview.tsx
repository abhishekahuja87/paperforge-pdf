import React from 'react';
import { layout, type Shape } from '../../../lib/pptx/layout';
import { SLIDE_H, SLIDE_W, type DeckModel } from '../../../lib/pptx/model';

const pctX = (v: number) => `${(v / SLIDE_W) * 100}%`;
const pctY = (v: number) => `${(v / SLIDE_H) * 100}%`;
/** A font size in points as a share of the slide width (960 points wide), so text scales with the slide. */
const cq = (pt: number) => `${(pt / 960) * 100}cqw`;
const ANCHOR = { t: 'flex-start', ctr: 'center', b: 'flex-end' } as const;

const drawShape = (s: Shape, i: number, font: string) => {
  const box = { position: 'absolute', left: pctX(s.x), top: pctY(s.y) } as const;
  if (s.t === 'rect' || s.t === 'ellipse') return <div key={i} style={{ ...box, width: pctX(s.w), height: pctY(s.h), background: `#${s.fill}`, borderRadius: s.t === 'ellipse' ? '50%' : undefined }} />;
  if (s.t === 'text') {
    return (
      <div key={i} style={{ ...box, width: pctX(s.w), height: pctY(s.h), display: 'flex', flexDirection: 'column', justifyContent: ANCHOR[s.anchor], overflow: 'hidden', fontFamily: `${font}, Carlito, Arial, sans-serif` }}>
        {s.paras.map((p, k) => (
          <div key={k} style={{ position: 'relative', fontSize: cq(p.size), lineHeight: 1.2, fontWeight: p.bold ? 700 : 400, color: `#${p.color}`, textAlign: p.align === 'ctr' ? 'center' : 'left', paddingLeft: p.bullet ? cq(22) : 0, marginBottom: cq(p.after ?? 0), whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {p.bullet && <span style={{ position: 'absolute', left: cq(4), color: `#${p.bulletColor ?? p.color}` }}>•</span>}{p.text}
          </div>
        ))}
      </div>
    );
  }
  const total = s.cols.reduce((a, b) => a + b, 0) || 1;
  return (
    <table key={i} style={{ ...box, width: pctX(s.w), borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: `${font}, Carlito, Arial, sans-serif` }}>
      <colgroup>{s.cols.map((w, k) => <col key={k} style={{ width: `${(w / total) * 100}%` }} />)}</colgroup>
      <tbody>{s.rows.map((row, r) => <tr key={r} style={{ height: pctY(s.rowH) }}>{row.map((c, k) => <td key={k} style={{ border: `1px solid #${s.line}`, background: `#${c.fill}`, color: `#${c.color}`, fontWeight: c.bold ? 700 : 400, fontSize: cq(s.size), padding: `0 ${cq(7)}`, verticalAlign: 'middle', overflowWrap: 'anywhere' }}>{c.text}</td>)}</tr>)}</tbody>
    </table>
  );
};

/** The slides drawn from the same description that is saved as the PowerPoint file. Line breaks can differ a little in PowerPoint. */
export const DeckPreview: React.FC<{ deck: DeckModel }> = ({ deck }) => (
  <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {deck.slides.map((slide, i) => {
      const laid = layout(slide, deck.theme);
      return (
        <li key={i} className="list-none">
          <div className="relative w-full overflow-hidden rounded-lg border border-slate-300 shadow-sm" style={{ aspectRatio: '16 / 9', containerType: 'inline-size', background: `#${laid.bg}` }}>
            {laid.shapes.map((s, k) => drawShape(s, k, deck.theme.font))}
          </div>
          <p className="mt-1 text-center text-[11px] text-slate-500">{i + 1}</p>
        </li>
      );
    })}
  </ol>
);
