import React from 'react';
import { AdBanner } from '../common/AdBanner';
import { PageMetadata } from '../common/PageMetadata';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ToolArticle } from '../common/ToolArticle';
import { ToolUpdateNote } from '../common/ToolUpdateNote';
import { ADS_CONFIG } from '../../config/ads';
import { siteConfig } from '../../config/site';
import { buildToolJsonLd } from '../../lib/structuredData';
import { useTranslation } from 'react-i18next';

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

  return (
    <div className={isWorkshop ? 'min-h-full bg-[var(--theme-background)] text-stone-900' : ''}>
      <div className={`mx-auto px-4 py-8 ${isWorkshop ? 'max-w-6xl space-y-7 sm:py-10' : 'max-w-5xl space-y-8'}`}>
        <PageMetadata
          title={`${title} ${siteConfig.toolTitleSuffix}`}
          description={subtitle}
          jsonLd={buildToolJsonLd({ name: title, description: subtitle, path: pathname })}
        />
        {isWorkshop ? (
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

        <ToolUpdateNote path={pathname} />

        {/* Main Tool Functional Area */}
        <div lang={controlsLanguage} className={isWorkshop ? `tool-workshop-controls mx-auto w-full ${wide ? 'max-w-6xl' : 'max-w-3xl'}` : 'w-full'}>{children}</div>

        {/* Written explanation for this tool, when one exists (keyed by route path) */}
        <ToolArticle id={pathname.replace(/^\/+|\/+$/g, '')} />

        {/* SEO / Questionnaire Guide (Steps & FAQs) */}
        {seoContent && (
          <div className={`w-full print:hidden ${isWorkshop ? 'pt-3' : 'border-t border-slate-200 pt-4'}`}>
            {seoContent}
          </div>
        )}

        <section
          aria-label={t('advertisements')}
          className="w-full max-w-4xl mx-auto py-4 print:hidden"
        >
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {t('advertisements')}
          </p>
          <AdBanner slot={ADS_CONFIG.slots.toolBottomBanner} />
        </section>
      </div>
    </div>
  );
};

export default ToolLayout;