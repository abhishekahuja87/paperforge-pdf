import React from 'react';
import type { Margin, Variant } from '../../../lib/sports/courtData';
import { spaceNeeded } from '../../../lib/sports/fit';

const PAD = 1.5;

/** The court drawn to scale in metres. The dotted box is the clear space the rules ask for. */
const CourtDiagram: React.FC<{ variant: Variant; margin: Margin; label: string }> = ({ variant, margin, label }) => {
  const [needLong, needShort] = spaceNeeded(variant, margin, 0);
  const ox = (needLong - variant.length) / 2;
  const oy = (needShort - variant.width) / 2;
  const left = -Math.max(ox, 0) - PAD;
  const top = -Math.max(oy, 0) - PAD;
  const w = Math.max(needLong, variant.length) + 2 * PAD;
  const h = Math.max(needShort, variant.width) + 2 * PAD;
  return (
    <svg role="img" aria-label={label} viewBox={`${left} ${top} ${w} ${h}`} className="mx-auto block h-auto max-h-[22rem] w-full rounded-xl border border-slate-200 bg-emerald-50">
      <rect x={-ox} y={-oy} width={needLong} height={needShort} fill="none" stroke="#64748b" strokeWidth={1.5} strokeDasharray="1 4" vectorEffect="non-scaling-stroke" />
      <rect x={0} y={0} width={variant.length} height={variant.width} fill="#d1fae5" stroke="none" rx={variant.round ? Math.min(variant.length, variant.width) / 2 : 0} />
      <g fill="none" stroke="#065f46" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {variant.lines.map((d, i) => <path key={i} d={d} vectorEffect="non-scaling-stroke" />)}
        {(variant.dashed ?? []).map((d, i) => <path key={`d${i}`} d={d} strokeDasharray="6 4" stroke="#b45309" vectorEffect="non-scaling-stroke" />)}
      </g>
    </svg>
  );
};

export default CourtDiagram;
