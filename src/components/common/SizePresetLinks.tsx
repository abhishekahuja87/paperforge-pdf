import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSizePresets } from '../../lib/homePageVariants';

/** Chips that link the image resizer pages for exact sizes (20, 30, 50, 100, 200 KB), so they link to each other. */
export const SizePresetLinks: React.FC = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const presets = getSizePresets();
  if (presets.length === 0) return null;
  return (
    <nav aria-label={t('sizePresets.title')} className="mt-4 rounded-xl border border-stone-200 bg-white/80 p-3">
      <p className="text-xs font-bold text-stone-800">{t('sizePresets.title')}</p>
      <p className="mt-0.5 text-[11px] text-stone-500">{t('sizePresets.hint')}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {presets.map(({ tool, kb }) => (
          <li key={tool.id}>
            <Link
              to={tool.path}
              aria-current={pathname === tool.path ? 'page' : undefined}
              className={`inline-block rounded-full border px-3 py-1.5 text-xs font-bold transition ${pathname === tool.path ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-stone-200 bg-white text-stone-700 hover:border-orange-300 hover:text-orange-800'}`}
            >
              {kb} KB
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
