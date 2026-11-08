import { TOOLS, type ToolCategory, type ToolItem } from '../config/tools';
import { getFeaturedCopy, getToolCopy, isFeaturedId } from './localizedTool';

export const HOME_CATEGORY_ORDER: ToolCategory[] = ['pdf', 'media', 'finance', 'everyday', 'text', 'dev'];

export interface FeaturedTool {
  id: string;
  title: string;
  useCase: string;
  description: string;
  highlights: string[];
}

/** Display order for the homepage "Most used" row and the "Workspaces" row. */
const POPULAR_ORDER = ['merge-pdf', 'split-pdf', 'compress-pdf', 'image-to-pdf', 'pdf-to-images', 'image-compressor'];
const WORKSPACE_ORDER = ['master-document-studio', 'digitize-documents', 'pos-invoice-studio', 'display-studio'];

export const HOME_CATEGORY_STYLES: Record<ToolCategory, { icon: string; panel: string }> = {
  pdf: { icon: 'bg-orange-100 text-orange-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  media: { icon: 'bg-emerald-100 text-emerald-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  dev: { icon: 'bg-amber-100 text-amber-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  text: { icon: 'bg-sky-100 text-sky-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  display: { icon: 'bg-violet-100 text-violet-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  finance: { icon: 'bg-teal-100 text-teal-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  everyday: { icon: 'bg-indigo-100 text-indigo-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  business: { icon: 'bg-rose-100 text-rose-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
};

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

/** Everyday tools shown as compact tiles in the "Most used" row. */
export function getPopularTools(): ToolItem[] {
  return orderedTools(POPULAR_ORDER).filter((tool) => tool.tier === 'popular');
}

/** Larger studio-style tools shown in the "Workspaces" row, with their featured copy. */
export function getWorkspaceTools(language = 'en'): Array<{ tool: ToolItem; info: FeaturedTool }> {
  return orderedTools(WORKSPACE_ORDER)
    .filter((tool) => tool.tier === 'workspace')
    .map((tool) => ({ tool, info: featuredInfo(tool, language) }));
}

/** Secondary tools shown (always expanded) under "More tools", grouped by category. */
export function getMoreTools(category: ToolCategory): ToolItem[] {
  return TOOLS.filter((tool) => tool.isAvailable && tool.tier === 'more' && tool.category === category);
}

/**
 * Search across every available tool, including footer-only (advanced) tools,
 * so a tool is always findable even when it is not shown on the homepage.
 */
export function getSearchResults(query: string, language = 'en'): ToolItem[] {
  const normalized = query.trim().toLowerCase();
  return TOOLS.filter((tool) => {
    if (!tool.isAvailable) return false;
    if (matchesQuery(tool, query, language)) return true;
    if (tool.tier !== 'workspace' || !isFeaturedId(tool.id)) return false;
    const localized = featuredInfo(tool, language);
    const english = getFeaturedCopy(tool.id, 'en');
    return [localized.title, localized.useCase, localized.description, ...localized.highlights, english.title, english.useCase, english.description, ...english.highlights]
      .some((text) => text.toLowerCase().includes(normalized));
  });
}
