/**
 * The how-to guides that belong on a collection page: every guide (src/content/guides.ts) with at least one tool that
 * is listed in the collection. Plain data, so the build-time page generator (src/prerender/shellData.ts) can use it too.
 */
import { COLLECTIONS } from '../config/homeSections';
import { GUIDES, type Guide } from './guides';
import type { Hub } from './hubs';

export const hubGuides = (hub: Hub, limit = 6): Guide[] => {
  const ids = new Set(COLLECTIONS.find((collection) => collection.id === hub.collection)?.tools ?? []);
  return GUIDES.filter((guide) => guide.tools.some((id) => ids.has(id))).slice(0, limit);
};
