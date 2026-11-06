import { TOOLS, type ToolCategory, type ToolItem } from '../config/tools';

export const HOME_CATEGORY_ORDER: ToolCategory[] = ['pdf', 'media', 'dev'];

export interface FeaturedTool {
  id: string;
  useCase: string;
  description: string;
  highlights: string[];
}

// Edit this list to change which tools are highlighted on the home page.
export const FEATURED_TOOLS: FeaturedTool[] = [
  {
    id: 'master-document-studio',
    useCase: 'For documents',
    description: 'Bring PDFs, Word files, images and custom pages together, arrange them, add a linked contents page and export one finished PDF.',
    highlights: ['Mix PDF, Word & images', 'Reorder pages', 'Linked contents'],
  },
  {
    id: 'display-studio',
    useCase: 'For screens & shops',
    description: 'Turn any TV, tablet or phone into a display. Run timed slideshows of your menus, offers and documents in fullscreen.',
    highlights: ['Fullscreen slideshow', 'Works on any device', 'Timed playback'],
  },
  {
    id: 'pos-invoice-studio',
    useCase: 'For businesses',
    description: 'Manage your products and stock, then create printable bills. Everything works offline and stays in your browser.',
    highlights: ['Offline billing', 'Inventory', 'Printable bills', 'JSON backup'],
  },
];

const FEATURED_IDS = new Set(FEATURED_TOOLS.map((item) => item.id));

export const HOME_CATEGORY_STYLES: Record<ToolCategory, { icon: string; panel: string }> = {
  pdf: { icon: 'bg-orange-100 text-orange-800', panel: 'border-stone-200 bg-[#fffdf8]' },
  media: { icon: 'bg-emerald-100 text-emerald-800', panel: 'border-stone-200 bg-[#fffdf8]' },
  dev: { icon: 'bg-amber-100 text-amber-800', panel: 'border-stone-200 bg-[#fffdf8]' },
  text: { icon: 'bg-sky-100 text-sky-800', panel: 'border-stone-200 bg-[#fffdf8]' },
  display: { icon: 'bg-violet-100 text-violet-800', panel: 'border-stone-200 bg-[#fffdf8]' },
  business: { icon: 'bg-rose-100 text-rose-800', panel: 'border-stone-200 bg-[#fffdf8]' },
};

function matchesQuery(tool: ToolItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return !normalized
    || tool.title.toLowerCase().includes(normalized)
    || tool.description.toLowerCase().includes(normalized)
    || tool.keywords.some((keyword) => keyword.toLowerCase().includes(normalized));
}

export function getFeaturedTools(query = ''): Array<{ tool: ToolItem; info: FeaturedTool }> {
  return FEATURED_TOOLS.flatMap((info) => {
    const tool = TOOLS.find((item) => item.id === info.id);
    return tool?.isAvailable && matchesQuery(tool, query) ? [{ tool, info }] : [];
  });
}

export function getHomeTools(query = '', category?: ToolCategory): ToolItem[] {
  return TOOLS.filter((tool) => {
    if (!tool.isAvailable || FEATURED_IDS.has(tool.id)) return false;
    if (category && tool.category !== category) return false;
    return matchesQuery(tool, query);
  });
}
