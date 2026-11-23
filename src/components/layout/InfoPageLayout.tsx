import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMetadata } from '../common/PageMetadata';
import { useTranslation } from 'react-i18next';
import { PromisePill } from '../common/PromisePill';

interface InfoPageLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  children: React.ReactNode;
  contentLanguage?: string;
  noindex?: boolean;
  /** A smaller headline, for pages that carry a lot of content under it. */
  compact?: boolean;
  /** Left-aligned by default, like a tool page. Pass false only for a deliberately centred page. */
  leftAligned?: boolean;
  /** Shown on the same line as the back link. Defaults to the promise pill, like a tool page. */
  topExtra?: React.ReactNode;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, subtitle, description, children, contentLanguage = 'en', noindex = false, compact = false, leftAligned = true, topExtra = <PromisePill /> }) => {
  const { t } = useTranslation();
  return (
  <div className="min-h-full bg-[var(--theme-background)] px-4 py-8 sm:py-10">
    <PageMetadata title={title} description={description} noindex={noindex} />
    <div className="mx-auto max-w-3xl space-y-7">
      <header className={leftAligned ? 'text-left' : 'text-center'}>
        <div className={leftAligned ? 'mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5' : 'mb-4'}>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition hover:text-orange-800">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('allTools')}
          </Link>
          {topExtra}
        </div>
        <h1 lang={contentLanguage} className={compact ? 'text-2xl font-black leading-[1.12] tracking-[-0.03em] text-stone-900 sm:text-3xl' : 'text-3xl font-black leading-[1.08] tracking-[-0.04em] text-stone-900 sm:text-4xl'}>{title}</h1>
        <p lang={contentLanguage} className={leftAligned ? 'mt-2 text-sm leading-6 text-stone-600' : 'mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600'}>{subtitle}</p>
      </header>
      <div lang={contentLanguage} className="info-page-content space-y-7 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-5 text-sm leading-7 text-stone-700 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-8">
        {children}
      </div>
    </div>
  </div>
  );
};
