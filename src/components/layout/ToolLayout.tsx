import React, { useEffect, useRef, useState } from 'react';
import { AdBanner } from '../common/AdBanner';
import { PageMetadata } from '../common/PageMetadata';
import { ArrowLeft, Maximize2, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ToolArticle } from '../common/ToolArticle';
import { ADS_CONFIG } from '../../config/ads';
import { siteConfig } from '../../config/site';
import { buildToolJsonLd } from '../../lib/structuredData';
import { useTranslation } from 'react-i18next';
import { useFocusMode } from '../../lib/focusMode';
import { GuideRegistryContext } from '../common/guideRegistry';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  seoContent?: React.ReactNode;
  appearance?: 'standard' | 'workshop';
  wide?: boolean;
  contentLanguage?: string;
  controlsLanguage?: string;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  subtitle,
  children,
  seoContent,
  appearance = 'workshop',
  wide = false,
  contentLanguage = 'en',
  controlsLanguage = 'en',
}) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isWorkshop = appearance === 'workshop';
  const { active: focusOn, setFocus, registerToolPage } = useFocusMode();
  const [guideShowsArticle, setGuideShowsArticle] = useState(false);

  // Tell the focus mode this is a tool page, so only tool pages are ever put into focus.
  useEffect(() => {
    registerToolPage(true);
    return () => registerToolPage(false);
  }, [registerToolPage]);

  // "Collapse all / Expand all" covers every foldable section (article sections and questions) below the tool.
  const foldRef = useRef<HTMLDivElement>(null);
  const [folds, setFolds] = useState({ total: 0, open: 0 });
  useEffect(() => {
    const node = foldRef.current;
    if (!node) return undefined;
    const recount = () => {
      const all = node.querySelectorAll('details');
      setFolds({ total: all.length, open: node.querySelectorAll('details[open]').length });
    };
    recount();
    // "toggle" does not bubble, so listen while it travels down; new sections can appear after content loads.
    node.addEventListener('toggle', recount, true);
    const observer = new MutationObserver(recount);
    observer.observe(node, { childList: true, subtree: true });
    return () => {
      node.removeEventListener('toggle', recount, true);
      observer.disconnect();
    };
  }, [pathname, focusOn]);
  const allOpen = folds.total > 0 && folds.open >= folds.total;
  const toggleAll = () => {
    foldRef.current?.querySelectorAll('details').forEach((item) => { item.open = !allOpen; });
  };

  return (
    <div className={isWorkshop ? 'min-h-full bg-[var(--theme-background)] text-stone-900' : ''}>
      <div className={`mx-auto px-4 py-8 ${isWorkshop ? 'max-w-6xl space-y-7 sm:py-10' : 'max-w-5xl space-y-8'}`}>
        <PageMetadata
          title={`${title} ${siteConfig.toolTitleSuffix}`}
          description={subtitle}
          jsonLd={buildToolJsonLd({ name: title, description: subtitle, path: pathname })}
        />
        {focusOn ? (
          <h1 lang={contentLanguage} className="text-center text-lg font-black tracking-tight text-stone-900 sm:text-xl">{title}</h1>
        ) : isWorkshop ? (
          <header className="mx-auto max-w-2xl text-center">
            <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition hover:text-orange-800">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('allTools')}
            </Link>
            <h1 lang={contentLanguage} className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-stone-900 sm:text-4xl">{title}</h1>
            <p lang={contentLanguage} className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">{subtitle}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('localProcessing')}
            </p>
          </header>
        ) : (
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
            <p className="mx-auto max-w-2xl text-base text-slate-500">{subtitle}</p>
          </div>
        )}


        {/* Main Tool Functional Area */}
        <div lang={controlsLanguage} className={isWorkshop ? `tool-workshop-controls mx-auto w-full ${wide ? 'max-w-6xl' : 'max-w-3xl'}` : 'w-full'}>{children}</div>

        {!focusOn && (
          <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setFocus(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-orange-300 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-orange-600"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('focusMode', { defaultValue: 'Focus mode' })}
            </button>
            {folds.total > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-orange-600"
              >
                {allOpen ? t('collapseAll', { defaultValue: 'Collapse all' }) : t('expandAll', { defaultValue: 'Expand all' })}
              </button>
            )}
          </div>
        )}

        {/* Everything foldable sits in one accordion. A guide lists the written sections together with its
            questions; with no guide, the article shows on its own. */}
        {!focusOn && (
          <GuideRegistryContext.Provider value={{ guideShowsArticle, setGuideShowsArticle }}>
            <div ref={foldRef} className="space-y-6">
              <ToolArticle id={pathname.replace(/^\/+|\/+$/g, '')} />
              {seoContent && (
                <div className={`w-full print:hidden ${isWorkshop ? '' : 'border-t border-slate-200 pt-4'}`}>
                  {seoContent}
                </div>
              )}
            </div>
          </GuideRegistryContext.Provider>
        )}

        {!focusOn && (
        <section
          aria-label={t('advertisements')}
          className="w-full max-w-4xl mx-auto py-4 print:hidden"
        >
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {t('advertisements')}
          </p>
          <AdBanner slot={ADS_CONFIG.slots.toolBottomBanner} />
        </section>
        )}
      </div>
    </div>
  );
};

export default ToolLayout;