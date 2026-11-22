import React from 'react';
import { THEMES, type Theme } from '../../../lib/screens/timed';
import { THEME_SWATCH } from '../../../lib/screens/themes';

/** A few simple screen colours to choose from. Used by every big-screen tool, the quiz and the workout slideshow. */
export const ThemePicker: React.FC<{ value: Theme; onChange: (theme: Theme) => void; label?: string; name: string }> = ({ value, onChange, label = 'Screen colour', name }) => (
  <fieldset className="space-y-1">
    <legend className="text-xs font-bold text-stone-700">{label}</legend>
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {THEMES.map((theme) => (
        <label key={theme.id} className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${value === theme.id ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-stone-200 bg-white text-stone-700 hover:border-orange-300'}`}>
          <input type="radio" name={name} value={theme.id} checked={value === theme.id} onChange={() => onChange(theme.id)} className="sr-only" />
          <span aria-hidden="true" className={`h-4 w-4 rounded-full ${THEME_SWATCH[theme.id]}`} />
          {theme.label}
        </label>
      ))}
    </div>
  </fieldset>
);
