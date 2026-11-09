import type { ToolCategory, ToolIconName, ToolItem, ToolTier } from '../tools';
import type { PageGuideId } from '../../lib/usePageGuide';

/**
 * One tool that belongs to a pack (a group of tools built for one kind of person). A pack lives in its own
 * file in this folder, its text in src/locales/packs, and its screens in src/components/tools/<pack>.
 */
export interface PackTool {
  /** Catalogue entry shown on the home page, footer and search. Built from the pack's text by definePackTool. */
  tool: ToolItem;
  /** Key that PackToolPage uses to find the screen in src/components/tools/packRegistry.ts. */
  kind: string;
  /** Key in pageGuides (the FAQ and heading copy for the page). */
  guideKey: PageGuideId;
  /** Show the "copy link to this calculation" bar. Only for tools whose inputs are plain numbers, dates and choices. */
  shareable: boolean;
}

interface PackToolSpec {
  id: string;
  kind: string;
  guideKey: PageGuideId;
  category: ToolCategory;
  icon: ToolIconName;
  tier: ToolTier;
  keywords: string[];
  shareable?: boolean;
}

/** Builds a PackTool whose title and description come from the pack's text file, so the wording lives in one place. */
export function definePackTool(spec: PackToolSpec, catalog: Record<string, string[]>): PackTool {
  const [title, description] = catalog[spec.id] ?? [spec.id, ''];
  return {
    kind: spec.kind,
    guideKey: spec.guideKey,
    shareable: spec.shareable ?? false,
    tool: { id: spec.id, title, description, category: spec.category, path: `/${spec.id}`, icon: spec.icon, isAvailable: true, tier: spec.tier, keywords: spec.keywords },
  };
}
