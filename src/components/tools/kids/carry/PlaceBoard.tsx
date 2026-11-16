import React from 'react';
import type { Frame } from '../../../../lib/kids/placeValue';

const COLW = 112;
const LEFT = 26;
const HEAD = 44;
const ROWS = {
  add: { carry: 56, a: 112, b: 112, ans: 172 },
  sub: { carry: 0, a: 172, b: 112, ans: 112 },
};
const DIGITS_H = 48;

interface Spec { w: number; h: number; px: number; py: number; perRow: number; fill: string; stroke: string }
const SPECS: Spec[] = [
  { w: 14, h: 14, px: 18, py: 18, perRow: 5, fill: '#3b82f6', stroke: '#1d4ed8' },
  { w: 12, h: 36, px: 16, py: 42, perRow: 5, fill: '#22c55e', stroke: '#15803d' },
  { w: 31, h: 31, px: 35, py: 35, perRow: 3, fill: '#fbbf24', stroke: '#b45309' },
];

interface TokenProps { kind: number; x: number; y: number; ring?: boolean; faded?: boolean; crossed?: boolean }

/** One block: a dot for ones, a rod of ten for tens, a flat of a hundred for hundreds. */
const Token: React.FC<TokenProps> = ({ kind, x, y, ring, faded, crossed }) => {
  const s = SPECS[kind];
  const stroke = ring ? '#ea580c' : s.stroke;
  const common = { fill: s.fill, stroke, strokeWidth: ring ? 2.5 : 1, strokeDasharray: faded ? '3 2' : undefined, opacity: faded ? 0.45 : 1 };
  return (
    <g>
      {kind === 0 && <circle cx={x + s.w / 2} cy={y + s.h / 2} r={s.w / 2} {...common} />}
      {kind === 1 && (
        <g>
          <rect x={x} y={y} width={s.w} height={s.h} rx={2} {...common} />
          {Array.from({ length: 9 }, (_, i) => <line key={i} x1={x} x2={x + s.w} y1={y + ((i + 1) * s.h) / 10} y2={y + ((i + 1) * s.h) / 10} stroke={s.stroke} strokeWidth={0.6} opacity={faded ? 0.3 : 0.7} />)}
        </g>
      )}
      {kind === 2 && (
        <g>
          <rect x={x} y={y} width={s.w} height={s.h} rx={2} {...common} />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} opacity={faded ? 0.3 : 0.55}>
              <line x1={x + ((i + 1) * s.w) / 10} x2={x + ((i + 1) * s.w) / 10} y1={y} y2={y + s.h} stroke={s.stroke} strokeWidth={0.5} />
              <line x1={x} x2={x + s.w} y1={y + ((i + 1) * s.h) / 10} y2={y + ((i + 1) * s.h) / 10} stroke={s.stroke} strokeWidth={0.5} />
            </g>
          ))}
        </g>
      )}
      {faded && <path d={`M${x + s.w * 0.2} ${y + s.h * 0.1} l${s.w * 0.25} ${s.h * 0.3} l${-s.w * 0.15} ${s.h * 0.15} l${s.w * 0.3} ${s.h * 0.35}`} fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
      {crossed && (
        <g stroke="#dc2626" strokeWidth={3} strokeLinecap="round">
          <line x1={x - 1} y1={y - 1} x2={x + s.w + 1} y2={y + s.h + 1} />
          <line x1={x + s.w + 1} y1={y - 1} x2={x - 1} y2={y + s.h + 1} />
        </g>
      )}
    </g>
  );
};

interface CellProps { kind: number; count: number; ox: number; oy: number; center?: boolean; fresh?: number; breaking?: boolean; crossed?: number; group?: boolean }

/** A cell of blocks, laid out in rows of five (three for hundreds). */
const Cell: React.FC<CellProps> = ({ kind, count, ox, oy, center = false, fresh = 0, breaking = false, crossed = 0, group = false }) => {
  const s = SPECS[kind];
  const startX = center ? ox + (COLW - s.w) / 2 : ox + (COLW - s.perRow * s.px) / 2 + (s.px - s.w) / 2;
  const at = (i: number) => ({ x: startX + (i % s.perRow) * s.px, y: oy + 6 + Math.floor(i / s.perRow) * s.py });
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const p = at(i);
        return <Token key={i} kind={kind} x={p.x} y={p.y} ring={i >= count - fresh} faded={breaking && i === count - 1} crossed={i >= count - crossed} />;
      })}
      {group && count >= 10 && (
        <rect x={startX - 6} y={oy + 6 - 5} width={s.perRow * s.px + 2} height={2 * s.py + 4} rx={12} fill="none" stroke="#ea580c" strokeWidth={2.5} strokeDasharray="6 4" />
      )}
    </g>
  );
};

