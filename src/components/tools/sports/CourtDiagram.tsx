import React, { useMemo } from 'react';
import type { Margin, Variant } from '../../../lib/sports/courtData';
import type { AnnotateOptions } from '../../../lib/sports/annotate';
import { buildDiagram, diagramSvg } from '../../../lib/sports/diagram';

/** The court drawn to scale with its measurements written on it. The markup is built from our own data only. */
const CourtDiagram: React.FC<{ variant: Variant; margin: Margin; label: string; clearCaption: string; annotate: AnnotateOptions }> = ({ variant, margin, label, clearCaption, annotate }) => {
  const svg = useMemo(() => diagramSvg(buildDiagram(variant, margin, clearCaption, { annotate }), label, 'class="mx-auto block h-auto max-h-[26rem] w-full rounded-xl border border-slate-200"'), [variant, margin, label, clearCaption, annotate]);
  return <div className="overflow-x-auto"><div className="min-w-[720px]" dangerouslySetInnerHTML={{ __html: svg }} /></div>;
};

export default CourtDiagram;
