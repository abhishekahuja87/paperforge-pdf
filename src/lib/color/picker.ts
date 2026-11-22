import { toHex, type Rgb } from '../utilities/dev';

export interface Hsv { h: number; s: number; v: number }

/** Hue 0 to 360, saturation and value 0 to 1. */
export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255; const gn = g / 255; const bn = b / 255;
  const max = Math.max(rn, gn, bn); const min = Math.min(rn, gn, bn); const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export const hsvToHex = (hsv: Hsv): string => toHex(hsvToRgb(hsv));

/** Ready colours: neutrals first, then the usual hues. */
export const SWATCHES = [
  '#000000', '#374151', '#6b7280', '#d1d5db', '#f3f4f6', '#ffffff',
  '#b91c1c', '#ea580c', '#f59e0b', '#facc15', '#65a30d', '#15803d',
  '#0d9488', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#c026d3',
  '#db2777', '#9f1239', '#78350f', '#14532d', '#1e3a8a', '#0f172a',
];

const KEY = 'recent-colours';

export function readRecentColors(): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string' && /^#[0-9a-f]{6}$/i.test(item)).slice(0, 8) : [];
  } catch { return []; }
}

/** Remembers a colour the person chose, newest first, on this device only. */
export function rememberColor(hex: string): void {
  try {
    const next = [hex.toLowerCase(), ...readRecentColors().filter((item) => item !== hex.toLowerCase())].slice(0, 8);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage may be blocked; recent colours are a convenience only */ }
}
