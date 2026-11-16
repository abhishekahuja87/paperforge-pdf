import React from 'react';
import { digitsOf, type Frame } from '../../../../lib/kids/placeValue';

const COLW = 96;
const LEFT = 40;
const Y = { carry: 62, top: 150, bottom: 226, rule: 244, answer: 322, height: 350 };

interface Props {
  frame: Frame;
  x: number;
  y: number;
  /** Subtraction: the values each top digit has had so far, oldest first, so old ones can be crossed out. */
  history: number[][];
}

const ORANGE = '#ea580c';

/** The sum written as numbers in columns: carried ones above for adding, crossed-out digits for borrowing. */
export const DigitBoard: React.FC<Props> = ({ frame, x, y, history }) => {
  const { cols, op } = frame;
  const width = LEFT + cols * COLW + 8;
  const colX = (c: number) => LEFT + (cols - 1 - c) * COLW;
  const mid = (c: number) => colX(c) + COLW / 2;
  const topDigits = digitsOf(x, cols);
  const botDigits = digitsOf(y, cols);
  const topLen = String(x).length;
  const botLen = String(y).length;
  const resultLen = String(op === 'add' ? x + y : x - y).length;
  const cells = Array.from({ length: cols }, (_, c) => c);
  const lit = (c: number) => frame.col === c;

  return (
    <svg viewBox={`0 0 ${width} ${Y.height}`} className="w-full select-none rounded-2xl border border-slate-300 bg-white" role="img" aria-label={frame.caption}>
      <defs>
        <marker id="db-arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9 z" fill={ORANGE} /></marker>
      </defs>
      {frame.col >= 0 && <rect x={colX(frame.col) + 2} y={6} width={COLW - 4} height={Y.height - 12} rx={14} fill="#fff7ed" />}

      {/* carried ones (adding) */}
      {op === 'add' && cells.map((c) => frame.carry[c] > 0 && (
        <text key={`c${c}`} x={mid(c)} y={Y.carry} textAnchor="middle" fontSize={40} fontWeight={800} fill={ORANGE} className="animate-pulse">1</text>
      ))}

      {/* the top number; in subtraction the old digits are crossed out above the new one */}
      {cells.map((c) => {
        if (c >= topLen) return null;
        const list = op === 'sub' ? history[c] ?? [topDigits[c]] : [topDigits[c]];
        const current = list[list.length - 1];
        const old = list.slice(0, -1);
        const marking = old.length > 0 || lit(c) || frame.fresh[c] > 0;
        return (
          <g key={`t${c}`}>
            {old.map((value, i) => {
              const dy = (old.length - 1 - i) * 34;
              return (
                <g key={i}>
                  <text x={mid(c)} y={Y.top - 56 - dy} textAnchor="middle" fontSize={30} fontWeight={700} fill="#94a3b8">{value}</text>
                  <line x1={mid(c) - 16} x2={mid(c) + 16} y1={Y.top - 66 - dy} y2={Y.top - 66 - dy} stroke="#dc2626" strokeWidth={3} />
                </g>
              );
            })}
            <text x={mid(c)} y={Y.top} textAnchor="middle" fontSize={64} fontWeight={800} fill={marking ? ORANGE : '#0f172a'}>{current}</text>
            {op === 'sub' && frame.breaking === c && <text x={mid(c) + 36} y={Y.top - 24} textAnchor="middle" fontSize={24} fontWeight={800} fill="#dc2626">{'−'}1</text>}
            {op === 'sub' && frame.breaking >= 0 && frame.breaking - 1 === c && <text x={mid(c) + 36} y={Y.top - 24} textAnchor="middle" fontSize={24} fontWeight={800} fill="#15803d">+10</text>}
          </g>
        );
      })}

      {/* the second number and its sign */}
      <text x={LEFT / 2} y={Y.bottom} textAnchor="middle" fontSize={48} fontWeight={800} fill="#475569">{op === 'add' ? '+' : '−'}</text>
      {cells.map((c) => c < botLen && (
        <text key={`b${c}`} x={mid(c)} y={Y.bottom} textAnchor="middle" fontSize={64} fontWeight={800} fill={lit(c) ? ORANGE : '#0f172a'}>{botDigits[c]}</text>
      ))}
      <line x1={8} x2={width - 8} y1={Y.rule} y2={Y.rule} stroke="#334155" strokeWidth={4} strokeLinecap="round" />

      {/* the answer, column by column */}
      {cells.map((c) => {
        const digit = frame.ansDigits[c];
        if (digit === null || (frame.done && c >= resultLen)) return null;
        return <text key={`a${c}`} x={mid(c)} y={Y.answer} textAnchor="middle" fontSize={64} fontWeight={800} fill={frame.done ? '#15803d' : '#0f172a'}>{digit}</text>;
      })}

      {frame.carryArrow && frame.col + 1 < cols && (
        <path d={`M ${colX(frame.col) + 18} ${Y.answer - 70} C ${colX(frame.col) - 22} ${Y.answer - 110}, ${colX(frame.col) - 18} ${Y.carry + 70}, ${mid(frame.col + 1) + 20} ${Y.carry + 14}`} fill="none" stroke={ORANGE} strokeWidth={3.5} strokeDasharray="8 6" markerEnd="url(#db-arrow)" />
      )}
      {frame.breaking > frame.col && frame.col >= 0 && (
        <path d={`M ${mid(frame.breaking) - 4} ${Y.top - 100} C ${mid(frame.breaking) - 20} ${Y.top - 130}, ${mid(frame.breaking - 1) + 20} ${Y.top - 130}, ${mid(frame.breaking - 1) + 6} ${Y.top - 100}`} fill="none" stroke={ORANGE} strokeWidth={3.5} strokeDasharray="8 6" markerEnd="url(#db-arrow)" />
      )}
    </svg>
  );
};
