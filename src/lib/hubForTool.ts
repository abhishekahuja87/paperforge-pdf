import { COLLECTIONS } from '../config/homeSections';
import { HUBS } from '../content/hubs';

export interface ToolParent { path: string; label: string }

/** The collection page a tool belongs to, for the back link at the top of a tool page. Null when the tool is in none. */
export function hubForTool(toolId: string): ToolParent | null {
  for (const hub of HUBS) {
    const collection = COLLECTIONS.find((entry) => entry.id === hub.collection);
    if (collection?.tools.includes(toolId)) {
      const label = hub.title.split(':')[0]!.replace(/^Free\s+/i, '').trim();
      return { path: hub.path, label };
    }
  }
  return null;
}
