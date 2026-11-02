import React from 'react';
import { AdBanner } from '../common/AdBanner';
import { PageMetadata } from '../common/PageMetadata';
import { ADS_CONFIG } from '../../config/ads';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  seoContent?: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  subtitle,
  children,
  seoContent,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <PageMetadata title={title} description={subtitle} />
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Main Tool Functional Area */}
      <div className="w-full">
        {children}
      </div>

      {/* SEO / Questionnaire Guide (Steps & FAQs) */}
      {seoContent && (
        <div className="w-full pt-4 border-t border-slate-200">
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
  );
};

export default ToolLayout;