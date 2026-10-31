import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Lock, Cpu, ServerOff } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { adsAndAnalyticsConfig } from '../../config/adsAndAnalytics';
import { AdSlot } from '../common/AdSlot';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  seoContent?: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({ title, subtitle, children, seoContent }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto w-full space-y-6">
      {/* Top Header Ad Slot */}
      <AdSlot slotId={adsAndAnalyticsConfig.ads.toolTopBannerSlot} format="compact" />

      {/* Page Title & Subtitle */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">{subtitle}</p>
      </div>

      {/* Interactive Tool Area */}
      <div>{children}</div>

      {/* Privacy Guarantee Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-slate-800 text-xs">
        <div className="flex items-start space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">Zero Server Uploads &bull; Device-Only Processing</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>{siteConfig.name}</strong> operates entirely in your browser using local resources. Your files never transfer over the network to any server.
            </p>

            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="inline-flex items-center space-x-1 font-semibold text-emerald-700 hover:text-emerald-900 pt-1"
            >
              <span>{showTechnicalDetails ? 'Hide details' : 'How does client-side processing work?'}</span>
              {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 pt-2 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-start space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>RAM Sandbox:</strong> Processed in local browser memory.</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-start space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Local CPU:</strong> Merging performed by your hardware.</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-start space-x-1.5">
                  <ServerOff className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span><strong>No Egress:</strong> Zero external network requests.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Ad Slot */}
      <AdSlot slotId={adsAndAnalyticsConfig.ads.toolBottomBannerSlot} format="banner" />

      {/* SEO & Instructional Copy */}
      {seoContent && (
        <article className="prose prose-slate max-w-none border-t border-slate-200 pt-8 text-xs sm:text-sm text-slate-700">
          {seoContent}
        </article>
      )}
    </div>
  );
};