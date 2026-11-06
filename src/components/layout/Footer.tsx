import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site';
import { TOOLS } from '../../config/tools';
import { useTranslation } from 'react-i18next';
import { getToolCopy } from '../../lib/localizedTool';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const activeTools = TOOLS.filter((t) => t.isAvailable);

  return (
    <footer className="bg-stone-900 text-stone-300 text-xs border-t border-stone-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Top Section: Brand & Slogan */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-stone-700/80">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="font-bold text-white text-sm">{siteConfig.name}</span>
            <span className="hidden sm:inline text-stone-500">&bull;</span>
            <p className="text-stone-300 max-w-sm">
              {t('networkNote')}
            </p>
          </div>
          <Link to="/contact" className="font-bold text-orange-300 hover:text-orange-200 transition">
            {t('requestShort')}
          </Link>
        </div>

        {/* Middle Section: Active Tool Links */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-stone-300">
          <span className="text-stone-400 text-[11px] uppercase tracking-wider font-semibold w-full md:w-auto">
            {t('tools')}:
          </span>
          {activeTools.map((tool) => (
            <Link key={tool.id} to={tool.path} className="hover:text-white transition">
              <span lang={getToolCopy(tool, i18n.language).language}>{getToolCopy(tool, i18n.language).title}</span>
            </Link>
          ))}
        </div>

        {/* Bottom Section: Legal & Compliance Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-700/80 text-[11px]">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link to="/about" className="hover:text-white transition">
              {t('about')}
            </Link>
            <Link to="/contact" className="hover:text-white transition">
              {t('contact')}
            </Link>
            <Link to="/privacy" className="hover:text-white transition">
              {t('privacyPolicy')}
            </Link>
            <Link to="/terms" className="hover:text-white transition">
              {t('terms')}
            </Link>
          </nav>

          <p className="text-stone-400 text-center sm:text-right">
            &copy; {new Date().getFullYear()} {siteConfig.name}.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;