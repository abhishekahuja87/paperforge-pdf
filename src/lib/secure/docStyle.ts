/** How a document looks: the theme, accent colour, paper and spacing. The same CSS styles the editor, the unlock page and the printed copy. */

export type ThemeId = 'classic' | 'modern' | 'elegant' | 'business' | 'typewriter';
export type PaperId = 'a4' | 'letter' | 'wide';
export type MarginId = 'narrow' | 'normal' | 'wide';
export type SpacingId = 'tight' | 'normal' | 'relaxed';

export interface DocStyle {
  theme: ThemeId;
  accent: string;
  paper: PaperId;
  margin: MarginId;
  /** Base text size in pixels. */
  size: number;
  spacing: SpacingId;
}

export const DEFAULT_STYLE: DocStyle = { theme: 'modern', accent: '#1d4ed8', paper: 'a4', margin: 'normal', size: 16, spacing: 'normal' };

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", Times, serif';
const PALATINO = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
const MONO = '"Courier New", Courier, monospace';

export const THEMES: Record<ThemeId, { label: string; hint: string; body: string; head: string }> = {
  modern: { label: 'Modern', hint: 'Clean sans-serif', body: SANS, head: SANS },
  classic: { label: 'Classic', hint: 'Serif, like a letter', body: SERIF, head: SERIF },
  elegant: { label: 'Elegant', hint: 'Centred titles, spaced headings', body: SERIF, head: PALATINO },
  business: { label: 'Business', hint: 'Bold bar headings', body: SANS, head: SANS },
  typewriter: { label: 'Typewriter', hint: 'Monospace notes', body: MONO, head: MONO },
};

export const ACCENTS: { value: string; label: string }[] = [
  { value: '#1d4ed8', label: 'Blue' },
  { value: '#0f766e', label: 'Teal' },
  { value: '#15803d', label: 'Green' },
  { value: '#b45309', label: 'Amber' },
  { value: '#c2410c', label: 'Orange' },
  { value: '#be123c', label: 'Rose' },
  { value: '#7e22ce', label: 'Purple' },
  { value: '#334155', label: 'Slate' },
];

