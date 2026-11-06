import React from 'react';
import { AdBanner } from '../common/AdBanner';
import { PageMetadata } from '../common/PageMetadata';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADS_CONFIG } from '../../config/ads';
import type { GuideStep } from '../common/ToolGuide';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  seoContent?: React.ReactNode;
  steps?: GuideStep[];
  appearance?: 'standard' | 'workshop';
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  subtitle,
  children,
  seoContent,
  steps,
  appearance = 'standard',
}) => {
  const isWorkshop = appearance === 'workshop';

  return (
    <div className={isWorkshop ? 'min-h-full bg-[#f7f3eb] text-stone-900' : ''}>
      <div className={`mx-auto px-4 py-8 ${isWorkshop ? 'max-w-6xl space-y-7 sm:py-10' : 'max-w-5xl space-y-8'}`}>
        <PageMetadata title={title} description={subtitle} />
        {isWorkshop ? (
          <header className="mx-auto max-w-2xl text-center">
            <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition hover:text-orange-800">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              All tools
            </Link>
            <h1 className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-stone-900 sm:text-4xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">{subtitle}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              100% local file processing. Your files never leave your browser.
            </p>
          </header>
        ) : (
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
            <p className="mx-auto max-w-2xl text-base text-slate-500">{subtitle}</p>
          </div>
        )}

        {/* Main Tool Functional Area */}
        <div className={isWorkshop ? 'mx-auto w-full max-w-3xl' : 'w-full'}>{children}</div>

        {isWorkshop && steps && steps.length > 0 && (
          <section aria-label="How it works" className="mx-auto w-full max-w-3xl space-y-2">
            <h2 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">How it works</h2>
            <ol className="grid gap-3 sm:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3 rounded-lg border-l-4 border-orange-500 bg-white px-3 py-3 shadow-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">{index + 1}</span>
                  <div>
                    <p className="text-sm font-extrabold text-stone-900">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* SEO / Questionnaire Guide (Steps & FAQs) */}
        {seoContent && (
          <div className={`w-full ${isWorkshop ? 'pt-3' : 'border-t border-slate-200 pt-4'}`}>
            {seoContent}
          </div>
        )}

        <section
          aria-label="Advertisements"
          className="w-full max-w-4xl mx-auto py-4"
        >
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Advertisements
          </p>
          <AdBanner slot={ADS_CONFIG.slots.toolBottomBanner} />
        </section>
      </div>
    </div>
  );
};

export default ToolLayout;