import React from 'react';
import type { DivFrame } from '../../../../lib/kids/divide';

const COLW = 78;
const LEFT = 64;
const REM = 110;
const ORANGE = '#ea580c';
const ROW0 = 214;
const ROWH = 60;

/** Long division written as numbers in the "bus stop" layout: the answer on top, the working underneath. */
export const DivideBoard: React.FC<{ frame: DivFrame; x: number; y: number }> = ({ frame, x, y }) => {
  const digits = String(x).split('');
  const n = digits.length;
  const width = LEFT + n * COLW + REM;
  const height = ROW0 + n * 2 * ROWH - 24;
  const colX = (c: number) => LEFT + c * COLW;
  const mid = (c: number) => colX(c) + COLW / 2;
  const rowY = (r: number) => ROW0 + r * ROWH;
  const answerColor = frame.done ? '#15803d' : '#0f172a';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full select-none rounded-2xl border border-slate-300 bg-white" role="img" aria-label={frame.caption}>
      {frame.hiFrom >= 0 && <rect x={colX(frame.hiFrom) + 2} y={100} width={(frame.hiTo - frame.hiFrom + 1) * COLW - 4} height={64} rx={14} fill="#fff7ed" />}

      {frame.q.map((digit, c) => digit !== null && (
        <text key={`q${c}`} x={mid(c)} y={72} textAnchor="middle" fontSize={54} fontWeight={800} fill={answerColor}>{digit}</text>
      ))}
      {frame.done && frame.remainder ? <text x={colX(n) + 14} y={72} fontSize={38} fontWeight={800} fill="#15803d">r {frame.remainder}</text> : null}

      <line x1={LEFT - 6} x2={colX(n) + 6} y1={92} y2={92} stroke="#334155" strokeWidth={4} strokeLinecap="round" />
      <path d={`M ${LEFT - 6} 92 Q ${LEFT - 22} 128 ${LEFT - 6} 168`} fill="none" stroke="#334155" strokeWidth={4} strokeLinecap="round" />
      <text x={LEFT / 2 - 6} y={150} textAnchor="middle" fontSize={54} fontWeight={800} fill="#475569">{y}</text>
      {digits.map((digit, c) => <text key={`d${c}`} x={mid(c)} y={150} textAnchor="middle" fontSize={54} fontWeight={800} fill="#0f172a">{digit}</text>)}

      {frame.rows.map((row, r) => {
        const first = row.endCol - row.text.length + 1;
        const color = row.kind === 'current' ? ORANGE : '#0f172a';
        return (
          <g key={`r${r}`}>
            {row.text.split('').map((ch, k) => <text key={k} x={mid(first + k)} y={rowY(r)} textAnchor="middle" fontSize={54} fontWeight={800} fill={color}>{ch}</text>)}
            {row.kind === 'product' && (
              <>
                <text x={LEFT / 2 - 6} y={rowY(r) - 6} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">{'\u2212'}</text>
                <line x1={colX(first) + 6} x2={colX(row.endCol) + COLW - 6} y1={rowY(r) + 14} y2={rowY(r) + 14} stroke="#334155" strokeWidth={4} strokeLinecap="round" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
