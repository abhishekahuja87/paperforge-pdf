import React from 'react';
import { ShieldCheck, Zap, ServerOff } from 'lucide-react';
import { siteConfig } from '../../config/site';

export const UnifiedHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-lg px-5 py-6 sm:px-8 sm:py-8">
      {/* Subtle Ambient Background Flare */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-3">
        {/* Live Privacy Engine Indicator */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span>100% In-Browser Engine</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-300 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
            Zero Server Uploads
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Everyday Utilities.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-emerald-300">
            Powered by Your Device.
          </span>
        </h1>

        {/* Core Description */}
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
          Unlike traditional web converters that upload your contracts, photos, and files to cloud servers, <span className="text-white font-medium">{siteConfig.name}</span> executes every byte locally in your browser memory via WebAssembly.
        </p>

        {/* 3 Unified Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-slate-100">True Privacy</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                Files remain in local RAM only. No logs or cloud copies exist.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start space-x-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-slate-100">Zero Upload Lag</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                Instant execution on your hardware without internet bottlenecks.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start space-x-2.5">
            <ServerOff className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-slate-100">Zero Cloud Egress</h3>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                Client-side code execution with zero account registration needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};