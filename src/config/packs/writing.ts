import writing from '../../locales/packs/writing.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Handwriting Video Maker (components/tools/writing, logic in src/lib/writing). Runs in the browser. */
export const WRITING_TOOLS: PackTool[] = [
  definePackTool({
    id: 'handwriting-video-maker', kind: 'writingVideo', guideKey: 'handwritingVideoGuide', category: 'media', icon: 'type', tier: 'popular',
    keywords: ['handwriting video maker', 'write on text animation', 'text writing animation video', 'handwritten text video', 'whiteboard writing animation free', 'chalkboard text animation', 'hand writing effect for reels', 'write on effect no watermark', 'text being written animation', 'explainer video writing text', 'writing animation maker online', 'animated handwriting quote video'],
  }, writing.toolCatalog),
];