/** Fonts a person can pick for a selection. Only fonts every device already has, so nothing is downloaded and the page works offline. */
export const FONT_CHOICES: { label: string; value: string }[] = [
  { label: 'Same as theme', value: 'inherit' },
  { label: 'Sans-serif', value: SANS },
  { label: 'Serif', value: SERIF },
  { label: 'Book style', value: PALATINO },
  { label: 'Monospace', value: MONO },
  { label: 'Rounded', value: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
];

export const PAPERS: Record<PaperId, { label: string; width: string; pageSize: string }> = {
  a4: { label: 'A4', width: '210mm', pageSize: 'A4' },
  letter: { label: 'Letter', width: '8.5in', pageSize: 'Letter' },
  wide: { label: 'Wide screen', width: '52rem', pageSize: 'A4' },
};

const MARGINS: Record<MarginId, { label: string; screen: string; print: string }> = {
  narrow: { label: 'Narrow', screen: '12mm', print: '12mm' },
  normal: { label: 'Normal', screen: '20mm', print: '18mm' },
  wide: { label: 'Wide', screen: '28mm', print: '25mm' },
};
export const MARGIN_LABELS: Record<MarginId, string> = { narrow: MARGINS.narrow.label, normal: MARGINS.normal.label, wide: MARGINS.wide.label };

const SPACING: Record<SpacingId, { label: string; line: number }> = {
  tight: { label: 'Tight', line: 1.35 },
  normal: { label: 'Normal', line: 1.6 },
  relaxed: { label: 'Relaxed', line: 1.85 },
};
export const SPACING_LABELS: Record<SpacingId, string> = { tight: SPACING.tight.label, normal: SPACING.normal.label, relaxed: SPACING.relaxed.label };

const hexOk = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

/** CSS for a document, limited to `scope` (for example `.sdoc`). Safe to put inside a style element: it contains only values chosen from the lists above. */
export function docCss(input: DocStyle, scope = '.sdoc'): string {
  const style: DocStyle = { ...DEFAULT_STYLE, ...input };
  const accent = hexOk(style.accent) ? style.accent : DEFAULT_STYLE.accent;
  const theme = THEMES[style.theme] ?? THEMES.modern;
  const paper = PAPERS[style.paper] ?? PAPERS.a4;
  const margin = MARGINS[style.margin] ?? MARGINS.normal;
  const line = (SPACING[style.spacing] ?? SPACING.normal).line;
  const size = Math.min(24, Math.max(12, Math.round(style.size)));
  const s = scope;
  const tint = `color-mix(in srgb, ${accent} 10%, white)`;
  const heading: string[] = [];
  switch (style.theme) {
    case 'classic':
      heading.push(`${s} h1{border-bottom:2px solid ${accent};padding-bottom:.25em}`, `${s} h2{color:${accent}}`);
      break;
    case 'modern':
      heading.push(`${s} h1{color:${accent}}`, `${s} h2{color:#111827}`, `${s} h3{color:${accent}}`);
      break;
    case 'elegant':
      heading.push(`${s} h1{text-align:center;font-weight:400;letter-spacing:.04em;color:${accent}}`, `${s} h2{font-weight:400;letter-spacing:.12em;text-transform:uppercase;font-size:1.1em;color:${accent}}`, `${s} .sd-title,${s} .sd-subtitle{text-align:center}`);
      break;
    case 'business':
      heading.push(`${s} h1{border-left:6px solid ${accent};padding-left:.5em}`, `${s} h2{text-transform:uppercase;letter-spacing:.08em;font-size:1.05em;color:${accent}}`);
      break;
    case 'typewriter':
      heading.push(`${s} h1{text-transform:uppercase;border-bottom:2px dashed ${accent};padding-bottom:.2em}`, `${s} h2{color:${accent}}`);
      break;
  }
  return [
    `${s}{box-sizing:border-box;position:relative;width:100%;max-width:${paper.width};margin:0 auto;padding:${margin.screen};background:#fff;color:#1f2937;font-family:${theme.body};font-size:${size}px;line-height:${line};overflow-wrap:anywhere;box-shadow:0 1px 3px rgba(15,23,42,.18),0 8px 30px -12px rgba(15,23,42,.25)}`,
    `${s} *{box-sizing:border-box}`,
    `${s} h1,${s} h2,${s} h3,${s} h4,${s} h5,${s} h6{font-family:${theme.head};line-height:1.25;margin:1.2em 0 .4em;font-weight:700}`,
    `${s} h1{font-size:1.9em}${s} h2{font-size:1.45em}${s} h3{font-size:1.2em}${s} h4{font-size:1.05em}${s} h5,${s} h6{font-size:1em}`,
    ...heading,
    `${s} > :first-child{margin-top:0}`,
    `${s} p{margin:.55em 0}`,
    `${s} ul,${s} ol{margin:.55em 0;padding-left:1.6em}${s} li{margin:.2em 0}`,
    `${s} a{color:${accent};text-decoration:underline}`,
    `${s} blockquote{margin:1em 0;padding:.6em 1em;border-left:4px solid ${accent};background:${tint};border-radius:0 6px 6px 0}`,
    `${s} blockquote p{margin:.3em 0}`,
    `${s} pre,${s} code{font-family:${MONO};font-size:.92em}`,
    `${s} pre{background:#f3f4f6;border-radius:6px;padding:.8em 1em;white-space:pre-wrap;margin:.8em 0}`,
    `${s} code{background:#f3f4f6;border-radius:4px;padding:.05em .3em}${s} pre code{background:none;padding:0}`,
    `${s} hr{border:0;border-top:1px solid #d1d5db;margin:1.4em 0}`,
    `${s} img{max-width:100%;height:auto;border-radius:4px}`,
    `${s} mark{background:#fef08a;padding:0 .15em}`,
    `${s} table{border-collapse:collapse;width:100%;margin:.9em 0;table-layout:auto}`,
    `${s} th,${s} td{border:1px solid #cbd5e1;padding:.4em .6em;text-align:left;vertical-align:top}`,
    `${s} th{background:${tint};font-weight:700}`,
    `${s} .sd-striped tbody tr:nth-child(even) td{background:#f8fafc}`,
    `${s} .sd-lines th,${s} .sd-lines td{border-left:0;border-right:0}`,
    `${s} .sd-plain th,${s} .sd-plain td{border-color:transparent}`,
    `${s} .sd-title{font-family:${theme.head};font-size:2.4em;font-weight:800;line-height:1.1;margin:0 0 .15em;color:${accent}}`,
    `${s} .sd-subtitle{font-size:1.2em;color:#64748b;margin:0 0 1em}`,
    `${s} .sd-lead{font-size:1.15em;color:#374151}`,
    `${s} .sd-center{text-align:center}`,
    `${s} .sd-callout{margin:1em 0;padding:.7em 1em;border-left:4px solid #3b82f6;background:#eff6ff;border-radius:0 8px 8px 0}`,
    `${s} .sd-callout p{margin:.3em 0}`,
    `${s} .sd-info{border-color:#3b82f6;background:#eff6ff}${s} .sd-warn{border-color:#f59e0b;background:#fffbeb}${s} .sd-ok{border-color:#10b981;background:#ecfdf5}${s} .sd-danger{border-color:#ef4444;background:#fef2f2}`,
    `${s} .sd-check{list-style:none;padding-left:.2em}${s} .sd-check li::before{content:"\\2610";margin-right:.55em}`,
    `${s} .sd-break{height:0;border:0;margin:1.2em 0;border-top:1px dashed #94a3b8;break-after:page;page-break-after:always}`,
    `${s} .sd-header{font-size:.82em;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:.4em;margin:0 0 1.4em}`,
    `${s} .sd-footer{font-size:.82em;color:#64748b;border-top:1px solid #e2e8f0;padding-top:.4em;margin:2em 0 0}`,
    `${s} .sd-sign{margin-top:2.2em;border-top:1px solid #64748b;width:14em;padding-top:.2em;font-size:.9em;color:#475569}`,
    `.sd-wm{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-28deg);font:800 clamp(2.6rem,11vw,7rem)/1 ${SANS};letter-spacing:.06em;text-transform:uppercase;color:rgba(100,116,139,.13);white-space:nowrap;pointer-events:none;z-index:2;user-select:none}`,
    `@media (max-width:640px){${s}{padding:1.15rem}}`,
    `@media print{${s}{max-width:none;margin:0;padding:0;box-shadow:none;background:#fff}@page{size:${paper.pageSize};margin:${margin.print}}${s} h1,${s} h2,${s} h3{break-after:avoid}${s} tr,${s} img{break-inside:avoid}}`,
  ].join('\n');
}
