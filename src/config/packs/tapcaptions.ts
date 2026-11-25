import tapcaptions from '../../locales/packs/tapcaptions.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Tap-to-Time Captions tool (components/tools/captions, logic in src/lib/captions). Runs in the browser. */
export const TAPCAPTIONS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'tap-to-time-captions', kind: 'tapCaptions', guideKey: 'tapCaptionsGuide', category: 'media', icon: 'type', tier: 'popular',
    keywords: ['srt subtitle maker', 'tap to time captions', 'make srt file online', 'subtitle timing tool', 'captions for reels without ai', 'hindi subtitles srt', 'lyrics timing tool', 'webvtt maker', 'sync subtitles to audio', 'caption video maker', 'subtitles for capcut', 'manual caption timing'],
  }, tapcaptions.toolCatalog),
];
