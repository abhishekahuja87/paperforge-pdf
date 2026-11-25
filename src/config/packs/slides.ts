import slides from '../../locales/packs/slides.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Explainer Video Maker (components/tools/slides, logic in src/lib/slides). Runs in the browser. */
export const SLIDES_TOOLS: PackTool[] = [
  definePackTool({
    id: 'explainer-video-maker', kind: 'slidesVideo', guideKey: 'explainerVideoGuide', category: 'media', icon: 'presentation', tier: 'popular',
    keywords: ['explainer video maker', 'text to explainer video', 'animated slides video maker', 'ppt style video maker free', 'slide animation to video', 'whiteboard style explainer video', 'arrow and text animation video', 'explainer video with voice over', 'how it works video maker', 'text left right arrow animation', 'build up slides video', 'simple explainer video for reels'],
  }, slides.toolCatalog),
];
