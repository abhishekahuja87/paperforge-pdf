import speakcaptions from '../../locales/packs/speakcaptions.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Speak-to-Captions Video Maker (components/tools/captions, speech in src/lib/speech). Runs in the browser; the browser's own speech service turns speech into words. */
export const SPEAKCAPTIONS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'speak-to-captions-video-maker', kind: 'speakCaptions', guideKey: 'speakCaptionsGuide', category: 'media', icon: 'type', tier: 'popular',
    keywords: ['speech to captions video', 'auto captions free', 'voice to subtitles maker', 'talk and get captions', 'hindi auto captions', 'speech to text srt', 'auto subtitles for reels', 'captions from voice online', 'voice to text video maker', 'auto caption generator no watermark', 'speak to subtitle file', 'tamil telugu auto captions'],
  }, speakcaptions.toolCatalog),
];
