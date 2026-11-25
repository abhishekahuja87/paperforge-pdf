import photostory from '../../locales/packs/photostory.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Photo Story Video Maker (components/tools/photostory, logic in src/lib/photostory). Runs in the browser. */
export const PHOTOSTORY_TOOLS: PackTool[] = [
  definePackTool({
    id: 'photo-story-video-maker', kind: 'photoStory', guideKey: 'photoStoryGuide', category: 'media', icon: 'presentation', tier: 'popular',
    keywords: ['photo story video maker', 'photos to video with captions', 'slideshow video with voice over', 'photo slideshow for instagram reels', 'trip photo video maker', 'birthday photo video maker', 'ken burns effect maker', 'photo to video with zoom effect', 'product photos video maker', 'before and after photo video', 'event recap video maker', 'photo video maker no watermark'],
  }, photostory.toolCatalog),
];
