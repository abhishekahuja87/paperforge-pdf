import { TOOLS, type ToolCategory, type ToolItem } from '../config/tools';
import { getFeaturedCopy, getToolCopy, isFeaturedId } from './localizedTool';

export const HOME_CATEGORY_ORDER: ToolCategory[] = ['pdf', 'media', 'dev'];

export interface FeaturedTool {
  id: string;
  title: string;
  useCase: string;
  description: string;
  highlights: string[];
}

const FEATURED_IDS = ['master-document-studio', 'digitize-documents', 'display-studio', 'pos-invoice-studio'] as const;

export const HOME_CATEGORY_STYLES: Record<ToolCategory, { icon: string; panel: string }> = {
  pdf: { icon: 'bg-orange-100 text-orange-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  media: { icon: 'bg-emerald-100 text-emerald-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  dev: { icon: 'bg-amber-100 text-amber-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  text: { icon: 'bg-sky-100 text-sky-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
  display: { icon: 'bg-violet-100 text-violet-800', panel: 'border-stone-200 bg-[var(--theme-surface)]' },
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

export function getFeaturedTools(query = '', language = 'en'): Array<{ tool: ToolItem; info: FeaturedTool }> {
  return FEATURED_IDS.flatMap((id) => {
    const tool = TOOLS.find((item) => item.id === id);
    if (!isFeaturedId(id)) throw new Error(`Missing featured tool copy: ${id}`);
    const info = { id, ...getFeaturedCopy(id, language) };
    const english = getFeaturedCopy(id, 'en');
    const normalized = query.trim().toLowerCase();
    const matchesFeatured = [info.title, info.useCase, info.description, ...info.highlights, english.title, english.useCase, english.description, ...english.highlights]
      .some((text) => text.toLowerCase().includes(normalized));
    return tool?.isAvailable && (matchesQuery(tool, query, language) || matchesFeatured) ? [{ tool, info }] : [];
  });
}

export function getHomeTools(query = '', category?: ToolCategory, language = 'en'): ToolItem[] {
  return TOOLS.filter((tool) => {
    if (!tool.isAvailable || FEATURED_IDS.some((id) => id === tool.id)) return false;
    if (category && tool.category !== category) return false;
    return matchesQuery(tool, query, language);
  });
}
