import React from 'react';
import { digitsOf, type MulFrame } from '../../../../lib/kids/multiply';

const COLW = 78;
const LEFT = 38;
const ORANGE = '#ea580c';

/** Column multiplication written as numbers: carries above, one row for each digit of the second number, then the answer. */
export const MultiplyBoard: React.FC<{ frame: MulFrame; x: number; y: number }> = ({ frame, x, y }) => {
  const { cols } = frame;
  const xs = digitsOf(x);
  const ys = digitsOf(y);
  const two = ys.length > 1;
  const width = LEFT + cols * COLW + 8;
  const colX = (c: number) => LEFT + (cols - 1 - c) * COLW;
  const mid = (c: number) => colX(c) + COLW / 2;
  const Y = { carry: 52, x: 118, y: 184, rule: 200, row0: 262, row1: 328, rule2: 344, product: 410 };
  const height = (two ? Y.product : Y.row0) + 34;
  const litCol = frame.activeX >= 0 ? frame.activeX + Math.max(frame.activeRow, 0) : -1;
  const answerColor = frame.done ? '#15803d' : '#0f172a';
  const cells = Array.from({ length: cols }, (_, c) => c);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full select-none rounded-2xl border border-slate-300 bg-white" role="img" aria-label={frame.caption}>
      {litCol >= 0 && litCol < cols && <rect x={colX(litCol) + 2} y={6} width={COLW - 4} height={height - 12} rx={14} fill="#fff7ed" />}

      {cells.map((c) => frame.carry[c] !== null && c < xs.length && (
        <text key={`c${c}`} x={mid(c)} y={Y.carry} textAnchor="middle" fontSize={34} fontWeight={800} fill={ORANGE} className="animate-pulse">{frame.carry[c]}</text>
      ))}
      {xs.map((digit, c) => <text key={`x${c}`} x={mid(c)} y={Y.x} textAnchor="middle" fontSize={54} fontWeight={800} fill={frame.activeX === c ? ORANGE : '#0f172a'}>{digit}</text>)}
      <text x={LEFT / 2} y={Y.y} textAnchor="middle" fontSize={42} fontWeight={800} fill="#475569">{'×'}</text>
      {ys.map((digit, c) => <text key={`y${c}`} x={mid(c)} y={Y.y} textAnchor="middle" fontSize={54} fontWeight={800} fill={frame.activeY === c ? ORANGE : '#0f172a'}>{digit}</text>)}
      <line x1={8} x2={width - 8} y1={Y.rule} y2={Y.rule} stroke="#334155" strokeWidth={4} strokeLinecap="round" />

      {frame.rows.map((row, r) => cells.map((c) => row[c] !== null && (
        <text key={`r${r}-${c}`} x={mid(c)} y={r === 0 ? Y.row0 : Y.row1} textAnchor="middle" fontSize={54} fontWeight={800} fill={!two && frame.done ? answerColor : r === frame.activeRow && c >= r && frame.activeX >= 0 && c === frame.activeX + r ? ORANGE : '#0f172a'}>{row[c]}</text>
      )))}
      {two && (
        <>
          <text x={LEFT / 2} y={Y.row1} textAnchor="middle" fontSize={42} fontWeight={800} fill="#475569">+</text>
          <line x1={8} x2={width - 8} y1={Y.rule2} y2={Y.rule2} stroke="#334155" strokeWidth={4} strokeLinecap="round" />
          {cells.map((c) => frame.product[c] !== null && <text key={`p${c}`} x={mid(c)} y={Y.product} textAnchor="middle" fontSize={54} fontWeight={800} fill={answerColor}>{frame.product[c]}</text>)}
        </>
      )}
    </svg>
  );
};
