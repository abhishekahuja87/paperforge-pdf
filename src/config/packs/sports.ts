import sports from '../../locales/packs/sports.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Sports and games. Each tool runs in the browser and nothing is uploaded. */
export const SPORTS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'sports-court-size-guide', kind: 'courtGuide', guideKey: 'sportsCourtGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['badminton court size', 'tennis court dimensions', 'pickleball court size', 'cricket pitch length', 'football pitch size', 'basketball court size', 'volleyball court size', 'kabaddi court size', 'sports court dimensions', 'fit court in my space'],
  }, sports.toolCatalog),
];
