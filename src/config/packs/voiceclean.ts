import voiceclean from '../../locales/packs/voiceclean.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Voice Clean-up (components/tools/voiceclean, logic in src/lib/voiceclean). Runs in the browser. */
export const VOICECLEAN_TOOLS: PackTool[] = [
  definePackTool({
    id: 'voice-noise-remover', kind: 'voiceClean', guideKey: 'voiceCleanGuide', category: 'media', icon: 'minimize', tier: 'popular',
    keywords: ['remove background noise from audio', 'noise remover online free', 'clean voice recording', 'reduce noise in voice note', 'audio noise reduction online', 'remove hiss from audio', 'make voice note louder', 'remove fan noise from recording', 'voice cleaner no watermark', 'even out audio volume', 'cut silence from audio', 'clean up phone recording'],
  }, voiceclean.toolCatalog),
];
