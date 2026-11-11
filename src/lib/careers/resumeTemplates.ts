/**
 * Resume template catalogue and colour helpers. A template is a small description (font, header, headings, layout);
 * `ResumePreview` draws any of them from the same resume data, so adding a template means adding one entry here.
 */

export type ResumeFont = 'serif' | 'sans' | 'humanist' | 'mono';
export type ResumeHeader = 'center' | 'left' | 'split' | 'band' | 'gradient';
export type ResumeHeadings = 'rule' | 'accent-rule' | 'bar' | 'small-caps' | 'plain-caps' | 'pill' | 'divider';
export type ResumeSidebar = 'gradient' | 'tint';

export interface ResumeTemplateSpec {
  id: string;
  name: string;
  /** One short line shown under the name in the picker. */
  blurb: string;
  /** Uses the accent colour. Plain templates ignore it. */
  colour: boolean;
  font: ResumeFont;
  header: ResumeHeader;
  headings: ResumeHeadings;
  /** A side column. Two-column designs read well to people, but some applicant tracking systems read columns out of order. */
  sidebar?: ResumeSidebar;
  /** Skills shown as small tags instead of a comma list. */
  chips?: boolean;
  /** Experience drawn along a vertical line with dots. */
  timeline?: boolean;
  /** Default accent colour for this template. */
  accent: string;
}

export const RESUME_TEMPLATES: ResumeTemplateSpec[] = [
  { id: 'classic', name: 'Classic', blurb: 'Serif, centred, black and white', colour: false, font: 'serif', header: 'center', headings: 'rule', accent: '#111111' },
  { id: 'modern', name: 'Modern', blurb: 'Sans-serif with a colour accent', colour: true, font: 'sans', header: 'left', headings: 'accent-rule', accent: '#1d4ed8' },
  { id: 'minimal', name: 'Minimal', blurb: 'Quiet, lots of white space', colour: false, font: 'humanist', header: 'left', headings: 'plain-caps', accent: '#111111' },
  { id: 'executive', name: 'Executive', blurb: 'Serif with a deep navy header line', colour: true, font: 'serif', header: 'split', headings: 'small-caps', accent: '#1e3a5f' },
  { id: 'bar', name: 'Side bar', blurb: 'Compact, headings with a colour bar', colour: true, font: 'sans', header: 'left', headings: 'bar', accent: '#0f766e' },
  { id: 'banner', name: 'Banner', blurb: 'Solid colour name banner', colour: true, font: 'sans', header: 'band', headings: 'accent-rule', accent: '#be123c' },
  { id: 'sunrise', name: 'Sunrise', blurb: 'Horizontal gradient banner, pill headings', colour: true, font: 'humanist', header: 'gradient', headings: 'pill', chips: true, accent: '#ea580c' },
  { id: 'ocean', name: 'Ocean column', blurb: 'Vertical gradient side column', colour: true, font: 'sans', header: 'left', headings: 'accent-rule', sidebar: 'gradient', accent: '#0369a1' },
  { id: 'mist', name: 'Mist column', blurb: 'Light tinted side column', colour: true, font: 'humanist', header: 'left', headings: 'accent-rule', sidebar: 'tint', accent: '#7c3aed' },
  { id: 'timeline', name: 'Timeline', blurb: 'Jobs along a coloured line', colour: true, font: 'sans', header: 'left', headings: 'small-caps', timeline: true, accent: '#15803d' },
  { id: 'elegant', name: 'Elegant', blurb: 'Serif with centred dividers', colour: true, font: 'serif', header: 'center', headings: 'divider', accent: '#9a3412' },
  { id: 'violet', name: 'Violet wave', blurb: 'Gradient banner with skill tags', colour: true, font: 'sans', header: 'gradient', headings: 'bar', chips: true, accent: '#6d28d9' },
  { id: 'mono', name: 'Developer', blurb: 'Monospace, plain and technical', colour: false, font: 'mono', header: 'left', headings: 'plain-caps', accent: '#111111' },
];

export const DEFAULT_TEMPLATE = 'classic';

export function getTemplate(id: string): ResumeTemplateSpec {
  return RESUME_TEMPLATES.find((item) => item.id === id) ?? RESUME_TEMPLATES[0];
}

export const isTemplateId = (id: unknown): id is string => typeof id === 'string' && RESUME_TEMPLATES.some((item) => item.id === id);

export const FONT_STACKS: Record<ResumeFont, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'Arial, Helvetica, sans-serif',
  humanist: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
  mono: 'Consolas, "Courier New", monospace',
};

const channels = (hex: string): [number, number, number] => {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#111111';
  return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
};

const toHex = (parts: number[]) => `#${parts.map((part) => Math.round(Math.max(0, Math.min(255, part))).toString(16).padStart(2, '0')).join('')}`;

/** Darken (negative amount) or lighten (positive amount) a colour; the amount runs from -1 to 1. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = channels(hex);
  const target = amount < 0 ? 0 : 255;
  const weight = Math.abs(amount);
  return toHex([r + (target - r) * weight, g + (target - g) * weight, b + (target - b) * weight]);
}

/** The colour as a translucent wash, for soft backgrounds. */
export function tint(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((part) => {
    const unit = part / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or near-black text, whichever reads better on the given background. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.4 ? '#111111' : '#ffffff';
}

/** Readable text for a gradient: judged on its lightest end. */
export function readableOnGradient(from: string, to: string): string {
  return luminance(from) > luminance(to) ? readableOn(from) : readableOn(to);
}
