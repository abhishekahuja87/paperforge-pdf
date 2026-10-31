import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Shield, Cpu, Lock } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../config/tools';
import type { ToolCategory } from '../config/tools';
import { ToolIcon } from '../components/common/ToolIcon';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(query));

      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 border-b border-slate-200/70 pt-10 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>100% Client-Side In-Browser</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Local-First PDF & Media Suite
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Process, convert, secure, and inspect files strictly in your browser memory. Zero cloud latency, zero uploads.
          </p>

          {/* Compact Search Bar */}
          <div className="pt-2 max-w-md mx-auto">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (merge, unlock, flatten, images)..."
                className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Tools Container */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Category Filter Badges */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All ({TOOLS.length})
          </button>
          {(Object.keys(CATEGORIES) as ToolCategory[]).map((catKey) => {
            const cat = CATEGORIES[catKey];
            const count = TOOLS.filter((t) => t.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === catKey
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Compact 4-Column Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredTools.map((tool) => {
              const cardInner = (
                <div className="flex flex-col h-full justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        tool.isAvailable
                          ? 'bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <ToolIcon name={tool.icon} className="w-4 h-4" />
                    </div>
                    {tool.isPopularInternet && (
                      <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                        Popular
                      </span>
                    )}
                    {!tool.isAvailable && (
                      <span className="text-[9px] font-medium tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                        Soon
                      </span>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`font-semibold text-xs sm:text-sm leading-tight transition-colors ${
                        tool.isAvailable
                          ? 'text-slate-800 group-hover:text-indigo-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-snug mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>
              );

              return tool.isAvailable ? (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="group p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
                >
                  {cardInner}
                </Link>
              ) : (
                <div
                  key={tool.id}
                  className="p-3.5 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 opacity-60 cursor-not-allowed flex flex-col justify-between"
                >
                  {cardInner}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 space-y-1">
            <p className="text-xs font-semibold text-slate-700">No tools matched "{searchQuery}"</p>
            <p className="text-[11px] text-slate-400">Try searching for keywords like merge, unlock, flatten, images.</p>
          </div>
        )}

        {/* Local Security Badges */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-6 border-t border-slate-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-slate-200/80">
            <div className="p-2 rounded bg-emerald-50 text-emerald-600 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">100% Client-Side</h4>
              <p className="text-[11px] text-slate-500">Processed in RAM. Zero files sent to any server.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-slate-200/80">
            <div className="p-2 rounded bg-indigo-50 text-indigo-600 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Zero Server Latency</h4>
              <p className="text-[11px] text-slate-500">No queues or caps. Handled directly by local CPU.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-slate-200/80">
            <div className="p-2 rounded bg-amber-50 text-amber-600 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Private by Design</h4>
              <p className="text-[11px] text-slate-500">Safe for private documents and legal agreements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;