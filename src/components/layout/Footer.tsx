import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site';
import { TOOLS } from '../../config/tools';
import { useTranslation } from 'react-i18next';
import { getToolCopy } from '../../lib/localizedTool';
import { FooterToolGroup } from './FooterToolGroup';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const available = TOOLS.filter((tool) => tool.isAvailable);

  // Every available tool appears here, including the tools that are folded away on the home page.
  const toolColumns = [
    { key: 'pdfTools', tools: available.filter((tool) => tool.category === 'pdf' && tool.tier !== 'workspace') },
    { key: 'imageTools', tools: available.filter((tool) => tool.category === 'media') },
    { key: 'financeTools', tools: available.filter((tool) => tool.category === 'finance') },
    { key: 'everydayTools', tools: available.filter((tool) => tool.category === 'everyday') },
    { key: 'textTools', tools: available.filter((tool) => tool.category === 'text') },
    { key: 'developerTools', tools: available.filter((tool) => tool.category === 'dev') },
    { key: 'workspaces', tools: available.filter((tool) => tool.tier === 'workspace') },
  ].filter((column) => column.tools.length > 0);

  const linkClass = 'transition hover:text-white';

  return (
    <footer className="print:hidden bg-stone-900 text-stone-300 text-xs border-t border-stone-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        {/* Brand & slogan */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pb-6 border-b border-stone-700/80 text-center sm:text-left">
          <span className="font-bold text-white text-sm">{siteConfig.name}</span>
          <span className="hidden sm:inline text-stone-500">&bull;</span>
          <p className="text-stone-300 max-w-sm">{t('networkNote')}</p>
        </div>

        {/* Company links: always visible, in one wrapped row */}
        <nav aria-label={t('company')} className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
          <Link to="/guides" className={linkClass}>{t('guides')}</Link>
          <Link to="/about" className={linkClass}>{t('about')}</Link>
          <Link to="/whats-new" className={linkClass}>{t('whatsNew')}</Link>
          <Link to="/editorial-policy" className={linkClass}>{t('editorialPolicy')}</Link>
          <Link to="/contact" className={linkClass}>{t('contact')}</Link>
          <Link to="/privacy" className={linkClass}>{t('privacyPolicy')}</Link>
          <Link to="/terms" className={linkClass}>{t('terms')}</Link>
          <Link to="/contact" className="font-bold text-orange-300 transition hover:text-orange-200">{t('requestShort')}</Link>
        </nav>

        {/* Tool links: folded by category on small screens, open on wide screens */}
        <nav aria-label={t('footerNav')} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7 lg:gap-x-6 lg:gap-y-6">
          {toolColumns.map((column) => (
            <FooterToolGroup key={column.key} title={t(column.key)} count={column.tools.length}>
              <ul className="space-y-1.5 sm:columns-2 lg:columns-1">
                {column.tools.map((tool) => {
                  const copy = getToolCopy(tool, i18n.language);
                  return (
                    <li key={tool.id} className="break-inside-avoid">
                      <Link to={tool.path} className={`${linkClass} inline-block py-0.5`}>
                        <span lang={copy.language}>{copy.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </FooterToolGroup>
          ))}
        </nav>

        <p className="pt-4 border-t border-stone-700/80 text-[11px] text-stone-400 text-center sm:text-right">
          &copy; {new Date().getFullYear()} {siteConfig.name} &middot; {siteConfig.location}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
