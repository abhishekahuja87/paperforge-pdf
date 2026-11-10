import React, { useMemo } from 'react';
import type { Margin, Variant } from '../../../lib/sports/courtData';
import { buildDiagram, diagramSvg } from '../../../lib/sports/diagram';

/** The court drawn to scale with its measurements written on it. The markup is built from our own data only. */
const CourtDiagram: React.FC<{ variant: Variant; margin: Margin; label: string; clearCaption: string }> = ({ variant, margin, label, clearCaption }) => {
  const svg = useMemo(() => diagramSvg(buildDiagram(variant, margin, clearCaption), label, 'class="mx-auto block h-auto max-h-[26rem] w-full rounded-xl border border-slate-200"'), [variant, margin, label, clearCaption]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default CourtDiagram;
