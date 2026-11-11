import React, { useMemo } from 'react';
import { sampleResume } from '../../../lib/careers/resume';
import { RESUME_TEMPLATES, type ResumeTemplateSpec } from '../../../lib/careers/resumeTemplates';
import { PAPER, ResumePreview } from './ResumePreview';

const THUMB_WIDTH = 104;
const SCALE = THUMB_WIDTH / PAPER.a4.width;

const Thumb: React.FC<{ spec: ResumeTemplateSpec; accent: string }> = ({ spec, accent }) => {
  const resume = useMemo(sampleResume, []);
  return (
    <span aria-hidden="true" className="block overflow-hidden rounded border border-slate-200 bg-white shadow-sm" style={{ width: THUMB_WIDTH, height: Math.round(PAPER.a4.height * SCALE) }}>
      <span className="pointer-events-none block origin-top-left" style={{ width: PAPER.a4.width, transform: `scale(${SCALE})` }}>
        <ResumePreview decorative resume={resume} style={{ template: spec.id, accent: spec.colour ? accent : spec.accent, size: 'compact', paper: 'a4' }} />
      </span>
    </span>
  );
};

/** Picture gallery of the resume templates. Each picture is the real layout filled with an example resume. */
export const ResumeTemplatePicker: React.FC<{ value: string; accent: string; onChange: (spec: ResumeTemplateSpec) => void }> = ({ value, accent, onChange }) => (
  <div role="group" aria-label="Resume template" className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] justify-items-center gap-3">
    {RESUME_TEMPLATES.map((spec) => {
      const selected = spec.id === value;
      return (
        <button
          key={spec.id}
          type="button"
          aria-pressed={selected}
          title={spec.blurb}
          onClick={() => onChange(spec)}
          className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 text-center transition ${selected ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200' : 'border-transparent hover:border-slate-200 hover:bg-white'}`}
        >
          <Thumb spec={spec} accent={selected ? accent : spec.accent} />
          <span className="text-[11px] font-bold leading-tight text-slate-900">{spec.name}</span>
          <span className="text-[10px] leading-tight text-slate-500">{spec.sidebar ? 'Two columns' : spec.colour ? 'Colour' : 'Plain'}</span>
        </button>
      );
    })}
  </div>
);

export default ResumeTemplatePicker;
