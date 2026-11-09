import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COLLECTION_PREVIEW } from '../../config/homeSections';
import { HOME_COLLECTION_HOVER, HOME_COLLECTION_STYLES, type HomeCollection } from '../../lib/homePageVariants';
import { getToolCopy } from '../../lib/localizedTool';
import { HomeCollectionHeading, HomeToolCard } from './HomeVariantTools';

/**
 * One topic: heading with a description, small tiles (one per row on a phone), and a Show more / Show fewer
 * button. On a phone only the first COLLECTION_PREVIEW tiles show until the button is pressed; from the small
 * breakpoint up every tile is always visible and the button is not shown. Folded tiles stay in the page (hidden,
 * not removed), and the button is below them, so opening and closing never moves it above the tiles.
 */
export const HomeCollectionPanel: React.FC<{ collection: HomeCollection; newIds: Set<string> }> = ({ collection, newIds }) => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const tone = { box: HOME_COLLECTION_STYLES[collection.id] ?? HOME_COLLECTION_STYLES.other, hover: HOME_COLLECTION_HOVER[collection.id] ?? HOME_COLLECTION_HOVER.other };
  const foldedCount = Math.max(0, collection.tools.length - COLLECTION_PREVIEW);

  return (
    <section id={`topic-${collection.id}`} className="scroll-mt-20 rounded-2xl border border-stone-200 bg-[var(--theme-surface)] p-3 sm:p-4">
      <HomeCollectionHeading collection={collection} count={collection.tools.length + collection.presets.length} />
      <div id={listId} className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {collection.tools.map((tool, index) => (
          <div key={tool.id} className={`min-w-0 ${index >= COLLECTION_PREVIEW && !expanded ? 'hidden sm:block' : ''}`}>
            <HomeToolCard tool={tool} compact isNew={newIds.has(tool.id)} tone={tone} />
          </div>
        ))}
      </div>
      {foldedCount > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 flex min-h-9 w-full sm:hidden items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-orange-300 hover:text-orange-800"
        >
          {expanded ? t('homeSections.showFewer') : t('homeSections.showMore', { count: foldedCount })}
          <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}
      {collection.presets.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-stone-500">{t('homeSections.presets')}</span>
          {collection.presets.map(({ tool, kb }) => (
            <Link key={tool.id} to={tool.path} aria-label={getToolCopy(tool, i18n.language).title} className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:border-orange-300 hover:text-orange-800">
              {kb} KB
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
