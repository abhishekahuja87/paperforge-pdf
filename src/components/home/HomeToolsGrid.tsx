import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HOME_CATEGORY_ORDER,
  getMoreTools,
  getPopularTools,
  getSearchResults,
  getWorkspaceTools,
} from '../../lib/homePageVariants';
import { HomeCategoryHeading, HomePopularTile, HomeToolCard, HomeWorkspaceCard } from './HomeVariantTools';

interface HomeToolsGridProps {
  query: string;
}

export const HomeToolsGrid: React.FC<HomeToolsGridProps> = ({ query }) => {
  const { t, i18n } = useTranslation();
  const isSearching = query.trim().length > 0;

  const popular = useMemo(() => getPopularTools(), []);
  const workspaces = useMemo(() => getWorkspaceTools(i18n.language), [i18n.language]);
  const moreGroups = useMemo(() => HOME_CATEGORY_ORDER
    .map((category) => ({ category, tools: getMoreTools(category) }))
    .filter((group) => group.tools.length > 0), []);
  const results = useMemo(
    () => (isSearching ? getSearchResults(query, i18n.language) : []),
    [isSearching, query, i18n.language],
  );

  if (isSearching) {
    return (
      <section className="mx-auto max-w-6xl px-4 pb-8" aria-label={t('searchResults')}>
        {results.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
            {t('noResults', { query })}
          </p>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">{t('searchResults')}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((tool) => <HomeToolCard key={tool.id} tool={tool} />)}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-8">
      <section aria-label={t('mostUsed')} className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">{t('mostUsed')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {popular.map((tool) => <HomePopularTile key={tool.id} tool={tool} />)}
        </div>
      </section>

      <section aria-label={t('workspaces')} className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">{t('workspaces')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workspaces.map(({ tool, info }) => <HomeWorkspaceCard key={tool.id} tool={tool} info={info} />)}
        </div>
      </section>

      <section aria-label={t('moreTools')} className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">{t('moreTools')}</h2>
        <div className="space-y-3">
          {moreGroups.map(({ category, tools }) => (
            <section key={category} className="rounded-2xl border border-stone-200 bg-[var(--theme-surface)] p-3 sm:p-4">
              <HomeCategoryHeading category={category} />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
};
