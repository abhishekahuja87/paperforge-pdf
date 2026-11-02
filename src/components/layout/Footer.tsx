import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { TOOLS } from '../../config/tools';

export const Footer: React.FC = () => {
  const activeTools = TOOLS.filter((t) => t.isAvailable);

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Top Section: Brand & Slogan */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="font-bold text-white text-sm">{siteConfig.name}</span>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <p className="text-slate-400 max-w-sm">
              Selected files are processed on your device. Ads and contact submissions make separate network requests.
            </p>
          </div>

          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-[11px] font-medium">
            <Lock className="w-3 h-3" />
            <span>Local file processing</span>
          </span>
        </div>

        {/* Middle Section: Active Tool Links */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-slate-400">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold w-full md:w-auto">
            Tools:
          </span>
          {activeTools.map((t) => (
            <Link key={t.id} to={t.path} className="hover:text-white transition">
              {t.title}
            </Link>
          ))}
        </div>

        {/* Bottom Section: Legal & Compliance Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-[11px]">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link to="/about" className="hover:text-white transition">
              About
            </Link>
            <Link to="/contact" className="hover:text-white transition">
              Contact
            </Link>
            <Link to="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
          </nav>

          <p className="text-slate-400 text-center sm:text-right">
            &copy; {new Date().getFullYear()} {siteConfig.name}. Privacy-first, client-side tools.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;