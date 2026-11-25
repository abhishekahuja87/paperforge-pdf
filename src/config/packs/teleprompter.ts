import teleprompter from '../../locales/packs/teleprompter.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Teleprompter with Video Recording (components/tools/teleprompter, logic in src/lib/teleprompter). Runs in the browser. */
export const TELEPROMPTER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'teleprompter-with-video-recording', kind: 'teleprompter', guideKey: 'teleprompterGuide', category: 'media', icon: 'type', tier: 'popular',
    keywords: ['teleprompter online free', 'teleprompter app for phone', 'teleprompter with video recording', 'free teleprompter no watermark', 'script scroller for video', 'record video while reading script', 'teleprompter for youtube videos', 'teleprompter for sellers and teachers', 'online prompter with camera', 'auto scroll script for video', 'teleprompter hindi', 'video script reader'],
  }, teleprompter.toolCatalog),
];
