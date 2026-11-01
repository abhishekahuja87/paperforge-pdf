import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Layers, Image as ImageIcon, Code2, Type, ArrowRight, ShieldCheck } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../config/tools';
import type { ToolCategory } from '../config/tools';
import { ToolIcon } from '../components/common/ToolIcon';
import { UnifiedHero } from '../components/common/UnifiedHero';

export const HomePage: React.FC = () => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ToolCategory | 'all'>('all');

  const tools = useMemo(() => {
    return TOOLS.filter((t) => {
      const query = q.toLowerCase().trim();
      const matchQ = !query
        || t.title.toLowerCase().includes(query)
        || t.description.toLowerCase().includes(query)
        || t.keywords.some((keyword) => keyword.toLowerCase().includes(query));
      const matchC = cat === 'all' || t.category === cat;
      return matchQ && matchC;
    });
  }, [q, cat]);
  const masterStudio = tools.find((tool) => tool.id === 'master-document-studio');
  const showMasterStudio = Boolean(masterStudio?.isAvailable);
  const utilityTools = tools.filter((tool) => tool.id !== 'master-document-studio');

  const icons: Record<ToolCategory, React.ReactNode> = {
    pdf: <Layers className="w-3.5 h-3.5 text-indigo-600" />,
    media: <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />,
    dev: <Code2 className="w-3.5 h-3.5 text-amber-600" />,
    text: <Type className="w-3.5 h-3.5 text-sky-600" />,
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-3"><UnifiedHero /></div>

      <div className="max-w-6xl mx-auto px-4 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools..." className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button onClick={() => setCat('all')} className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap ${cat === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>All ({TOOLS.length})</button>
            {(Object.keys(CATEGORIES) as ToolCategory[]).map((k) => (
              <button key={k} onClick={() => setCat(k)} className={`inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap ${cat === k ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {icons[k]}<span>{CATEGORIES[k].name}</span>
              </button>
            ))}
          </div>
        </div>

        {tools.length > 0 ? (
          <div className="space-y-6">
            {(Object.keys(CATEGORIES) as ToolCategory[]).map((k) => {
              const list = utilityTools.filter((t) => t.category === k);
              const includeStudio = k === 'pdf' && showMasterStudio && masterStudio;
              if (list.length === 0 && !includeStudio) return null;
              return (
                <div key={k} className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-lg bg-indigo-50 border border-indigo-100">{icons[k]}</div>
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900">{CATEGORIES[k].name}</h2>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{list.length + (includeStudio ? 1 : 0)} {list.length + (includeStudio ? 1 : 0) === 1 ? 'tool' : 'tools'}</span>
                  </div>

                  <div className="grid auto-rows-[minmax(92px,auto)] grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {includeStudio && (
                      <Link
                        to={masterStudio.path}
                        aria-label="Master Document Studio: assemble, edit, and export a complete PDF"
                        className="group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg sm:col-span-2 sm:row-span-2 sm:min-h-0 sm:p-5"
                      >
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-200/50 blur-2xl transition group-hover:bg-indigo-300/50" />
                        <div className="relative">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-indigo-700">
                              <Layers className="h-3 w-3" /> All-in-one PDF workspace
                            </span>
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Featured</span>
                          </div>
                          <h3 className="mt-4 text-lg font-extrabold leading-tight text-slate-900 group-hover:text-indigo-700 sm:text-xl">
                            Master Document Studio
                          </h3>
                          <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                            Select pages from PDFs, Word files, and images—or add custom pages and templates. Reorder, edit, add linked contents, and export one finished PDF.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-semibold text-indigo-800">
                            {['Page selection', 'Editing', 'Linked contents', 'PDF settings'].map((feature) => (
                              <span key={feature} className="rounded-md border border-indigo-100 bg-white/80 px-2 py-1">{feature}</span>
                            ))}
                          </div>
                        </div>
                        <div className="relative mt-4 flex items-center justify-between border-t border-indigo-100 pt-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 sm:text-xs">
                            Explore the Studio <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700">
                            <ShieldCheck className="h-3 w-3" /> In-browser
                          </span>
                        </div>
                      </Link>
                    )}
                    {list.map((t) => (
                      <Link
                        key={t.id}
                        to={t.isAvailable ? t.path : '#'}
                        onClick={(e) => { if (!t.isAvailable) e.preventDefault(); }}
                        className={`group p-2.5 bg-white rounded-xl border border-slate-200 transition-all flex flex-col justify-between ${t.isAvailable ? 'hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5' : 'opacity-50 bg-slate-50 cursor-not-allowed border-dashed'}`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex min-w-0 items-center space-x-1.5">
                              <div className="p-1 rounded-lg bg-slate-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                                <ToolIcon name={t.icon} className="w-3 h-3" />
                              </div>
                              <h3 className="font-bold text-[11px] text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{t.title}</h3>
                            </div>
                            {t.isPopularInternet && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700">Popular</span>}
                            {!t.isAvailable && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">Soon</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 pl-0.5">{t.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !showMasterStudio ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200"><p className="text-xs font-bold text-slate-700">No tools matched "{q}"</p></div>
        ) : null}
      </div>
    </div>
  );
};
export default HomePage;
