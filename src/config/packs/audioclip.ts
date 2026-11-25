import audioclip from '../../locales/packs/audioclip.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Audio Clip Video Maker (components/tools/audioclip, logic in src/lib/audioclip). Runs in the browser. */
export const AUDIOCLIP_TOOLS: PackTool[] = [
  definePackTool({
    id: 'audio-clip-video-maker', kind: 'audioClip', guideKey: 'audioClipGuide', category: 'media', icon: 'presentation', tier: 'popular',
    keywords: ['audio to video converter', 'audiogram maker', 'podcast clip video maker', 'mp3 to video with waveform', 'voice note to video', 'sound bars video maker', 'audio visualizer free', 'song snippet video for instagram', 'turn audio into reel', 'audio waveform video no watermark', 'poem reading video maker', 'audio with cover picture video'],
  }, audioclip.toolCatalog),
];
