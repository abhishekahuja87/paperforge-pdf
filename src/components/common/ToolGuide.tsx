import React from 'react';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { siteConfig } from '../../config/site';

export interface GuideStep {
  title: string;
  description: string;
}

export interface GuideFaq {
  question: string;
  answer: string;
}

interface ToolGuideProps {
  toolName: string;
  steps?: GuideStep[];
  faqs: GuideFaq[];
  privacyNote?: string;
  appearance?: 'standard' | 'workshop';
}

export const ToolGuide: React.FC<ToolGuideProps> = ({
  toolName,
  steps = [],
  faqs,
  privacyNote,
  appearance = 'standard',
}) => {
  const isWorkshop = appearance === 'workshop';

  if (isWorkshop) {
    return (
      <section aria-label="Frequently asked questions" className="mx-auto max-w-3xl space-y-2">
        <h2 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Questions</h2>
        <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span aria-hidden="true" className="text-lg leading-none text-orange-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }
  return (
    <div className={`space-y-6 ${isWorkshop ? '' : 'border-t border-slate-200 pt-6'}`}>
      {/* 3-Step Instructional Guide */}
      <section className="space-y-3">
        <h2 className={`text-sm font-bold uppercase tracking-wider ${isWorkshop ? 'text-stone-700' : 'text-slate-700'}`}>
          How to Use {toolName}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`space-y-1 rounded-xl border p-3.5 ${isWorkshop ? 'border-stone-200 bg-[#fffdf8]' : 'border-slate-200/80 bg-slate-50'}`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${isWorkshop ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-700'}`}>
                {idx + 1}
              </div>
              <h3 className={`pt-1 text-sm font-semibold ${isWorkshop ? 'text-stone-900' : 'text-slate-900'}`}>{step.title}</h3>
              <p className={`text-xs leading-relaxed ${isWorkshop ? 'text-stone-600' : 'text-slate-600'}`}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-3">
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <h2 className={`text-sm font-bold ${isWorkshop ? 'text-stone-800' : 'text-slate-800'}`}>Frequently Asked Questions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`space-y-1 rounded-xl border p-3.5 shadow-2xs ${isWorkshop ? 'border-stone-200 bg-[#fffdf8]' : 'border-slate-200 bg-white'}`}
            >
              <h3 className={`text-sm font-semibold ${isWorkshop ? 'text-stone-800' : 'text-slate-800'}`}>{faq.question}</h3>
              <p className={`text-xs leading-relaxed ${isWorkshop ? 'text-stone-600' : 'text-slate-600'}`}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Local Processing Guarantee Note */}
      <section className={`flex items-start space-x-2.5 rounded-xl border p-3.5 ${isWorkshop ? 'border-emerald-200 bg-emerald-50' : 'border-emerald-200/80 bg-emerald-50/70'}`}>
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <strong className="font-semibold text-emerald-950">Local File Processing: </strong>
          {privacyNote ||
            `This tool processes your files in your browser; they are never uploaded to ${siteConfig.name} servers for processing.`}
        </div>
      </section>
    </div>
  );
};