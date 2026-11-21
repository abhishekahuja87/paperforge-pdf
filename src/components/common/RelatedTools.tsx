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
  const title = t('relatedTools', { defaultValue: 'Related tools' });
  return (
    <div className="mx-auto w-full max-w-3xl print:hidden">
      <section aria-label={title} className="rounded-xl border border-stone-200 bg-white">
        <details open className="group px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
            <span aria-hidden="true" className="text-lg leading-none text-orange-600 transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{tools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
        </details>
      </section>
    </div>
  );
};
