import globe from '../../locales/packs/globe.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Globe Video Maker (components/tools/globe, logic in src/lib/globe, map data in src/data/globe). Runs in the browser. */
export const GLOBE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'globe-video-maker', kind: 'globeVideo', guideKey: 'globeVideoMakerGuide', category: 'media', icon: 'globe', tier: 'popular',
    keywords: ['globe video maker', 'globe animation maker', 'travel route video', 'flight path animation', 'earth zoom animation', 'map animation a to b', 'globe flying from one country to another', 'world globe video free', 'travel map video for reels', 'animated globe no watermark', 'route animation maker', 'country to country globe video'],
  }, globe.toolCatalog),
];
