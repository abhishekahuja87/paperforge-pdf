import { COLLECTIONS } from '../config/homeSections';
import { TOOLS } from '../config/tools';
import { fallbackHubPath } from '../config/hubFallbacks';
import { HUBS } from '../content/hubs';

export interface ToolParent {
  path: string;
  /** Short name of the section, for example "PDF Tools". */
  label: string;
  /** How many tools the section lists, so the link can say "All 25 PDF Tools". */
  count: number;
}

const AVAILABLE = new Set(TOOLS.filter((tool) => tool.isAvailable).map((tool) => tool.id));

/** The short section name for a collection page, taken from the start of its title. */
export const hubLabel = (title: string): string => title.split(':')[0]!.replace(/^Free\s+/i, '').trim();

/** The collection page a tool belongs to, for the link at the top of a tool page. Null when the tool is in none. */
export function hubForTool(toolId: string): ToolParent | null {
  const fallback = fallbackHubPath(toolId);
  const inCollection = (hub: (typeof HUBS)[number]) => COLLECTIONS.find((entry) => entry.id === hub.collection)?.tools.includes(toolId) ?? false;
  const hub = HUBS.find(inCollection) ?? HUBS.find((entry) => entry.path === fallback);
  if (!hub) return null;
  const collection = COLLECTIONS.find((entry) => entry.id === hub.collection);
  return { path: hub.path, label: hubLabel(hub.title), count: (collection?.tools ?? []).filter((id) => AVAILABLE.has(id)).length };
}
