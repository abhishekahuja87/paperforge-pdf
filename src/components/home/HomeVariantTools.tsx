import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES, TOOLS, type ToolCategory, type ToolItem } from '../../config/tools';
import { HOME_CATEGORY_STYLES } from '../../lib/homePageVariants';
import { ToolIcon } from '../common/ToolIcon';

export const HomeToolCard: React.FC<{
  tool: ToolItem;
  compact?: boolean;
  dark?: boolean;
}> = ({ tool, compact = false, dark = false }) => (
  <Link
    to={tool.path}
    className={`group flex min-w-0 items-center gap-2 rounded-xl border transition hover:-translate-y-0.5 hover:shadow-md ${dark ? 'border-white/10 bg-white/[0.06] text-white hover:border-indigo-300/50 hover:bg-white/10' : 'border-slate-200 bg-white hover:border-indigo-300'} ${compact ? 'min-h-11 px-2 py-1.5' : 'min-h-[68px] px-3 py-2.5'}`}
  >
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${dark ? 'bg-white/10 text-indigo-200 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-slate-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'}`}>
      <ToolIcon name={tool.icon} className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className={`block truncate text-xs font-bold ${dark ? 'text-white group-hover:text-indigo-200' : 'text-slate-800 group-hover:text-indigo-700'}`}>{tool.title}</span>
      {!compact && <span className={`mt-0.5 line-clamp-2 block text-[10px] leading-snug ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{tool.description}</span>}
    </span>
    <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5 ${dark ? 'text-slate-500 group-hover:text-indigo-200' : 'text-slate-300 group-hover:text-indigo-600'}`} />
  </Link>
);

export const HomeStudioCard: React.FC<{ horizontal?: boolean }> = ({ horizontal = false }) => {
  const studio = TOOLS.find((tool) => tool.id === 'master-document-studio');
  if (!studio?.isAvailable) return null;

  return (
    <Link
      to={studio.path}
      className={`group relative flex overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg ${horizontal ? 'items-center gap-5 p-4 sm:p-5' : 'min-h-44 flex-col justify-between p-4 sm:p-5'}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-200/50 blur-2xl transition group-hover:bg-indigo-300/60" />
      <div className="relative min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-indigo-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-indigo-700">All-in-one PDF workspace</span>
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Featured</span>
        </div>
        <h2 className="mt-3 text-base font-extrabold leading-tight text-slate-900 group-hover:text-indigo-700 sm:text-lg">{studio.title}</h2>
        <p className="mt-1.5 max-w-xl text-[10px] leading-relaxed text-slate-600 sm:text-[11px]">
          Select PDF, Word, image, or custom pages. Reorder and edit them, add linked contents, then export a finished PDF—all in one workspace.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-semibold text-indigo-800">
          {['Choose pages', 'Edit & reorder', 'Create contents', 'Export PDF'].map((feature) => (
            <span key={feature} className="rounded-md border border-indigo-100 bg-white/80 px-2 py-1">{feature}</span>
          ))}
        </div>
      </div>
      <div className={`relative mt-3 flex items-center justify-between border-t border-indigo-100 pt-2.5 ${horizontal ? 'w-full shrink-0 sm:mt-0 sm:w-auto sm:min-w-36 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0' : ''}`}>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700">Open Studio <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" /></span>
        <span className="text-[9px] font-medium text-emerald-700">Runs in your browser</span>
      </div>
    </Link>
  );
};

export const HomeCategoryHeading: React.FC<{ category: ToolCategory; count: number }> = ({ category, count }) => {
  const iconName = category === 'media' ? 'image' : category === 'dev' ? 'file-code' : category === 'text' ? 'type' : category === 'display' ? 'presentation' : 'layers';
  return (
    <header className="mb-3 flex items-start gap-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${HOME_CATEGORY_STYLES[category].icon}`}>
        <ToolIcon name={iconName} className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <h2 className="text-xs font-extrabold text-slate-900">{CATEGORIES[category].name}</h2>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{CATEGORIES[category].description}</p>
      </span>
      <span className="ml-auto shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-slate-500">{count}</span>
    </header>
  );
};
