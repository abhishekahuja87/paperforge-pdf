import beforeafter from '../../locales/packs/beforeafter.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Before and After Video Maker (components/tools/beforeafter, logic in src/lib/beforeafter). Runs in the browser. */
export const BEFOREAFTER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'before-and-after-video-maker', kind: 'beforeAfter', guideKey: 'beforeAfterGuide', category: 'media', icon: 'image', tier: 'popular',
    keywords: ['before and after video maker', 'before after reveal video', 'before and after video for instagram reel', 'before after slider video', 'transformation video maker', 'before and after photo video free', 'salon before and after video', 'room makeover before after video', 'before after video no watermark', 'fitness progress video maker', 'repair before after reveal', 'before and after reel maker'],
  }, beforeafter.toolCatalog),
];
