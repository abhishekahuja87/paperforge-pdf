import React from 'react';
import { Search, ShieldCheck, Sparkles, FileImage, FileText, Code2, Presentation, ReceiptText } from 'lucide-react';

interface HomeTopBannerProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchField: React.FC<{
  query: string;
  onQueryChange: (query: string) => void;
  dark?: boolean;
}> = ({ query, onQueryChange, dark = false }) => (
  <label className={`relative block ${dark ? 'text-slate-800' : 'text-slate-700'}`}>
    <span className="sr-only">Search all utilities</span>
    <Search className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? 'text-slate-400' : 'text-slate-400'}`} aria-hidden="true" />
    <input
      type="search"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder="What do you need to do?"
      className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${dark
        ? 'border border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
        : 'border border-slate-200 bg-white shadow-sm focus:border-indigo-400 focus:ring-indigo-100'}`}
    />
  </label>
);

export const HomeTopBanner: React.FC<HomeTopBannerProps> = ({
  query,
  onQueryChange,
}) => {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-3" aria-label="MyDailyUtils tools and search">
      <div className="grid gap-4 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 text-white shadow-lg sm:grid-cols-[1.05fr_0.95fr] sm:items-center sm:px-6 sm:py-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            MyDailyUtils
          </p>
          <h1 className="mt-1.5 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
            Files stay local.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300">
              Processed in your browser.
            </span>
          </h1>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-300">
            Free PDF, image, data, and display tools—with file processing done right in your browser.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-medium text-slate-300">
            <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3 text-indigo-300" aria-hidden="true" /> PDF</span>
            <span className="inline-flex items-center gap-1"><FileImage className="h-3 w-3 text-emerald-300" aria-hidden="true" /> Image</span>
            <span className="inline-flex items-center gap-1"><Code2 className="h-3 w-3 text-amber-300" aria-hidden="true" /> Data</span>
            <span className="inline-flex items-center gap-1"><Presentation className="h-3 w-3 text-violet-300" aria-hidden="true" /> Display</span>
            <span className="inline-flex items-center gap-1"><ReceiptText className="h-3 w-3 text-rose-300" aria-hidden="true" /> Business</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 block text-[10px] font-semibold text-slate-200">
            Find a tool by name or task
          </p>
          <SearchField query={query} onQueryChange={onQueryChange} dark />
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
            <p className="text-[10px] leading-relaxed text-emerald-100">
              <strong className="font-bold text-white">File processing in your browser.</strong> Selected files aren’t uploaded to MyDailyUtils for processing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
