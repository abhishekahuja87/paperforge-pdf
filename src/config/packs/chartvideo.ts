import chartvideo from '../../locales/packs/chartvideo.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Chart Reveal Video Maker (components/tools/chartvideo, logic in src/lib/chartvideo). Runs in the browser. */
export const CHARTVIDEO_TOOLS: PackTool[] = [
  definePackTool({
    id: 'chart-reveal-video-maker', kind: 'chartVideo', guideKey: 'chartVideoGuide', category: 'media', icon: 'presentation', tier: 'popular',
    keywords: ['chart video maker', 'animated bar chart video', 'bar chart race maker', 'animated pie chart video', 'line graph animation maker', 'data to video for reels', 'sales growth video maker', 'text to chart animation', 'animated chart with voice over', 'donut chart animation free', 'chart reveal animation', 'numbers to video for instagram'],
  }, chartvideo.toolCatalog),
];
