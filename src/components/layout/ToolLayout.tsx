import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';
import { adsAndAnalyticsConfig } from '../../config/adsAndAnalytics';

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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back to Home Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>
      </div>

      {/* Tool Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">{subtitle}</p>
      </div>

      {/* Main Interactive Tool Workspace */}
      <div>{children}</div>

      {/* Instructional Content / SEO Section (Above the bottom ad) */}
      {seoContent && <div className="pt-2">{seoContent}</div>}

      {/* Single Bottom Ad Slot */}
      <div className="pt-4">
        <AdSlot slotId={adsAndAnalyticsConfig.ads.toolBottomBannerSlot} format="banner" />
      </div>
    </div>
  );
};