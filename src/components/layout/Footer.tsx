import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { TOOLS } from '../../config/tools';

export const Footer: React.FC = () => {
  const activeTools = TOOLS.filter((t) => t.isAvailable);

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="font-bold text-white text-sm">{siteConfig.name}</span>
          <span className="hidden sm:inline text-slate-600">&bull;</span>
          <p className="text-slate-400 max-w-sm">
            Zero-upload digital utility suite. Files process strictly in browser memory.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {activeTools.map((t) => (
            <Link key={t.id} to={t.path} className="hover:text-white transition">
              {t.title}
            </Link>
          ))}
          <span className="inline-flex items-center space-x-1 text-emerald-400">
            <Lock className="w-3 h-3" />
            <span>Client-Side</span>
          </span>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-3 text-center text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} {siteConfig.name}. Privacy Guaranteed.
      </div>
    </footer>
  );
};