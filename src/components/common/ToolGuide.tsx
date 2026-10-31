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
  steps: GuideStep[];
  faqs: GuideFaq[];
  privacyNote?: string;
}

export const ToolGuide: React.FC<ToolGuideProps> = ({
  toolName,
  steps,
  faqs,
  privacyNote,
}) => {
  return (
    <div className="space-y-8 pt-6 border-t border-slate-200">
      {/* 3-Step Instructional Guide */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          How to Use {toolName}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </div>
              <h3 className="text-xs font-semibold text-slate-900 pt-1">{step.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-3">
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800">Frequently Asked Questions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1"
            >
              <h3 className="text-xs font-semibold text-slate-800">{faq.question}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Local Processing Guarantee Note */}
      <section className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-emerald-900 leading-relaxed">
          <strong className="font-semibold text-emerald-950">100% Client-Side Privacy: </strong>
          {privacyNote ||
            `All document processing runs inside your browser memory using WebAssembly. Files never touch the ${siteConfig.name} servers or third-party networks.`}
        </div>
      </section>
    </div>
  );
};