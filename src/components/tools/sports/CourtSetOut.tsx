import React, { useMemo } from 'react';
import type { Margin, Variant } from '../../../lib/sports/courtData';
import { buildDiagram, diagramSvg } from '../../../lib/sports/diagram';
import type { ChainCaptions } from '../../../lib/sports/annotate';
import { markingSteps, netPositions, type MarkingText } from '../../../lib/sports/marking';

/** The full set-out guide on the page: a numbered drawing and every line, circle, arc and spot with its exact position. */
const CourtSetOut: React.FC<{ variant: Variant; margin: Margin; marking: MarkingText; marks: Record<string, string>; label: string; clearCaption: string; hint: string; captions: ChainCaptions }> = ({ variant, margin, marking, marks, label, clearCaption, hint, captions }) => {
  const steps = useMemo(() => markingSteps(variant, marking, (id) => marks[id] ?? id, netPositions(variant)), [variant, marking, marks]);
  const svg = useMemo(() => diagramSvg(buildDiagram(variant, margin, clearCaption, { steps, diagonals: true, hideKeyPoints: true, annotate: captions }), label, 'class="mx-auto block h-auto max-h-[26rem] w-full rounded-xl border border-slate-200"'), [variant, margin, steps, label, clearCaption, captions]);
  return (
    <div>
      <p className="text-xs text-slate-600">{marking.intro}</p>
      <div className="mt-3" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="mt-1 text-[11px] text-slate-500">{hint} {marking.setOutDiagram}</p>
      <h4 className="mt-4 text-sm font-semibold text-slate-900">{marking.prepTitle}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">{marking.prep.map((line) => <li key={line}>{line}</li>)}</ul>
      <ol className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.n} className="flex gap-3 text-xs">
            <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${step.prim ? 'bg-orange-700' : 'bg-emerald-800'}`}>{step.n}</span>
            <div><p className="font-semibold text-slate-900">{step.title}</p>{step.lines.map((line) => <p key={line} className="text-slate-700">{line}</p>)}</div>
          </li>
        ))}
      </ol>
      <h4 className="mt-4 text-sm font-semibold text-slate-900">{marking.checkTitle}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">{marking.check.map((line) => <li key={line}>{line}</li>)}</ul>
    </div>
  );
};

export default CourtSetOut;
