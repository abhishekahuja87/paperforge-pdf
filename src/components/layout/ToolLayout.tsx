import React from 'react';
import { AdBanner } from '../common/AdBanner';
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
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Top Ad Slot (Above Tool) */}
      <div className="w-full max-w-4xl mx-auto min-h-[90px] flex justify-center items-center">
        <AdBanner slot={ADS_CONFIG.slots.toolTopBanner} />
      </div>

      {/* Main Tool Functional Area */}
      <div className="w-full">
        {children}
      </div>

      {/* Bottom Ad Slot (Between Tool & FAQs/Guide) */}
      <div className="w-full max-w-4xl mx-auto min-h-[90px] flex justify-center items-center">
        <AdBanner slot={ADS_CONFIG.slots.toolBottomBanner} />
      </div>

      {/* SEO / Questionnaire Guide (Steps & FAQs) */}
      {seoContent && (
        <div className="w-full pt-4 border-t border-slate-200">
          {seoContent}
        </div>
      )}
    </div>
  );
};

export default ToolLayout;