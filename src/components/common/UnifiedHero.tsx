import React from 'react';
import { ShieldCheck, WifiOff } from 'lucide-react';
import { siteConfig } from '../../config/site';

export const UnifiedHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl px-5 py-6 sm:px-8 sm:py-7">
      {/* Ambient Glow Effects */}
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
        {/* Live In-Browser Privacy Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-emerald-300 border border-emerald-500/25 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span>100% In-Browser Engine</span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-1 text-white">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
            Zero Server Uploads
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Professional Utilities.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300">
            Executed Entirely in Your Browser.
          </span>
        </h1>

        {/* Clear Explanation */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
          Unlike online tools that upload your sensitive documents to cloud servers, <span className="text-white font-semibold">{siteConfig.name}</span> processes all raw file bytes locally inside your browser RAM.
        </p>

        {/* Verifiable Air-Gapped Banner */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs text-left">
          <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Air-Gapped Privacy:</strong> Once loaded, disconnect your internet—all operations run locally in your browser memory without network requests.
          </span>
        </div>
      </div>
    </section>
  );
};


