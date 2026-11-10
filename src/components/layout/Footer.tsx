import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { getTopics, topicNameKey } from '../../config/topics';
import { useTranslation } from 'react-i18next';
import { getToolCopy } from '../../lib/localizedTool';
import { FooterToolGroup } from './FooterToolGroup';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const topics = getTopics();
  const toolCount = topics.reduce((sum, topic) => sum + topic.tools.length, 0);

  const linkClass = 'transition hover:text-white';

  return (
    <footer className="print:hidden bg-stone-900 text-stone-300 text-xs border-t border-stone-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        {/* Company links: always visible, compact */}
        <nav aria-label={t('company')} className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 sm:justify-start">
          <Link to="/guides" className={linkClass}>{t('guides')}</Link>
          <Link to="/about" className={linkClass}>{t('about')}</Link>
          <Link to="/contact" className={linkClass}>{t('contact')}</Link>
          <Link to="/privacy" className={linkClass}>{t('privacyPolicy')}</Link>
          <Link to="/terms" className={linkClass}>{t('terms')}</Link>
          <Link to="/whats-new" className={linkClass}>{t('whatsNew')}</Link>
          <Link to="/editorial-policy" className={linkClass}>{t('editorialPolicy')}</Link>
          <Link to="/contact" className="font-bold text-orange-300 transition hover:text-orange-200">{t('requestShort')}</Link>
        </nav>

        {/* All tools: one line until opened. The links stay in the page either way. */}
        <details className="group rounded-lg border border-stone-700/70">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-200 marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{t('allTools')} <span className="font-normal normal-case tracking-normal text-stone-500">({toolCount})</span></span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <nav aria-label={t('footerNav')} className="grid grid-cols-2 gap-2 border-t border-stone-700/70 p-2 sm:grid-cols-3 lg:grid-cols-7 lg:gap-x-6 lg:gap-y-6 lg:p-4">
            {topics.map((topic) => (
              <FooterToolGroup key={topic.id} title={t(topicNameKey(topic.id))} count={topic.tools.length}>
                <ul className="space-y-1.5 sm:columns-2 lg:columns-1">
                  {topic.tools.map((tool) => {
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
        </details>

        <p className="text-center text-[11px] text-stone-400 sm:text-left">
          <span className="font-bold text-stone-200">{siteConfig.name}</span> &copy; {new Date().getFullYear()} &middot; {siteConfig.location}
          <span className="hidden sm:inline"> &middot; {t('networkNote')}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
