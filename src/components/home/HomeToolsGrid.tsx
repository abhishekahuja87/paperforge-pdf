import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COLLECTION_PREVIEW } from '../../config/homeSections';
import { getCollections, getMostUsedTools, getNewTools, getSearchResults, getWorkspaceTools } from '../../lib/homePageVariants';
import { getToolCopy } from '../../lib/localizedTool';
import { HomeCollectionHeading, HomePopularTile, HomeToolCard, HomeWorkspaceCard } from './HomeVariantTools';

interface HomeToolsGridProps {
  query: string;
}

const sectionTitle = 'text-lg font-black tracking-tight text-stone-900 sm:text-xl';

export const HomeToolsGrid: React.FC<HomeToolsGridProps> = ({ query }) => {
  const { t, i18n } = useTranslation();
  const isSearching = query.trim().length > 0;

  const mostUsed = useMemo(() => getMostUsedTools(), []);
  const newTools = useMemo(() => getNewTools(), []);
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
      <nav aria-label={t('homeSections.jumpTo')} className="-mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible">
        {collections.map((group) => (
          <a key={group.id} href={`#topic-${group.id}`} className="shrink-0 whitespace-nowrap rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-orange-300 hover:text-orange-800">
            {t(`homeCollections.${group.id}.name`)}
          </a>
        ))}
      </nav>

      <section aria-label={t('mostUsed')} className="space-y-3">
        <h2 className={sectionTitle}>{t('mostUsed')}</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {mostUsed.map((tool) => <HomePopularTile key={tool.id} tool={tool} />)}
        </div>
      </section>

      <section aria-label={t('homeSections.newTools')} className="space-y-3">
        <h2 className={sectionTitle}>{t('homeSections.newTools')}</h2>
        <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {newTools.map((tool) => (
            <div key={tool.id} className="w-40 shrink-0 snap-start sm:w-auto"><HomePopularTile tool={tool} isNew /></div>
          ))}
        </div>
      </section>

      <section aria-label={t('workspaces')} className="space-y-2.5">
        <h2 className={sectionTitle}>{t('workspaces')}</h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {workspaces.map(({ tool, info }) => <HomeWorkspaceCard key={tool.id} tool={tool} info={info} />)}
        </div>
      </section>

      <section aria-label={t('moreTools')} className="space-y-3">
        <h2 className={sectionTitle}>{t('moreTools')}</h2>
        <div className="space-y-3">
          {collections.map((group) => {
            const shown = group.tools.slice(0, COLLECTION_PREVIEW);
            const folded = group.tools.slice(COLLECTION_PREVIEW);
            return (
              <section key={group.id} id={`topic-${group.id}`} className="scroll-mt-20 rounded-2xl border border-stone-200 bg-[var(--theme-surface)] p-3 sm:p-4">
                <HomeCollectionHeading collection={group} count={group.tools.length + group.presets.length} />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}
                </div>
                {folded.length > 0 && (
                  <details className="group mt-2">
                    <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-orange-300 hover:text-orange-800 [&::-webkit-details-marker]:hidden">
                      {t('homeSections.showMore', { count: folded.length })}
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {folded.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}
                    </div>
                  </details>
                )}
                {group.presets.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-500">{t('homeSections.presets')}</span>
                    {group.presets.map(({ tool, kb }) => (
                      <Link key={tool.id} to={tool.path} aria-label={getToolCopy(tool, i18n.language).title} className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:border-orange-300 hover:text-orange-800">
                        {kb} KB
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
};
