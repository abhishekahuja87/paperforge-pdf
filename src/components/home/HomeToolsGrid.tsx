import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ToolCategory } from '../../config/tools';
import {
  HOME_CATEGORY_ORDER,
  getFeaturedTools,
  getHomeTools,
} from '../../lib/homePageVariants';
import { ToolIcon } from '../common/ToolIcon';
import { HomeCategoryHeading, HomeToolCard } from './HomeVariantTools';

interface HomeToolsGridProps {
  query: string;
}

export const HomeToolsGrid: React.FC<HomeToolsGridProps> = ({ query }) => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState<Partial<Record<ToolCategory, boolean>>>({});
  const isSearching = query.trim().length > 0;

  const featured = useMemo(() => getFeaturedTools(query, i18n.language), [query, i18n.language]);
  const toolsByCategory = useMemo(() => Object.fromEntries(
    HOME_CATEGORY_ORDER.map((category) => [category, getHomeTools(query, category, i18n.language)]),
  ) as Record<ToolCategory, ReturnType<typeof getHomeTools>>, [query, i18n.language]);
  const visibleCategories = HOME_CATEGORY_ORDER.filter((category) => toolsByCategory[category].length > 0);
  const allExpanded = visibleCategories.every((category) => expanded[category] === true);

  if (featured.length === 0 && visibleCategories.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 pb-8" aria-label={t('allTools')}>
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          {t('noResults', { query })}
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-8">
      {featured.length > 0 && (
        <section aria-label={t('featured')} className="space-y-3">
          <h2 className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">{t('featured')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map(({ tool, info }) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="group flex flex-col rounded-2xl border border-orange-200 bg-gradient-to-br from-white to-orange-50/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-800 transition group-hover:bg-orange-600 group-hover:text-white">
                    <ToolIcon name={tool.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-700">{info.useCase}</p>
                    <h3 className="text-lg font-extrabold leading-tight text-stone-900">{info.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">{info.description}</p>
                <ul className="mb-4 mt-3 flex flex-wrap gap-1.5">
                  {info.highlights.map((highlight) => (
                    <li key={highlight} className="rounded-md bg-orange-100/70 px-2 py-0.5 text-[11px] font-semibold text-orange-900">
                      {highlight}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto flex items-center justify-between rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 transition group-hover:bg-orange-100 group-hover:text-orange-800">
                  <span>{t('openTool', { tool: info.title })}</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {visibleCategories.length > 0 && (
        <section aria-label={t('moreTools')} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">{t('moreTools')}</h2>
            {!isSearching && (
              <button
                type="button"
                aria-expanded={allExpanded}
                onClick={() => setExpanded(Object.fromEntries(visibleCategories.map((category) => [category, !allExpanded])))}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                {allExpanded ? t('collapseAll') : t('expandAll')}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {visibleCategories.map((category) => {
              const tools = toolsByCategory[category];
              const isOpen = isSearching || expanded[category] === true;
              const panelId = `home-tools-${category}`;
              return (
                <section key={category} className="rounded-2xl border border-stone-200 bg-[var(--theme-surface)]">
                  {isSearching ? (
                    <div className="p-3 pb-0 sm:p-4 sm:pb-0 [&>header]:mb-3">
                      <HomeCategoryHeading category={category} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setExpanded((current) => ({ ...current, [category]: !current[category] }))}
                      className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-orange-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:p-4 [&>header]:mb-0 [&>header]:min-w-0 [&>header]:flex-1"
                    >
                      <HomeCategoryHeading category={category} />
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-orange-700 group-hover:text-orange-900">
                        {isOpen ? t('hideTools') : t('showTools', { count: tools.length })}
                        <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </span>
                    </button>
                  )}
                  {isOpen && (
                    <div id={panelId} className="grid gap-2 p-3 pt-0 sm:grid-cols-2 sm:p-4 sm:pt-0 lg:grid-cols-3">
                      {tools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
