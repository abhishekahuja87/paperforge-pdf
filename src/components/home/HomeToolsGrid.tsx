import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getCollections, getMostUsedTools, getNewToolIds, getSearchResults, getWorkspaceTools } from '../../lib/homePageVariants';
import { Link } from 'react-router-dom';
import { GUIDES } from '../../content/guides';
import { UPDATES, formatUpdateDate, isRecent } from '../../config/updates';
import { HomeCollectionPanel } from './HomeCollectionPanel';
import { HomePopularTile, HomeToolCard, HomeWorkspaceCard } from './HomeVariantTools';

interface HomeToolsGridProps {
  query: string;
}

const FEATURED_GUIDE_SLUGS = [
  'old-vs-new-tax-regime-fy-2026-27',
  'reduce-image-size-for-online-forms',
  'how-emi-works-and-how-to-reduce-interest',
  'how-to-check-a-tool-keeps-your-files-private',
];

const sectionTitle = 'text-lg font-black tracking-tight text-stone-900 sm:text-xl';

export const HomeToolsGrid: React.FC<HomeToolsGridProps> = ({ query }) => {
  const { t, i18n } = useTranslation();
  const isSearching = query.trim().length > 0;

  const mostUsed = useMemo(() => getMostUsedTools(), []);
  const newIds = useMemo(() => getNewToolIds(), []);
  const workspaces = useMemo(() => getWorkspaceTools(i18n.language), [i18n.language]);
  const collections = useMemo(() => getCollections(), []);
  const recentUpdates = useMemo(() => UPDATES.filter((update) => isRecent(update)).slice(0, 3), []);
  // A fixed, varied pick: money, files, study and everyday, so the home page shows range.
  const featuredGuides = useMemo(() => FEATURED_GUIDE_SLUGS.map((slug) => GUIDES.find((guide) => guide.slug === slug)).filter((guide): guide is (typeof GUIDES)[number] => Boolean(guide)), []);
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

      {recentUpdates.length > 0 && (
        <section aria-label={t('whatsNew')} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={sectionTitle}>{t('whatsNew')}</h2>
            <Link to="/whats-new" className="text-xs font-semibold text-orange-800 underline">{t('whatsNew')} &rarr;</Link>
          </div>
          <ul className="grid gap-2 sm:grid-cols-3">
            {recentUpdates.map((update) => (
              <li key={`${update.path}-${update.title}`}>
                <Link to={update.path} className="block h-full rounded-xl border border-stone-200 bg-white p-3 transition hover:border-orange-300">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700">{update.tool} &middot; {formatUpdateDate(update.date)}</span>
                  <span className="mt-1 block text-sm font-semibold text-stone-900">{update.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label={t('workspaces')} className="space-y-2.5">
        <h2 className={sectionTitle}>{t('workspaces')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workspaces.map(({ tool, info }) => <HomeWorkspaceCard key={tool.id} tool={tool} info={info} />)}
        </div>
      </section>

      <section aria-label="Guides" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={sectionTitle}>Guides</h2>
          <Link to="/guides" className="text-xs font-semibold text-orange-800 underline">All {GUIDES.length} guides &rarr;</Link>
        </div>
        <ul lang="en" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {featuredGuides.map((guide) => (
            <li key={guide.slug}>
              <Link to={`/guides/${guide.slug}`} className="block h-full rounded-xl border border-stone-200 bg-white p-3 transition hover:border-orange-300">
                <span className="block text-sm font-semibold text-stone-900">{guide.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-stone-600">{guide.description}</span>
              </Link>
            </li>
          ))}
        </ul>
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
