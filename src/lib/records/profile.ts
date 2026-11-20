import type { FontId } from '../paper/geometry';
import type { Logo } from '../paper/image';
import type { PageSizeId, ToneId, Weight } from '../paper/types';
import type { ThemeId } from './theme';

/** What can be remembered on this device when the person ticks "Remember": the look, the logo and the name for each family of sheets. Nothing else is stored and nothing is sent anywhere. */
export interface Profile {
  look?: { page: PageSizeId; margin: number; tone: ToneId; weight: Weight; theme: ThemeId; font: FontId };
  logo?: Logo | null;
  headings?: Record<string, string>;
}

const KEY = 'mdu.profile.v1';

export function loadProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Profile;
    return data && typeof data === 'object' ? data : null;
  } catch { return null; }
}

export function saveProfile(profile: Profile): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(profile)); } catch { /* storage full or blocked: skip */ }
}

export function clearProfile(): void {
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
}
