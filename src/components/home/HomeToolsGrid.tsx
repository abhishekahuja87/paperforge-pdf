import React, { useMemo } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES, type ToolCategory } from '../../config/tools';
import {
  HOME_CATEGORY_ORDER,
  HOME_CATEGORY_STYLES,
  getHomeTools,
  matchesStudioQuery,
} from '../../lib/homePageVariants';
import { HomeCategoryHeading, HomeToolCard } from './HomeVariantTools';

interface HomeToolsGridProps {
  query: string;
}

export const HomeToolsGrid: React.FC<HomeToolsGridProps> = ({ query }) => {
  const toolsByCategory = useMemo(() => Object.fromEntries(
    HOME_CATEGORY_ORDER.map((category) => [category, getHomeTools(query, category)]),
  ) as Record<ToolCategory, ReturnType<typeof getHomeTools>>, [query]);
  const showStudio = matchesStudioQuery(query);
  const hasResults = showStudio || HOME_CATEGORY_ORDER.some((category) => toolsByCategory[category].length > 0);

  return (
    <section className="mx-auto max-w-6xl space-y-4 px-4" aria-label="Available tools">
      {!hasResults ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No tools match “{query}”.
        </p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-12">
          {(showStudio || toolsByCategory.pdf.length > 0 || !query.trim()) && (
            <section className={`min-w-0 rounded-2xl border p-3 sm:p-4 lg:col-span-4 ${HOME_CATEGORY_STYLES.pdf.panel}`}>
              <HomeCategoryHeading category="pdf" count={toolsByCategory.pdf.length + (showStudio ? 1 : 0)} />
              <div className="space-y-2">
                {showStudio && (
                  <Link
                    to="/master-document-studio"
                    aria-label="Open Master Document Studio"
                    className="group flex min-h-24 items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-white to-violet-50 px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md sm:gap-4 sm:px-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white sm:h-12 sm:w-12">
                      <Layers className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold leading-tight text-slate-900 transition-colors group-hover:text-indigo-700 sm:text-base">Master Document Studio</span>
                      <span className="mt-1.5 block text-[10px] leading-relaxed text-slate-600 sm:text-[11px]">
                        Select, arrange, and edit pages from PDFs, Word documents, images, and custom pages—then export one finished PDF.
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400 transition group-hover:translate-x-1 group-hover:text-indigo-700" aria-hidden="true" />
                  </Link>
                )}
                {toolsByCategory.pdf.length > 0 && (
                  <div className="space-y-1.5">
                    {toolsByCategory.pdf.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:col-span-8 lg:auto-rows-fr">
            {HOME_CATEGORY_ORDER.filter((category) => category !== 'pdf')
              .filter((category) => !query.trim() || toolsByCategory[category].length > 0)
              .map((category) => (
                <section key={category} className={`flex min-w-0 flex-col rounded-2xl border p-3 sm:p-4 ${HOME_CATEGORY_STYLES[category].panel}`}>
                  <HomeCategoryHeading category={category} count={toolsByCategory[category].length} />
                  {toolsByCategory[category].length > 0 ? (
                    <div className="space-y-1.5">
                      {toolsByCategory[category].map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}
                    </div>
                  ) : (
                    <p className="mt-auto rounded-lg border border-white/80 bg-white/70 px-3 py-3 text-[10px] leading-relaxed text-slate-500">
                      More {CATEGORIES[category].name.toLowerCase()} tools are on the way.
                    </p>
                  )}
                </section>
              ))}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-400">
        {CATEGORIES.pdf.description} The highlighted Studio can handle many common page-assembly tasks in one place.
      </p>
    </section>
  );
};
