import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site';
import { TOOLS } from '../../config/tools';
import { useTranslation } from 'react-i18next';
import { getToolCopy } from '../../lib/localizedTool';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const available = TOOLS.filter((tool) => tool.isAvailable);

  // Every available tool appears here, including the advanced tools that are not shown on the homepage.
  const toolColumns = [
    { key: 'pdfTools', tools: available.filter((tool) => tool.category === 'pdf' && tool.tier !== 'workspace') },
    { key: 'imageTools', tools: available.filter((tool) => tool.category === 'media') },
    { key: 'developerTools', tools: available.filter((tool) => tool.category === 'dev') },
    { key: 'workspaces', tools: available.filter((tool) => tool.tier === 'workspace') },
  ].filter((column) => column.tools.length > 0);

  const linkClass = 'transition hover:text-white';

  return (
    <footer className="bg-stone-900 text-stone-300 text-xs border-t border-stone-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Brand & slogan */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pb-6 border-b border-stone-700/80 text-center sm:text-left">
          <span className="font-bold text-white text-sm">{siteConfig.name}</span>
          <span className="hidden sm:inline text-stone-500">&bull;</span>
          <p className="text-stone-300 max-w-sm">{t('networkNote')}</p>
        </div>

        {/* Tool and company links */}
        <nav aria-label={t('footerNav')} className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {toolColumns.map((column) => (
            <div key={column.key}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{t(column.key)}</h2>
              <ul className="space-y-1.5">
                {column.tools.map((tool) => {
                  const copy = getToolCopy(tool, i18n.language);
                  return (
                    <li key={tool.id}>
                      <Link to={tool.path} className={linkClass}>
                        <span lang={copy.language}>{copy.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{t('company')}</h2>
            <ul className="space-y-1.5">
              <li><Link to="/about" className={linkClass}>{t('about')}</Link></li>
              <li><Link to="/contact" className={linkClass}>{t('contact')}</Link></li>
              <li><Link to="/privacy" className={linkClass}>{t('privacyPolicy')}</Link></li>
              <li><Link to="/terms" className={linkClass}>{t('terms')}</Link></li>
              <li><Link to="/contact" className="font-bold text-orange-300 transition hover:text-orange-200">{t('requestShort')}</Link></li>
            </ul>
          </div>
        </nav>

        <p className="pt-4 border-t border-stone-700/80 text-[11px] text-stone-400 text-center sm:text-right">
          &copy; {new Date().getFullYear()} {siteConfig.name} &middot; {siteConfig.location}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
