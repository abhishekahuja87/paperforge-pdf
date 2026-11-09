import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ToolItem } from '../../config/tools';
import { HOME_COLLECTION_STYLES, homeTitle, type FeaturedTool, type HomeCollection } from '../../lib/homePageVariants';
import { ToolIcon } from '../common/ToolIcon';
import { useTranslation } from 'react-i18next';
import { getToolCopy } from '../../lib/localizedTool';

export const HomeToolCard: React.FC<{
  tool: ToolItem;
  compact?: boolean;
  dark?: boolean;
}> = ({ tool, compact = false, dark = false }) => {
  const { i18n } = useTranslation();
  const copy = getToolCopy(tool, i18n.language);
  return (
  <Link
    to={tool.path}
    className={`group flex min-w-0 items-center gap-2 rounded-xl border transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${dark ? 'border-white/10 bg-white/[0.06] text-white hover:border-orange-300/50 hover:bg-white/10' : 'border-stone-200/80 bg-white/90 hover:border-orange-300'} ${compact ? 'min-h-11 px-2 py-1.5' : 'min-h-[68px] px-3 py-2.5'}`}
  >
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${dark ? 'bg-white/10 text-orange-200 group-hover:bg-orange-500 group-hover:text-white' : 'bg-orange-50 text-orange-800 group-hover:bg-orange-600 group-hover:text-white'}`}>
      <ToolIcon name={tool.icon} className="h-4 w-4" />
    </span>
    <span lang={copy.language} className="min-w-0 flex-1">
      <span className={`block truncate text-xs font-bold ${dark ? 'text-white group-hover:text-orange-200' : 'text-stone-800 group-hover:text-orange-800'}`}>{homeTitle(copy.title)}</span>
      {!compact && <span className={`mt-0.5 line-clamp-2 block text-[10px] leading-snug ${dark ? 'text-slate-400' : 'text-stone-500'}`}>{copy.description}</span>}
    </span>
    <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5 ${dark ? 'text-slate-500 group-hover:text-orange-200' : 'text-stone-300 group-hover:text-orange-700'}`} />
  </Link>
  );
};

/** Vertical tile used in the "Most used" and "New tools" rows: icon, title and a short description. */
export const HomePopularTile: React.FC<{ tool: ToolItem; isNew?: boolean }> = ({ tool, isNew = false }) => {
  const { t, i18n } = useTranslation();
  const copy = getToolCopy(tool, i18n.language);
  return (
    <Link
      to={tool.path}
      className="group relative flex min-w-0 flex-col gap-1.5 rounded-xl border border-stone-200/80 bg-white/90 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
    >
      {isNew && <span className="absolute right-2 top-2 rounded-full bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">{t('homeSections.newBadge')}</span>}
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-800 transition group-hover:bg-orange-600 group-hover:text-white">
        <ToolIcon name={tool.icon} className="h-4 w-4" />
      </span>
      <div lang={copy.language} className="min-w-0">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-stone-900 group-hover:text-orange-800">{homeTitle(copy.title)}</h3>
        <span className="mt-1 hidden line-clamp-2 text-[11px] leading-snug text-stone-500 sm:block">{copy.description}</span>
      </div>
    </Link>
  );
};

/** Slim card for the "Workspaces" row: icon, name and one short label. The full description is the hover text. */
export const HomeWorkspaceCard: React.FC<{ tool: ToolItem; info: FeaturedTool }> = ({ tool, info }) => (
  <Link
    to={tool.path}
    title={info.description}
    className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2 transition hover:border-orange-400 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-800 transition group-hover:bg-orange-600 group-hover:text-white">
      <ToolIcon name={tool.icon} className="h-4 w-4" />
    </span>
    <span className="min-w-0">
      <span className="line-clamp-2 block text-xs font-extrabold leading-tight text-stone-900">{info.title}</span>
      <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-wide text-orange-700">{info.useCase}</span>
    </span>
  </Link>
);

/** Heading of one topic panel: icon, name, short description and tool count. */
export const HomeCollectionHeading: React.FC<{ collection: HomeCollection; count: number }> = ({ collection, count }) => {
  const { t } = useTranslation();
  return (
    <header className="mb-3 flex items-start gap-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${HOME_COLLECTION_STYLES[collection.id] ?? HOME_COLLECTION_STYLES.other}`}>
        <ToolIcon name={collection.icon} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold tracking-tight text-stone-900">{t(`homeCollections.${collection.id}.name`)}</h3>
        <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{t(`homeCollections.${collection.id}.description`)}</p>
      </span>
      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">{t('homeSections.toolCount', { count })}</span>
    </header>
  );
};
