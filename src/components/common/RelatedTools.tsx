import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TOOLS, type ToolItem } from '../../config/tools';
import { relatedToolIds } from '../../config/related';
import { HomeToolCard } from '../home/HomeVariantTools';

const BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

/** A short "what people open next" row under a tool, so a visitor can carry on without going back to the home page. */
export const RelatedTools: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation();
  const tools = useMemo(() => relatedToolIds(id, (other) => BY_ID.get(other)?.isAvailable === true).map((other) => BY_ID.get(other)).filter((tool): tool is ToolItem => Boolean(tool)), [id]);
  const studio = BY_ID.get('master-document-studio');
  const offerStudio = Boolean(studio?.isAvailable) && BY_ID.get(id)?.category === 'pdf' && id !== 'master-document-studio';
  if (tools.length === 0 && !offerStudio) return null;
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
          {offerStudio && studio && (
            <Link to={studio.path} className="mt-3 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-xs leading-relaxed text-stone-700 transition hover:border-orange-300">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" aria-hidden="true" />
              <span><strong className="block text-sm text-stone-900">{t('relatedStudioTitle', { defaultValue: 'Want to mix and match several PDF steps?' })}</strong>{t('relatedStudioText', { defaultValue: 'Use {{name}} to bring PDFs, Word files, images and your own pages together in one workspace and export a single PDF.', name: studio.title })}</span>
            </Link>
          )}
        </details>
      </section>
    </div>
  );
};
