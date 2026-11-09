import { TOOLS, type ToolItem } from '../config/tools';
import { COLLECTIONS, MOST_USED, NEW_TOOLS, SIZE_PRESET_PATTERN, WORKSPACES, type CollectionSpec } from '../config/homeSections';
import { getFeaturedCopy, getToolCopy, isFeaturedId } from './localizedTool';

export interface FeaturedTool {
  id: string;
  title: string;
  useCase: string;
  description: string;
  highlights: string[];
}

/** Colour of each topic's icon badge on the home page. */
export const HOME_COLLECTION_STYLES: Record<string, string> = {
  pdf: 'bg-orange-100 text-orange-800',
  images: 'bg-emerald-100 text-emerald-800',
  money: 'bg-teal-100 text-teal-800',
  everyday: 'bg-indigo-100 text-indigo-800',
  printables: 'bg-rose-100 text-rose-800',
  work: 'bg-amber-100 text-amber-800',
  study: 'bg-sky-100 text-sky-800',
  sharing: 'bg-violet-100 text-violet-800',
  dev: 'bg-slate-200 text-slate-800',
  other: 'bg-stone-200 text-stone-800',
};

/** Hover colour of a tile's icon in each topic: a darker shade of the topic colour, with a white icon. */
export const HOME_COLLECTION_HOVER: Record<string, string> = {
  pdf: 'group-hover:bg-orange-700 group-hover:text-white',
  images: 'group-hover:bg-emerald-700 group-hover:text-white',
  money: 'group-hover:bg-teal-700 group-hover:text-white',
  everyday: 'group-hover:bg-indigo-700 group-hover:text-white',
  printables: 'group-hover:bg-rose-700 group-hover:text-white',
  work: 'group-hover:bg-amber-700 group-hover:text-white',
  study: 'group-hover:bg-sky-700 group-hover:text-white',
  sharing: 'group-hover:bg-violet-700 group-hover:text-white',
  dev: 'group-hover:bg-slate-700 group-hover:text-white',
  other: 'group-hover:bg-stone-700 group-hover:text-white',
};

export interface HomeCollection {
  id: string;
  icon: CollectionSpec['icon'];
  /** Tools shown as cards, in the configured order. */
  tools: ToolItem[];
  /** Exact-size image presets, shown as chips with their size in KB. */
  presets: { tool: ToolItem; kb: number }[];
}

function matchesQuery(tool: ToolItem, query: string, language: string): boolean {
  const normalized = query.trim().toLowerCase();
  const localized = getToolCopy(tool, language);
  return !normalized
    || tool.title.toLowerCase().includes(normalized)
    || tool.description.toLowerCase().includes(normalized)
    || localized.title.toLowerCase().includes(normalized)
    || localized.description.toLowerCase().includes(normalized)
    || tool.keywords.some((keyword) => keyword.toLowerCase().includes(normalized));
}

function orderedTools(ids: string[]): ToolItem[] {
  return ids.flatMap((id) => {
    const tool = TOOLS.find((item) => item.id === id);
    return tool?.isAvailable ? [tool] : [];
  });
}

function featuredInfo(tool: ToolItem, language: string): FeaturedTool {
  if (!isFeaturedId(tool.id)) throw new Error(`Missing featured tool copy: ${tool.id}`);
  return { id: tool.id, ...getFeaturedCopy(tool.id, language) };
}

/** Short name for tiles: tool titles are written for search and can be long ("Name: what it does"), so cards use the part before the colon. */
export const homeTitle = (title: string): string => title.split(':')[0]!.trim() || title;

/** The exact-size image pages (20, 30, 50, 100 and 200 KB), smallest first. */
export function getSizePresets(): { tool: ToolItem; kb: number }[] {
  return TOOLS.flatMap((tool) => {
    const match = tool.isAvailable ? SIZE_PRESET_PATTERN.exec(tool.id) : null;
    return match ? [{ tool, kb: Number(match[1]) }] : [];
  }).sort((a, b) => a.kb - b.kb);
}

/** Tiles for the "Most used" row. */
export const getMostUsedTools = (): ToolItem[] => orderedTools(MOST_USED);

/** A few popular tools for pages such as the 404 page. */
export const getPopularTools = (): ToolItem[] => getMostUsedTools().slice(0, 8);

/** Ids of recently added tools, which get a "New" tag. */
export const getNewToolIds = (): Set<string> => new Set(NEW_TOOLS);

/** Larger studio-style tools shown in the slim "Workspaces" row, with their featured copy. */
export function getWorkspaceTools(language = 'en'): Array<{ tool: ToolItem; info: FeaturedTool }> {
  return orderedTools(WORKSPACES).map((tool) => ({ tool, info: featuredInfo(tool, language) }));
}

/**
 * Every tool by topic. Tools that are not in a configured topic (and are not workspaces) are collected under
 * "other", so adding a tool without editing the home configuration still makes it visible.
 */
export function getCollections(): HomeCollection[] {
  const placed = new Set<string>(WORKSPACES);
  const build = (id: string, icon: CollectionSpec['icon'], tools: ToolItem[]): HomeCollection => ({
    id,
    icon,
    tools: tools.filter((tool) => !SIZE_PRESET_PATTERN.test(tool.id)),
    presets: tools.flatMap((tool) => {
      const match = SIZE_PRESET_PATTERN.exec(tool.id);
      return match ? [{ tool, kb: Number(match[1]) }] : [];
    }).sort((a, b) => a.kb - b.kb),
  });
  const groups = COLLECTIONS.map((spec) => {
    const tools = orderedTools(spec.tools);
    tools.forEach((tool) => placed.add(tool.id));
    return build(spec.id, spec.icon, tools);
  });
  const rest = TOOLS.filter((tool) => tool.isAvailable && !placed.has(tool.id));
  const all = rest.length > 0 ? [...groups, build('other', 'layers', rest)] : groups;
  return all.filter((group) => group.tools.length + group.presets.length > 0);
}

/**
 * Search across every available tool so a tool is always findable, including workspace tools by their
 * featured wording.
 */
export function getSearchResults(query: string, language = 'en'): ToolItem[] {
  const normalized = query.trim().toLowerCase();
  return TOOLS.filter((tool) => {
    if (!tool.isAvailable) return false;
    if (matchesQuery(tool, query, language)) return true;
    if (!WORKSPACES.includes(tool.id) || !isFeaturedId(tool.id)) return false;
    const localized = featuredInfo(tool, language);
    const english = getFeaturedCopy(tool.id, 'en');
    return [localized.title, localized.useCase, localized.description, ...localized.highlights, english.title, english.useCase, english.description, ...english.highlights]
      .some((text) => text.toLowerCase().includes(normalized));
  });
}
