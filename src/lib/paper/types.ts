/** Settings and option lists for the printable paper maker. All sizes are in millimetres. */

export type PaperStyle = 'dot' | 'graph' | 'lined' | 'cornell' | 'isometric' | 'music' | 'tracker';
export type PageSizeId = 'a4' | 'a5' | 'letter' | 'legal';
export type ToneId = 'gray' | 'slate' | 'sepia' | 'cyan' | 'charcoal';
export type Weight = 'hairline' | 'normal' | 'bold';
export type HeaderField = 'date' | 'subject' | 'project' | 'page';
export type DotSize = 'fine' | 'medium' | 'bold';
export type CornellBody = 'lined' | 'dot' | 'plain';
export type IsoMode = 'dots' | 'lines';
export type IsoAxis = 'vertical' | 'horizontal';
export type MusicMode = 'staff' | 'tab';

export interface PaperSettings {
  style: PaperStyle;
  page: PageSizeId;
  landscape: boolean;
  margins: { top: number; bottom: number; left: number; right: number };
  /** Adds extra room on the binding edge for hole punches or spiral rings. */
  binding: boolean;
  /** Moves the binding edge to the other side on back pages, for double-sided printing. */
  bindingAlternate: boolean;
  tone: ToneId;
  weight: Weight;
  header: boolean;
  headerFields: HeaderField[];
  pages: number;
  startPage: number;
  dot: { spacing: number; size: DotSize };
  graph: { size: number; major: 0 | 5 | 10; axes: boolean };
  lined: { spacing: number; marginLine: boolean; midline: boolean };
  cornell: { cuePercent: number; summaryMm: number; body: CornellBody };
  isometric: { pitch: number; mode: IsoMode; axis: IsoAxis };
  music: { mode: MusicMode; space: number; gap: number; clefSpace: boolean };
  tracker: { days: number; rows: number; habits: string };
}

export const BINDING_MM = 12;

export const PAGE_SIZES: Record<PageSizeId, { label: string; width: number; height: number }> = {
  a4: { label: 'A4 (210 × 297 mm)', width: 210, height: 297 },
  a5: { label: 'A5 (148 × 210 mm)', width: 148, height: 210 },
  letter: { label: 'US Letter (8.5 × 11 in)', width: 215.9, height: 279.4 },
  legal: { label: 'US Legal (8.5 × 14 in)', width: 215.9, height: 355.6 },
};

export const TONES: Record<ToneId, { label: string; color: string }> = {
  gray: { label: 'Soft gray', color: '#9aa0a6' },
  slate: { label: 'Slate blue', color: '#6f86ad' },
  sepia: { label: 'Muted sepia', color: '#a8906f' },
  cyan: { label: 'Blueprint cyan', color: '#3fa0c8' },
  charcoal: { label: 'Charcoal black', color: '#2f2f2f' },
};

/** Line thickness in mm for each weight. */
export const WEIGHTS: Record<Weight, { label: string; mm: number }> = {
  hairline: { label: 'Ultra-fine', mm: 0.1 },
  normal: { label: 'Normal', mm: 0.2 },
  bold: { label: 'Bold', mm: 0.35 },
};

export const DOT_RADIUS: Record<DotSize, number> = { fine: 0.15, medium: 0.22, bold: 0.32 };

export const HEADER_LABELS: Record<HeaderField, string> = { date: 'Date', subject: 'Subject', project: 'Project', page: 'Page number' };

export const STYLES: { id: PaperStyle; label: string; hint: string }[] = [
  { id: 'dot', label: 'Dot grid', hint: 'Bullet journal' },
  { id: 'graph', label: 'Graph', hint: 'Math and engineering' },
  { id: 'lined', label: 'Lined', hint: 'Notes and handwriting' },
  { id: 'cornell', label: 'Cornell notes', hint: 'Lectures and meetings' },
  { id: 'isometric', label: 'Isometric', hint: '3D sketching' },
  { id: 'music', label: 'Music staff / TAB', hint: 'Manuscript paper' },
  { id: 'tracker', label: 'Habit tracker', hint: 'Month at a glance' },
];

export const DEFAULT_SETTINGS: PaperSettings = {
  style: 'dot',
  page: 'a4',
  landscape: false,
  margins: { top: 12, bottom: 12, left: 12, right: 12 },
  binding: false,
  bindingAlternate: false,
  tone: 'gray',
  weight: 'normal',
  header: false,
  headerFields: ['date', 'subject'],
  pages: 1,
  startPage: 1,
  dot: { spacing: 5, size: 'medium' },
  graph: { size: 5, major: 5, axes: false },
  lined: { spacing: 7.1, marginLine: true, midline: false },
  cornell: { cuePercent: 28, summaryMm: 45, body: 'lined' },
  isometric: { pitch: 8, mode: 'dots', axis: 'vertical' },
  music: { mode: 'staff', space: 1.9, gap: 14, clefSpace: true },
  tracker: { days: 31, rows: 12, habits: '' },
};
