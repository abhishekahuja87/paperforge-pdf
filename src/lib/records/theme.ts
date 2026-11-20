import type { FontId } from '../paper/geometry';

export type ThemeId = 'classic' | 'gray' | 'slate' | 'sepia' | 'cyan' | 'ocean' | 'forest' | 'royal' | 'sunset' | 'rose' | 'teal' | 'maroon' | 'mustard' | 'night';

/** ink draws the lines, accent colours titles and filled bands, tint is a pale wash for rows and backgrounds. `fill` themes get coloured header bands. */
export interface Theme { label: string; ink: string; accent: string; tint: string; fill: boolean }

export const THEMES: Record<ThemeId, Theme> = {
  classic: { label: 'Classic black', ink: '#2f2f2f', accent: '#111111', tint: '#f1f1f1', fill: false },
  gray: { label: 'Soft gray', ink: '#9aa0a6', accent: '#555555', tint: '#f1f1f1', fill: false },
  slate: { label: 'Slate blue', ink: '#6f86ad', accent: '#3f5680', tint: '#edf1f8', fill: false },
  sepia: { label: 'Muted sepia', ink: '#a8906f', accent: '#7a5f3a', tint: '#f6f0e6', fill: false },
  cyan: { label: 'Blueprint cyan', ink: '#3fa0c8', accent: '#1f6f93', tint: '#e6f4fa', fill: false },
  ocean: { label: 'Ocean blue', ink: '#1f4e79', accent: '#2e75b6', tint: '#deebf7', fill: true },
  forest: { label: 'Forest green', ink: '#1e4d2b', accent: '#2e7d32', tint: '#e2f0d9', fill: true },
  royal: { label: 'Royal purple', ink: '#3f2a6b', accent: '#6a3fb5', tint: '#ece6f7', fill: true },
  sunset: { label: 'Sunset orange', ink: '#7a3e00', accent: '#e07b00', tint: '#fdebd0', fill: true },
  rose: { label: 'Rose pink', ink: '#7a1f3d', accent: '#d6336c', tint: '#fde4ec', fill: true },
  teal: { label: 'Teal', ink: '#0b4f4a', accent: '#119a8f', tint: '#d9f2ef', fill: true },
  maroon: { label: 'Maroon', ink: '#5c1010', accent: '#9b1c1c', tint: '#f8e1e1', fill: true },
  mustard: { label: 'Mustard gold', ink: '#5c4a0c', accent: '#b58900', tint: '#faf0cc', fill: true },
  night: { label: 'Midnight navy', ink: '#14213d', accent: '#1f3a6e', tint: '#e3e8f3', fill: true },
};

export interface FontFace { label: string; /** Approximate width of one character in mm for each point of size. */ cw: number }

export const FONTS: Record<FontId, FontFace> = {
  sans: { label: 'Clean sans (Helvetica)', cw: 0.19 },
  serif: { label: 'Classic serif (Times)', cw: 0.175 },
  mono: { label: 'Typewriter (Courier)', cw: 0.216 },
};
