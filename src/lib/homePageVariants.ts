import { TOOLS, type ToolCategory, type ToolItem } from '../config/tools';

export const HOME_CATEGORY_ORDER: ToolCategory[] = ['pdf', 'media', 'dev', 'display', 'business'];

export const HOME_CATEGORY_STYLES: Record<ToolCategory, { icon: string; panel: string }> = {
  pdf: { icon: 'bg-indigo-100 text-indigo-700', panel: 'border-indigo-200 bg-indigo-50/80' },
  media: { icon: 'bg-emerald-100 text-emerald-700', panel: 'border-emerald-200 bg-emerald-50/75' },
  dev: { icon: 'bg-amber-100 text-amber-700', panel: 'border-amber-200 bg-amber-50/80' },
  text: { icon: 'bg-sky-100 text-sky-700', panel: 'border-sky-100 bg-sky-50/50' },
  display: { icon: 'bg-violet-100 text-violet-700', panel: 'border-violet-200 bg-violet-50/80' },
  business: { icon: 'bg-rose-100 text-rose-700', panel: 'border-rose-200 bg-rose-50/80' },
};

export function getHomeTools(query = '', category?: ToolCategory): ToolItem[] {
  const normalized = query.trim().toLowerCase();
  return TOOLS.filter((tool) => {
    if (!tool.isAvailable || tool.id === 'master-document-studio') return false;
    if (category && tool.category !== category) return false;
    return !normalized
      || tool.title.toLowerCase().includes(normalized)
      || tool.description.toLowerCase().includes(normalized)
      || tool.keywords.some((keyword) => keyword.toLowerCase().includes(normalized));
  });
}

export function matchesStudioQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const studio = TOOLS.find((tool) => tool.id === 'master-document-studio');
  if (!studio) return false;
  return studio.title.toLowerCase().includes(normalized)
    || studio.description.toLowerCase().includes(normalized)
    || studio.keywords.some((keyword) => keyword.toLowerCase().includes(normalized));
}
