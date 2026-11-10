import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, TOOLS, type ToolCategory } from '../../config/tools';
import { getToolCopy } from '../../lib/localizedTool';
import { recordToolClick } from '../../lib/storage';

interface HeaderToolsMenuProps {
  onNavigate: () => void;
}

/**
 * The content of the "Explore tools" panel: a search box, then every category folded to one line.
 * Typing in the box replaces the categories with a flat list of matching tools.
 */
export const HeaderToolsMenu: React.FC<HeaderToolsMenuProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<ToolCategory | null>(null);

  const available = useMemo(() => TOOLS.filter((tool) => tool.isAvailable), []);
  const categoryKeys = Object.keys(CATEGORIES) as ToolCategory[];

  const entries = useMemo(
    () => available.map((tool) => ({ tool, copy: getToolCopy(tool, i18n.language) })),
    [available, i18n.language],
  );

  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return [];
    const words = needle.split(/\s+/);
    return entries.filter(({ tool, copy }) => {
      const haystack = `${copy.title} ${copy.description ?? ''} ${tool.id.replace(/-/g, ' ')}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [entries, needle]);

  const choose = (toolId: string) => {
    recordToolClick(toolId);
    onNavigate();
  };

  const linkClass = 'flex items-center px-2.5 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-orange-50 hover:text-orange-700 transition';

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{t('searchTools')}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-orange-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && matches.length > 0) {
              event.preventDefault();
              choose(matches[0].tool.id);
              // Follow the first result's link the same way a tap would.
              (document.getElementById(`menu-tool-${matches[0].tool.id}`) as HTMLAnchorElement | null)?.click();
            }
          }}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-base text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-xs"
        />
      </label>

      {needle ? (
        <div className="mt-2" role="region" aria-live="polite" aria-label={t('searchTools')}>
          {matches.length === 0 ? (
            <p className="px-2 py-3 text-xs text-stone-500">{t('noResults', { query })}</p>
          ) : (
            <ul>
              {matches.map(({ tool, copy }) => (
                <li key={tool.id}>
                  <Link id={`menu-tool-${tool.id}`} to={tool.path} onClick={() => choose(tool.id)} className={linkClass}>
                    <span lang={copy.language}>{copy.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-1">
          {categoryKeys.map((categoryKey) => {
            const tools = entries.filter(({ tool }) => tool.category === categoryKey);
            if (tools.length === 0) return null;
            const open = openCategory === categoryKey;
            return (
              <div key={categoryKey} className="rounded-lg border border-stone-200/80">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenCategory(open ? null : categoryKey)}
                  className="flex min-h-10 w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-orange-700"
                >
                  <span>{t(`${categoryKey}.name`, { ns: 'categories' })} <span className="font-normal normal-case tracking-normal text-stone-400">({tools.length})</span></span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {/* Always rendered and only hidden with CSS, so every tool link is in the page for search engines. */}
                {(
                  <ul className={`border-t border-stone-100 p-1 ${open ? '' : 'hidden'}`}>
                    {tools.map(({ tool, copy }) => (
                      <li key={tool.id}>
                        <Link to={tool.path} onClick={() => choose(tool.id)} className={linkClass}>
                          <span lang={copy.language}>{copy.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HeaderToolsMenu;
