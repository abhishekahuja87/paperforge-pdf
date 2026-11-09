import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getCollections, getMostUsedTools, getNewToolIds, getSearchResults, getWorkspaceTools } from '../../lib/homePageVariants';
import { HomeCollectionPanel } from './HomeCollectionPanel';
import { HomePopularTile, HomeToolCard, HomeWorkspaceCard } from './HomeVariantTools';

interface HomeToolsGridProps {
  query: string;
}

const sectionTitle = 'text-lg font-black tracking-tight text-stone-900 sm:text-xl';

export const HomeToolsGrid: React.FC<HomeToolsGridProps> = ({ query }) => {
  const { t, i18n } = useTranslation();
  const isSearching = query.trim().length > 0;

  const mostUsed = useMemo(() => getMostUsedTools(), []);
  const newIds = useMemo(() => getNewToolIds(), []);
  const workspaces = useMemo(() => getWorkspaceTools(i18n.language), [i18n.language]);
  const collections = useMemo(() => getCollections(), []);
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
            <h2 className={sectionTitle}>{t('searchResults')}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((tool) => <HomeToolCard key={tool.id} tool={tool} />)}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 pb-8">
      <nav aria-label={t('homeSections.jumpTo')} className="-mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:hidden">
        {collections.map((group) => (
          <a key={group.id} href={`#topic-${group.id}`} className="shrink-0 whitespace-nowrap rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-orange-300 hover:text-orange-800">
            {t(`homeCollections.${group.id}.name`)}
          </a>
        ))}
      </nav>

      <section aria-label={t('mostUsed')} className="space-y-3">
        <h2 className={sectionTitle}>{t('mostUsed')}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {mostUsed.map((tool) => <HomePopularTile key={tool.id} tool={tool} />)}
        </div>
      </section>

      <section aria-label={t('workspaces')} className="space-y-2.5">
        <h2 className={sectionTitle}>{t('workspaces')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workspaces.map(({ tool, info }) => <HomeWorkspaceCard key={tool.id} tool={tool} info={info} />)}
        </div>
      </section>

      <section aria-label={t('moreTools')} className="space-y-3">
        <h2 className={sectionTitle}>{t('moreTools')}</h2>
        <div className="space-y-3">
          {collections.map((group) => <HomeCollectionPanel key={group.id} collection={group} newIds={newIds} />)}
        </div>
      </section>
    </div>
  );
};
