import React from 'react';
import type { FontId } from '../../../lib/paper/geometry';
import { resolveTheme, type StyleChoice } from '../../../lib/paper/style';
import { FONTS, THEMES, type ThemeId } from '../../../lib/records/theme';
import { ChoiceButtons } from '../utilities/common';

/** Colour theme and font buttons shared by every printable maker. */
export const StylePicker: React.FC<{ value: StyleChoice; onChange: (patch: { theme: ThemeId } | { font: FontId }) => void }> = ({ value, onChange }) => {
  const current = resolveTheme(value).id;
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-700">Colour theme</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(THEMES) as [ThemeId, { label: string; ink: string; accent: string }][]).map(([id, theme]) => (
            <button key={id} type="button" aria-pressed={current === id} onClick={() => onChange({ theme: id })} className={`flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${current === id ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              <span className="flex h-3.5 w-6 overflow-hidden rounded-full border border-slate-200" aria-hidden="true"><span className="h-full w-1/2" style={{ background: theme.ink }} /><span className="h-full w-1/2" style={{ background: theme.accent }} /></span>{theme.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">Coloured themes add coloured titles, header bands and light row shading where the sheet has them. Light tones use less ink.</p>
      </div>
      <ChoiceButtons label="Font" value={value.font ?? 'sans'} onChange={(font) => onChange({ font: font as FontId })} options={(Object.entries(FONTS) as [FontId, { label: string }][]).map(([id, item]) => ({ value: id, label: item.label }))} />
    </div>
  );
};
