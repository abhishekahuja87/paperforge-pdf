import React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TOOLS } from '../../config/tools';
import { togglePin, useMyTools } from '../../lib/myTools';

const BY_PATH = new Map(TOOLS.map((tool) => [tool.path, tool.id]));

/** Star button on a tool page: pins the tool to the "Your tools" row on the home page. */
export const PinToolButton: React.FC<{ path: string }> = ({ path }) => {
  const { t } = useTranslation();
  const { pinned } = useMyTools();
  const id = BY_PATH.get(path.replace(/\/+$/, '') || '/');
  if (!id) return null;
  const on = pinned.includes(id);
  return (
    <button
      type="button"
      onClick={() => togglePin(id)}
      aria-pressed={on}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 print:hidden ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-stone-200 bg-white text-stone-700 hover:border-orange-300'}`}
    >
      <Star className={`h-3.5 w-3.5 ${on ? 'fill-orange-500 text-orange-600' : ''}`} aria-hidden="true" />
      {on ? t('myTools.pinned', { defaultValue: 'Pinned' }) : t('myTools.pin', { defaultValue: 'Pin' })}
    </button>
  );
};
