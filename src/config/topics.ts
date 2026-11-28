import { TOOLS, type ToolItem } from './tools';
import { COLLECTIONS, VARIANT_PAGES, WORKSPACES } from './homeSections';

/**
 * The single list of tool groups used by the home page, the header menu, the footer and the pre-rendered
 * pages, so a visitor sees the same group names and the same tools in each place.
 * Groups come from COLLECTIONS in homeSections.ts. A tool in no group is collected under "other", and the
 * studio tools form a final "workspaces" group (the home page shows them as a separate row).
 */
export interface Topic {
  /** A COLLECTIONS id, "other" or "workspaces". The group name is `homeCollections.<id>.name`, or `workspaces`. */
  id: string;
  tools: ToolItem[];
}

export const WORKSPACES_TOPIC = 'workspaces';

/** Locale key for a group's name. */
export function topicNameKey(id: string): string {
  return id === WORKSPACES_TOPIC ? 'workspaces' : `homeCollections.${id}.name`;
}

function inOrder(ids: string[]): ToolItem[] {
  return ids.flatMap((id) => {
    const tool = TOOLS.find((item) => item.id === id);
    return tool?.isAvailable ? [tool] : [];
  });
}

export function getTopics(): Topic[] {
  const placed = new Set<string>(WORKSPACES);
  const topics: Topic[] = COLLECTIONS.map((spec) => {
    const tools = inOrder(spec.tools).filter((tool) => !WORKSPACES.includes(tool.id));
    tools.forEach((tool) => placed.add(tool.id));
    return { id: spec.id, tools };
  });
  const rest = TOOLS.filter((tool) => tool.isAvailable && !placed.has(tool.id));
  if (rest.length > 0) topics.push({ id: 'other', tools: rest });
  const studios = inOrder(WORKSPACES);
  if (studios.length > 0) topics.push({ id: WORKSPACES_TOPIC, tools: studios });
  return topics.filter((topic) => topic.tools.length > 0);
}

/**
 * The groups a visitor browses: the home page sections and the "Explore tools" menu both use this list, so they always
 * show the same group names and the same tools. It is getTopics() without the variant pages (sheets that live under one
 * main tool), which would otherwise appear as a large "More tools" group that the home page does not have.
 * The footer and the pre-rendered pages keep using getTopics(), so every variant page stays linked for search engines.
 */
export function getListedTopics(): Topic[] {
  return getTopics()
    .map((topic) => ({ ...topic, tools: topic.tools.filter((tool) => !VARIANT_PAGES.includes(tool.id)) }))
    .filter((topic) => topic.tools.length > 0);
}
