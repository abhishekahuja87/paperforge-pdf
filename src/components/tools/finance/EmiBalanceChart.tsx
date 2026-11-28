import React from 'react';
import { formatInr } from '../../../lib/finance/format';
import type { YearRow } from '../../../lib/finance/emiSchedule';

interface EmiBalanceChartProps {
  principal: number;
  years: YearRow[];
}

const W = 600;
const H = 220;
const PAD = { left: 8, right: 8, top: 14, bottom: 26 };

/** How much of the loan is still left to pay at the end of each year, drawn as a falling area. */
export const EmiBalanceChart: React.FC<EmiBalanceChartProps> = ({ principal, years }) => {
  if (years.length === 0 || principal <= 0) return null;
  const points = [{ year: 0, balance: principal }, ...years.map((row) => ({ year: row.year, balance: row.balance }))];
  const lastYear = points[points.length - 1].year;
  const x = (year: number) => PAD.left + (lastYear === 0 ? 0 : (year / lastYear) * (W - PAD.left - PAD.right));
  const y = (balance: number) => PAD.top + (1 - balance / principal) * (H - PAD.top - PAD.bottom);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(1)} ${y(p.balance).toFixed(1)}`).join(' ');
  const base = H - PAD.bottom;
  const area = `${line} L${x(lastYear).toFixed(1)} ${base} L${x(0).toFixed(1)} ${base} Z`;
  const half = points[Math.floor(points.length / 2)];
  const description = `Loan balance falls from ${formatInr(principal)} to ${formatInr(points[points.length - 1].balance)} over ${lastYear} years. About half the years in, ${formatInr(half.balance)} is still left.`;

  return (
    <figure className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
      <figcaption className="text-xs font-bold text-slate-700">Loan left to pay, year by year</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={description} className="mt-2 h-auto w-full">
        <path d={area} fill="#fed7aa" opacity="0.6" />
        <path d={line} fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1={PAD.left} x2={W - PAD.right} y1={base} y2={base} stroke="#cbd5e1" />
        <text x={PAD.left} y={H - 8} fontSize="12" fill="#475569">Start</text>
        <text x={W - PAD.right} y={H - 8} fontSize="12" fill="#475569" textAnchor="end">Year {lastYear}</text>
        <text x={PAD.left + 4} y={PAD.top + 12} fontSize="12" fill="#475569">{formatInr(principal)}</text>
      </svg>
      <p className="mt-1 text-[11px] text-slate-500">{description}</p>
    </figure>
  );
};

export default EmiBalanceChart;
