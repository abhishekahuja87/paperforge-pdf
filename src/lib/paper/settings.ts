import { DEFAULT_SETTINGS, canTwoUp, type HexOrientation, type HoleGuide, type StampCorner, type StoryRatio, STORY_RATIOS, PAGE_SIZES, STYLES, TONES, WEIGHTS, HEADER_LABELS, type CornellBody, type DotSize, type HeaderField, type IsoAxis, type IsoMode, type MusicMode, type PageSizeId, type PaperSettings, type PaperStyle, type ToneId, type Weight } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const num = (value: unknown, min: number, max: number, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback);
const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback);

/** Turns anything (a saved file, an old version) into valid settings. Unknown or out-of-range values fall back to the defaults. */
export function coerceSettings(input: unknown): PaperSettings {
  const d = DEFAULT_SETTINGS;
  if (!isRecord(input)) return d;
  const margins: Record<string, unknown> = isRecord(input.margins) ? input.margins : {};
  const dot: Record<string, unknown> = isRecord(input.dot) ? input.dot : {};
  const graph: Record<string, unknown> = isRecord(input.graph) ? input.graph : {};
  const lined: Record<string, unknown> = isRecord(input.lined) ? input.lined : {};
  const cornell: Record<string, unknown> = isRecord(input.cornell) ? input.cornell : {};
  const iso: Record<string, unknown> = isRecord(input.isometric) ? input.isometric : {};
  const music: Record<string, unknown> = isRecord(input.music) ? input.music : {};
  const tracker: Record<string, unknown> = isRecord(input.tracker) ? input.tracker : {};
  const hex: Record<string, unknown> = isRecord(input.hex) ? input.hex : {};
  const cal: Record<string, unknown> = isRecord(input.calligraphy) ? input.calligraphy : {};
  const cross: Record<string, unknown> = isRecord(input.crossstitch) ? input.crossstitch : {};
  const story: Record<string, unknown> = isRecord(input.storyboard) ? input.storyboard : {};
  const stamp: Record<string, unknown> = isRecord(input.stamp) ? input.stamp : {};
  const fields = Array.isArray(input.headerFields)
    ? (input.headerFields.filter((field): field is HeaderField => typeof field === 'string' && field in HEADER_LABELS))
    : d.headerFields;
  const result: PaperSettings = {
    style: pick<PaperStyle>(input.style, STYLES.map((item) => item.id), d.style),
    page: pick<PageSizeId>(input.page, Object.keys(PAGE_SIZES) as PageSizeId[], d.page),
    landscape: bool(input.landscape, d.landscape),
    margins: {
      top: num(margins.top, 0, 40, d.margins.top), bottom: num(margins.bottom, 0, 40, d.margins.bottom),
      left: num(margins.left, 0, 40, d.margins.left), right: num(margins.right, 0, 40, d.margins.right),
    },
    binding: bool(input.binding, d.binding),
    bindingAlternate: bool(input.bindingAlternate, d.bindingAlternate),
    tone: pick<ToneId>(input.tone, Object.keys(TONES) as ToneId[], d.tone),
    weight: pick<Weight>(input.weight, Object.keys(WEIGHTS) as Weight[], d.weight),
    header: bool(input.header, d.header),
    headerFields: fields,
    pages: Math.round(num(input.pages, 1, 50, d.pages)),
    startPage: Math.round(num(input.startPage, 1, 9999, d.startPage)),
    dot: { spacing: num(dot.spacing, 2, 15, d.dot.spacing), size: pick<DotSize>(dot.size, ['fine', 'medium', 'bold'], d.dot.size) },
    graph: { size: num(graph.size, 1.5, 25, d.graph.size), major: graph.major === 0 || graph.major === 5 || graph.major === 10 ? graph.major : d.graph.major, axes: bool(graph.axes, d.graph.axes) },
    lined: { spacing: num(lined.spacing, 4, 15, d.lined.spacing), marginLine: bool(lined.marginLine, d.lined.marginLine), midline: bool(lined.midline, d.lined.midline) },
    cornell: { cuePercent: num(cornell.cuePercent, 15, 40, d.cornell.cuePercent), summaryMm: num(cornell.summaryMm, 20, 90, d.cornell.summaryMm), body: pick<CornellBody>(cornell.body, ['lined', 'dot', 'plain'], d.cornell.body) },
    isometric: { pitch: num(iso.pitch, 3, 20, d.isometric.pitch), mode: pick<IsoMode>(iso.mode, ['dots', 'lines'], d.isometric.mode), axis: pick<IsoAxis>(iso.axis, ['vertical', 'horizontal'], d.isometric.axis) },
    music: { mode: pick<MusicMode>(music.mode, ['staff', 'tab'], d.music.mode), space: num(music.space, 1.2, 3, d.music.space), gap: num(music.gap, 6, 30, d.music.gap), clefSpace: bool(music.clefSpace, d.music.clefSpace) },
    tracker: { days: Math.round(num(tracker.days, 28, 31, d.tracker.days)), rows: Math.round(num(tracker.rows, 3, 30, d.tracker.rows)), habits: typeof tracker.habits === 'string' ? tracker.habits.slice(0, 2000) : d.tracker.habits },
    hex: { radius: num(hex.radius, 3, 20, d.hex.radius), orientation: pick<HexOrientation>(hex.orientation, ['pointy', 'flat'], d.hex.orientation), centers: bool(hex.centers, d.hex.centers) },
    calligraphy: {
      xHeight: num(cal.xHeight, 2.5, 10, d.calligraphy.xHeight), ascender: num(cal.ascender, 1, 4, d.calligraphy.ascender), descender: num(cal.descender, 1, 4, d.calligraphy.descender),
      gap: num(cal.gap, 0, 15, d.calligraphy.gap), slant: num(cal.slant, 0, 90, d.calligraphy.slant), slantLines: bool(cal.slantLines, d.calligraphy.slantLines), slantSpacing: num(cal.slantSpacing, 4, 30, d.calligraphy.slantSpacing),
    },
    crossstitch: { count: Math.round(num(cross.count, 5, 32, d.crossstitch.count)), major: bool(cross.major, d.crossstitch.major), centerLines: bool(cross.centerLines, d.crossstitch.centerLines) },
    storyboard: {
      cols: Math.round(num(story.cols, 1, 4, d.storyboard.cols)), rows: Math.round(num(story.rows, 1, 5, d.storyboard.rows)),
      ratio: pick<StoryRatio>(story.ratio, Object.keys(STORY_RATIOS) as StoryRatio[], d.storyboard.ratio), memo: Math.round(num(story.memo, 0, 5, d.storyboard.memo)),
      gutter: num(story.gutter, 3, 12, d.storyboard.gutter), numbers: bool(story.numbers, d.storyboard.numbers),
    },
    holes: pick<HoleGuide>(input.holes, ['none', '2', '3', '4'], d.holes),
    stamp: { text: typeof stamp.text === 'string' ? stamp.text.slice(0, 40) : d.stamp.text, corner: pick<StampCorner>(stamp.corner, ['tl', 'tr', 'bl', 'br'], d.stamp.corner) },
    twoUp: bool(input.twoUp, d.twoUp),
  };
  return result.twoUp && !canTwoUp(result) ? { ...result, twoUp: false } : result;
}

