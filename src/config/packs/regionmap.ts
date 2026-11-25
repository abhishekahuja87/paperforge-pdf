import regionmap from '../../locales/packs/regionmap.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Map Video Maker (components/tools/regionmap, logic in src/lib/regionmap). Runs in the browser. */
export const REGIONMAP_TOOLS: PackTool[] = [
  definePackTool({
    id: 'region-map-video-maker', kind: 'regionMapVideo', guideKey: 'regionMapVideoGuide', category: 'media', icon: 'globe', tier: 'popular',
    keywords: ['map video maker', 'countries i visited video', 'world map animation maker', 'highlight countries on map video', 'travel map video for reels', 'places we deliver to map video', 'text to map video', 'animated world map with voice over', 'light up countries map animation', 'where i have been map video', 'map highlight animation free', 'map video for instagram reels'],
  }, regionmap.toolCatalog),
];