/** The picture for one step: blocks for each number, the carried or broken blocks, and the answer. */
export const PlaceBoard: React.FC<{ frame: Frame }> = ({ frame }) => {
  const { cols, op } = frame;
  const rows = ROWS[op];
  const width = LEFT + cols * COLW + 6;
  const colX = (c: number) => LEFT + (cols - 1 - c) * COLW;
  const carryY = HEAD;
  const aY = carryY + rows.carry;
  const bY = aY + rows.a;
  const ansY = bY + rows.b;
  const digitsY = ansY + rows.ans;
  const height = digitsY + DIGITS_H;
  const cells = Array.from({ length: cols }, (_, c) => c);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full select-none rounded-2xl border border-slate-300 bg-white" role="img" aria-label={frame.caption}>
      <defs>
        <marker id="pb-arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9 z" fill="#ea580c" /></marker>
      </defs>
      {frame.col >= 0 && <rect x={colX(frame.col)} y={4} width={COLW} height={height - 8} rx={12} fill="#fff7ed" />}
      {cells.map((c) => <Cell key={`h${c}`} kind={c} count={1} ox={colX(c)} oy={-2} center />)}
      <line x1={4} x2={width - 4} y1={HEAD - 2} y2={HEAD - 2} stroke="#e2e8f0" />

      {op === 'add' && cells.map((c) => frame.carry[c] > 0 && (
        <g key={`c${c}`} className="animate-pulse"><Cell kind={c} count={1} ox={colX(c)} oy={carryY - 2} fresh={1} center /></g>
      ))}

      {cells.map((c) => (
        <Cell key={`a${c}`} kind={c} count={frame.a[c]} ox={colX(c)} oy={aY} fresh={frame.fresh[c]} breaking={frame.breaking === c} crossed={frame.crossed[c]} />
      ))}
      <text x={LEFT / 2} y={bY + 58} textAnchor="middle" fontSize={30} fontWeight={800} fill="#475569">{op === 'add' ? '+' : '−'}</text>
      {cells.map((c) => <Cell key={`b${c}`} kind={c} count={frame.b[c]} ox={colX(c)} oy={bY} />)}
      <line x1={4} x2={width - 4} y1={ansY} y2={ansY} stroke="#334155" strokeWidth={2.5} />
      {cells.map((c) => <Cell key={`n${c}`} kind={c} count={frame.ans[c]} ox={colX(c)} oy={ansY} group={frame.group && frame.col === c} />)}
      {cells.map((c) => (
        <text key={`d${c}`} x={colX(c) + COLW / 2} y={digitsY + 36} textAnchor="middle" fontSize={36} fontWeight={800} fill={frame.done ? '#15803d' : '#0f172a'}>{frame.ansDigits[c] ?? ''}</text>
      ))}

      {frame.carryArrow && frame.col + 1 < cols && (
        <path d={`M ${colX(frame.col) + 30} ${ansY + 8} C ${colX(frame.col) - 24} ${ansY - 30}, ${colX(frame.col) - 20} ${carryY + 90}, ${colX(frame.col + 1) + COLW / 2 + 14} ${carryY + rows.carry - 4}`} fill="none" stroke="#ea580c" strokeWidth={3} strokeDasharray="7 5" markerEnd="url(#pb-arrow)" />
      )}
      {frame.breaking >= 0 && frame.col >= 0 && frame.breaking > frame.col && (
        <path d={`M ${colX(frame.breaking) + 28} ${aY + 70} C ${colX(frame.breaking) - 12} ${aY + 120}, ${colX(frame.breaking - 1) + 70} ${aY + 120}, ${colX(frame.breaking - 1) + 60} ${aY + 86}`} fill="none" stroke="#ea580c" strokeWidth={3} strokeDasharray="7 5" markerEnd="url(#pb-arrow)" />
      )}
    </svg>
  );
};
