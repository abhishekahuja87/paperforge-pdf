import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { TOOLS, CATEGORIES, type ToolCategory } from '../../config/tools';
import { recordToolClick } from '../../lib/storage';
import { useTranslation } from 'react-i18next';
import { languages } from '../../i18n';
import { getToolCopy } from '../../lib/localizedTool';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  // Footer-only (advanced) pages stay out of this menu so it remains short; the footer lists every tool.
  const activeTools = TOOLS.filter((tool) => tool.isAvailable && tool.tier !== 'advanced');
  const categoryKeys = Object.keys(CATEGORIES) as ToolCategory[];

  return (
    <header className="sticky top-0 z-50 bg-[var(--theme-surface)]/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-orange-700 flex items-center justify-center text-white shadow-sm">
            <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-lg" />
          </div>
          <span className="hidden sm:inline font-bold text-lg tracking-tight text-stone-900">
            {siteConfig.shortName}
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 text-sm font-medium text-stone-600">
          <Link to="/" className="hidden sm:inline hover:text-orange-700 transition text-xs font-semibold">
            {t('allTools')}
          </Link>

          <div className="sm:relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-controls="explore-tools-menu"
              className="flex items-center space-x-1 hover:text-orange-700 transition py-1 text-xs font-semibold"
            >
              <span className="max-w-32 truncate sm:max-w-none">{t('exploreTools')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div id="explore-tools-menu" className="absolute inset-x-4 top-full z-50 max-h-[60vh] overflow-y-auto overscroll-contain rounded-xl border border-stone-200 bg-[var(--theme-surface)] p-2 shadow-xl sm:inset-x-auto sm:right-0 sm:mt-2 sm:max-h-[calc(100vh-5rem)] sm:w-72">
                {categoryKeys.map((catKey) => {
                  const catTools = activeTools.filter((t) => t.category === catKey);
                  if (catTools.length === 0) return null;

                  return (
                    <div key={catKey} className="mb-2 last:mb-0">
                      <div className="bg-[var(--theme-surface)]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 backdrop-blur sm:sticky sm:top-0 sm:z-10">
                        {t(`${catKey}.name`, { ns: 'categories' })}
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
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:bg-orange-50 hover:text-orange-700 transition"
                          >
                            <span lang={getToolCopy(tool, i18n.language).language}>{getToolCopy(tool, i18n.language).title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {languages.length > 1 && (
            <label>
              <span className="sr-only">{t('language')}</span>
              <select
                value={i18n.language}
                onChange={(event) => { void i18n.changeLanguage(event.target.value); }}
                className="max-w-24 rounded-lg border border-stone-200 bg-white px-1.5 py-1.5 text-xs font-semibold text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:max-w-none"
              >
                {languages.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
              </select>
            </label>
          )}
        </nav>
      </div>
      {i18n.language !== 'en' && (
        <p className="border-t border-orange-100 bg-orange-50 px-4 py-1 text-center text-xs text-orange-900">
          {t('languageNotice')}
        </p>
      )}
    </header>
  );
};