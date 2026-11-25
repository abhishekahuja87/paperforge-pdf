import subtitleburn from '../../locales/packs/subtitleburn.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Subtitles Burner (components/tools/videoedit, logic in src/lib/captions/burn.ts and src/lib/videoedit). Runs in the browser. */
export const SUBTITLEBURN_TOOLS: PackTool[] = [
  definePackTool({
    id: 'burn-subtitles-into-video', kind: 'subtitleBurn', guideKey: 'subtitleBurnGuide', category: 'media', icon: 'type', tier: 'popular',
    keywords: ['add subtitles to video', 'burn subtitles into video', 'hardcode subtitles online', 'srt to video', 'add srt to video online free', 'captions on video no watermark', 'open captions maker', 'add vtt subtitles to video', 'put subtitles on video', 'subtitle burner online', 'hardsub video online', 'captions on reel'],
  }, subtitleburn.toolCatalog),
];
