import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck, ChevronDown } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { TOOLS, CATEGORIES, type ToolCategory } from '../../config/tools';
import { recordToolClick } from '../../lib/storage';

export const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTools = TOOLS.filter((t) => t.isAvailable);
  const categoryKeys = Object.keys(CATEGORIES) as ToolCategory[];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">
            {siteConfig.shortName}
          </span>
        </Link>

        <nav className="flex items-center space-x-5 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-indigo-600 transition text-xs font-semibold">
            All Tools
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-controls="explore-tools-menu"
              className="flex items-center space-x-1 hover:text-indigo-600 transition py-1 text-xs font-semibold"
            >
              <span>Explore Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div id="explore-tools-menu" className="absolute right-0 mt-2 max-h-[calc(100vh-5rem)] w-72 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                {categoryKeys.map((catKey) => {
                  const catTools = activeTools.filter((t) => t.category === catKey);
                  if (catTools.length === 0) return null;

                  return (
                    <div key={catKey} className="mb-2 last:mb-0">
                      <div className="sticky top-0 z-10 bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur">
                        {CATEGORIES[catKey].name}
                      </div>
                      <div className="space-y-0.5">
                        {catTools.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.path}
                            onClick={() => {
                              recordToolClick(tool.id);
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                          >
                            <span>{tool.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% In-Browser</span>
          </div>
        </nav>
      </div>
    </header>
  );
};