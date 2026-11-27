import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TOOLS, type ToolItem } from '../../config/tools';
import { clearMyTools, useMyTools } from '../../lib/myTools';
import { HomeToolCard } from './HomeVariantTools';

const BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));
const pick = (ids: string[]) => ids.map((id) => BY_ID.get(id)).filter((tool): tool is ToolItem => Boolean(tool));

/** Pinned tools and the ones opened lately, from this browser's own storage. Shows nothing for a first-time visitor. */
export const HomeMyTools: React.FC = () => {
  const { t } = useTranslation();
  const { pinned, recent } = useMyTools();
  const pinnedTools = useMemo(() => pick(pinned), [pinned]);
  const recentTools = useMemo(() => pick(recent.filter((id) => !pinned.includes(id))).slice(0, 6), [recent, pinned]);
  if (pinnedTools.length === 0 && recentTools.length === 0) return null;
  const title = t('myTools.title', { defaultValue: 'Your recently used tools' });
  return (
    <section aria-label={title} className="rounded-2xl border border-orange-200 bg-[var(--theme-surface)] p-3 sm:p-4">
      <header className="mb-3 flex items-start gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-800"><Star className="h-4 w-4" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold tracking-tight text-stone-900">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-stone-600">{t('myTools.note', { defaultValue: 'Saved only in this browser. Clear removes the list.' })}</p>
        </span>
        <button type="button" onClick={clearMyTools} className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-200 hover:text-stone-900">{t('myTools.clear', { defaultValue: 'Clear' })}</button>
      </header>
      {pinnedTools.length > 0 && (
        <div className="mb-3 last:mb-0">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('myTools.pinnedHeading', { defaultValue: 'Pinned' })}</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">{pinnedTools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
        </div>
      )}
      {recentTools.length > 0 && (
        <div className="mb-3 last:mb-0">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('myTools.recentHeading', { defaultValue: 'Recently used' })}</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">{recentTools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
        </div>
      )}
    </section>
  );
};
