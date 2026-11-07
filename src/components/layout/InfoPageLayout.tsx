import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMetadata } from '../common/PageMetadata';
import { useTranslation } from 'react-i18next';

interface InfoPageLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  children: React.ReactNode;
  contentLanguage?: string;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, subtitle, description, children, contentLanguage = 'en' }) => {
  const { t } = useTranslation();
  return (
  <div className="min-h-full bg-[var(--theme-background)] px-4 py-8 sm:py-10">
    <PageMetadata title={title} description={description} />
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="text-center">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition hover:text-orange-800">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('allTools')}
        </Link>
        <h1 lang={contentLanguage} className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-stone-900 sm:text-4xl">{title}</h1>
        <p lang={contentLanguage} className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">{subtitle}</p>
      </header>
      <div lang={contentLanguage} className="info-page-content space-y-7 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-5 text-sm leading-7 text-stone-700 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-8">
        {children}
      </div>
    </div>
  </div>
  );
};
