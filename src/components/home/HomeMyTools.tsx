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
  return (
    <section aria-label={t('myTools.title', { defaultValue: 'Your tools' })} className="space-y-3 rounded-2xl border border-orange-200/70 bg-white/70 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-stone-900 sm:text-xl"><Star className="h-4 w-4 fill-orange-500 text-orange-600" aria-hidden="true" />{t('myTools.title', { defaultValue: 'Your tools' })}</h2>
        <button type="button" onClick={clearMyTools} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800">{t('myTools.clear', { defaultValue: 'Clear' })}</button>
      </div>
      {pinnedTools.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('myTools.pinnedHeading', { defaultValue: 'Pinned' })}</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">{pinnedTools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
        </div>
      )}
      {recentTools.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('myTools.recentHeading', { defaultValue: 'Recently used' })}</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">{recentTools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
        </div>
      )}
      <p className="text-[10px] text-stone-500">{t('myTools.note', { defaultValue: 'Saved only in this browser. Clear removes the list.' })}</p>
    </section>
  );
};
