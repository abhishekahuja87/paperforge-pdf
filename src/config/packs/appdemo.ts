import appdemo from '../../locales/packs/appdemo.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The App and Website Demo Video Maker (components/tools/appdemo, logic in src/lib/appdemo). Runs in the browser. */
export const APPDEMO_TOOLS: PackTool[] = [
  definePackTool({
    id: 'app-demo-video-maker', kind: 'appDemo', guideKey: 'appDemoGuide', category: 'media', icon: 'presentation', tier: 'popular',
    keywords: ['app demo video maker', 'screenshots to video', 'website demo video without screen recording', 'phone mockup video maker', 'app promo video free', 'screenshot to phone frame video', 'laptop mockup video', 'product demo video for shop', 'tutorial video from screenshots', 'tap animation video maker', 'blur private details in demo video', 'app walkthrough video'],
  }, appdemo.toolCatalog),
];