/** One-click starting points for common uses. Each is applied on top of the defaults. */
export interface PaperPreset { id: string; label: string; hint: string; patch: (base: PaperSettings) => PaperSettings }

const withBase = (patch: (s: PaperSettings) => PaperSettings): PaperPreset['patch'] => (base) => patch({ ...DEFAULT_SETTINGS, pages: base.pages, page: base.page, landscape: base.landscape });

export const PRESETS: PaperPreset[] = [
  { id: 'bujo', label: 'Bullet journal (A5)', hint: 'Dot grid, 5 mm, binding edge', patch: withBase((s) => ({ ...s, style: 'dot', page: 'a5', binding: true, bindingAlternate: true, dot: { spacing: 5, size: 'medium' } })) },
  { id: 'math', label: 'Maths and engineering', hint: 'Graph 5 mm, every 5th line darker, axes', patch: withBase((s) => ({ ...s, style: 'graph', tone: 'slate', graph: { size: 5, major: 5, axes: true } })) },
  { id: 'lecture', label: 'Lecture notes', hint: 'Cornell notes with date and page number', patch: withBase((s) => ({ ...s, style: 'cornell', headerFields: ['page'], binding: true })) },
  { id: 'handwriting', label: 'Handwriting practice', hint: 'Wide ruled with a dotted midline', patch: withBase((s) => ({ ...s, style: 'lined', lined: { spacing: 8.7, marginLine: false, midline: true } })) },
  { id: 'sketch', label: '3D sketching', hint: 'Isometric dots, 8 mm', patch: withBase((s) => ({ ...s, style: 'isometric', tone: 'cyan', isometric: { pitch: 8, mode: 'dots', axis: 'vertical' } })) },
  { id: 'guitar', label: 'Guitar practice', hint: 'Six-line TAB sheets', patch: withBase((s) => ({ ...s, style: 'music', music: { mode: 'tab', space: 1.9, gap: 12, clefSpace: true } })) },
  { id: 'copperplate', label: 'Calligraphy practice', hint: 'Copperplate, 55 degree slant guides', patch: withBase((s) => ({ ...s, style: 'calligraphy', tone: 'slate', calligraphy: { xHeight: 4.5, ascender: 2, descender: 2, gap: 3, slant: 55, slantLines: true, slantSpacing: 12 } })) },
  { id: 'hexmap', label: 'Hex map (games)', hint: 'Pointy-top hexagons with centre dots', patch: withBase((s) => ({ ...s, style: 'hex', hex: { radius: 9, orientation: 'pointy', centers: true } })) },
  { id: 'stitch', label: 'Cross-stitch chart', hint: '14-count Aida, bold lines every 10', patch: withBase((s) => ({ ...s, style: 'crossstitch', crossstitch: { count: 14, major: true, centerLines: true } })) },
  { id: 'story', label: 'Storyboard', hint: '6 panels, 16:9, two memo lines', patch: withBase((s) => ({ ...s, style: 'storyboard', storyboard: { cols: 2, rows: 3, ratio: '16:9', memo: 2, gutter: 6, numbers: true } })) },
  { id: 'habits', label: 'Monthly habit tracker', hint: 'Landscape, 31 days, 12 habits', patch: withBase((s) => ({ ...s, style: 'tracker', landscape: true, tracker: { days: 31, rows: 12, habits: '' } })) },
];

export const serializeSettings = (settings: PaperSettings): string => JSON.stringify({ app: 'mydailyutils-paper-maker', version: 1, settings }, null, 2);

/** Reads a saved settings file. Returns null when the text is not a settings file. */
export function parseSettingsFile(text: string): PaperSettings | null {
  try {
    const data: unknown = JSON.parse(text);
    if (isRecord(data) && data.app === 'mydailyutils-paper-maker' && isRecord(data.settings)) return coerceSettings(data.settings);
  } catch {
    /* not JSON */
  }
  return null;
}
