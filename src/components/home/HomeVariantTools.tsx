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
  isNew?: boolean;
  /** Icon colours (resting and hover) from the topic the tile sits in. Without it the tile uses the orange brand colour. */
  tone?: { box: string; hover: string };
}> = ({ tool, compact = false, dark = false, isNew = false, tone }) => {
  const { t, i18n } = useTranslation();
  const copy = getToolCopy(tool, i18n.language);
  return (
  <Link
    to={tool.path}
    title={copy.description}
    className={`group flex min-w-0 items-center gap-2 border transition duration-200 hover:border-orange-300 hover:shadow-sm ${compact ? 'min-h-9 rounded-lg px-1.5 py-1' : 'min-h-[68px] rounded-xl px-3 py-2.5 hover:-translate-y-0.5 hover:shadow-md'} ${dark ? 'border-white/10 bg-white/[0.06] text-white hover:border-orange-300/50 hover:bg-white/10' : 'border-stone-200/80 bg-white/90'}`}
  >
    <span className={`flex shrink-0 items-center justify-center transition ${compact ? 'h-6 w-6 rounded-md' : 'h-8 w-8 rounded-lg'} ${dark ? 'bg-white/10 text-orange-200 group-hover:bg-orange-500 group-hover:text-white' : tone ? `${tone.box} ${tone.hover}` : 'bg-orange-50 text-orange-800 group-hover:bg-orange-600 group-hover:text-white'}`}>
      <ToolIcon name={tool.icon} className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </span>
    <span lang={copy.language} className="min-w-0 flex-1">
      <span className={`block truncate font-bold ${compact ? 'text-[12px]' : 'text-xs'} ${dark ? 'text-white group-hover:text-orange-200' : 'text-stone-800 group-hover:text-orange-800'}`}>{homeTitle(copy.title)}</span>
      {!compact && <span className={`mt-0.5 line-clamp-2 block text-[10px] leading-snug ${dark ? 'text-slate-400' : 'text-stone-500'}`}>{copy.description}</span>}
    </span>
    {isNew && <span className="shrink-0 rounded-full bg-orange-600 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">{t('homeSections.newBadge')}</span>}
    {!compact && <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5 ${dark ? 'text-slate-500 group-hover:text-orange-200' : 'text-stone-300 group-hover:text-orange-700'}`} />}
  </Link>
  );
};

/** Vertical tile used in the "Most used" row: icon, title and a short description. */
export const HomePopularTile: React.FC<{ tool: ToolItem }> = ({ tool }) => {
  const { i18n } = useTranslation();
  const copy = getToolCopy(tool, i18n.language);
  return (
    <Link
      to={tool.path}
      className="group flex min-w-0 flex-row items-center gap-3 rounded-xl border border-stone-200/80 bg-white/90 p-3 transition sm:flex-col sm:items-start sm:gap-1.5 duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-800 transition group-hover:bg-orange-600 group-hover:text-white">
        <ToolIcon name={tool.icon} className="h-4 w-4" />
      </span>
      <div lang={copy.language} className="min-w-0">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-stone-900 group-hover:text-orange-800">{homeTitle(copy.title)}</h3>
        <span className="mt-1 line-clamp-2 block text-[11px] leading-snug text-stone-500">{copy.description}</span>
      </div>
    </Link>
  );
};

/** Card for the "Workspaces" row: name, what it is for, and a description that covers what the tool can do. */
export const HomeWorkspaceCard: React.FC<{ tool: ToolItem; info: FeaturedTool }> = ({ tool, info }) => (
  <Link
    to={tool.path}
    className="group flex min-w-0 flex-col gap-2 rounded-2xl border border-orange-200 bg-gradient-to-br from-white to-orange-50/70 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
  >
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-800 transition group-hover:bg-orange-600 group-hover:text-white">
        <ToolIcon name={tool.icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-orange-700">{info.useCase}</p>
        <h3 className="text-sm font-extrabold leading-tight text-stone-900">{info.title}</h3>
      </div>
    </div>
    <p className="text-xs leading-5 text-stone-600">{info.description}</p>
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
        <p className="mt-1 text-xs leading-5 text-stone-600">{t(`homeCollections.${collection.id}.description`)}</p>
      </span>
      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">{t('homeSections.toolCount', { count })}</span>
    </header>
  );
};
