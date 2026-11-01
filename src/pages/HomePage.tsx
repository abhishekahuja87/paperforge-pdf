import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Layers, Image as ImageIcon, Code2, Type } from 'lucide-react';
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
      const matchQ = !query || t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);
      const matchC = cat === 'all' || t.category === cat;
      return matchQ && matchC;
    });
  }, [q, cat]);

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
              const list = tools.filter((t) => t.category === k);
              if (list.length === 0) return null;
              return (
                <div key={k} className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-lg bg-indigo-50 border border-indigo-100">{icons[k]}</div>
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900">{CATEGORIES[k].name}</h2>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{list.length} tools</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {list.map((t) => (
                      <Link
                        key={t.id}
                        to={t.isAvailable ? t.path : '#'}
                        onClick={(e) => { if (!t.isAvailable) e.preventDefault(); }}
                        className={`group p-3 bg-white rounded-xl border border-slate-200 transition-all flex flex-col justify-between ${t.isAvailable ? 'hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5' : 'opacity-50 bg-slate-50 cursor-not-allowed border-dashed'}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 rounded-lg bg-slate-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                                <ToolIcon name={t.icon} className="w-3.5 h-3.5" />
                              </div>
                              <h3 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{t.title}</h3>
                            </div>
                            {t.isPopularInternet && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700">Popular</span>}
                            {!t.isAvailable && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">Soon</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 pl-0.5">{t.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200"><p className="text-xs font-bold text-slate-700">No tools matched "{q}"</p></div>
        )}
      </div>
    </div>
  );
};
export default HomePage;
