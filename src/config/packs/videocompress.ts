import videocompress from '../../locales/packs/videocompress.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Video Compressor and Trimmer (components/tools/videoedit, logic in src/lib/videoedit). Runs in the browser. */
export const VIDEOCOMPRESS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'video-compressor-and-trimmer', kind: 'videoCompress', guideKey: 'videoCompressGuide', category: 'media', icon: 'minimize', tier: 'popular',
    keywords: ['video compressor', 'compress video for whatsapp', 'reduce video size', 'video trimmer online', 'cut video online free', 'make video smaller', 'compress video to 16 mb', 'shrink video for email', 'trim video no watermark', 'video size reducer', 'compress mp4 online', 'cut and compress video'],
  }, videocompress.toolCatalog),
];
