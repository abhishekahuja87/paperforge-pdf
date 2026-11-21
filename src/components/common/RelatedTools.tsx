import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TOOLS, type ToolItem } from '../../config/tools';
import { relatedToolIds } from '../../config/related';
import { HomeToolCard } from '../home/HomeVariantTools';

const BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

/** A short "what people open next" row under a tool, so a visitor can carry on without going back to the home page. */
export const RelatedTools: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation();
  const tools = useMemo(() => relatedToolIds(id, (other) => BY_ID.get(other)?.isAvailable === true).map((other) => BY_ID.get(other)).filter((tool): tool is ToolItem => Boolean(tool)), [id]);
  if (tools.length === 0) return null;
  return (
    <section aria-label={t('relatedTools', { defaultValue: 'Related tools' })} className="mx-auto w-full max-w-4xl space-y-3 print:hidden">
      <h2 className="text-lg font-black tracking-tight text-stone-900">{t('relatedTools', { defaultValue: 'Related tools' })}</h2>
      <div className="grid gap-2 sm:grid-cols-2">{tools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
    </section>
  );
};
