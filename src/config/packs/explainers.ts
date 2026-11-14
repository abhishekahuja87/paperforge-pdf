import explainers from '../../locales/packs/explainers.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Visual explainers built on open data. Each one runs in the browser and nothing is uploaded. */
export const EXPLAINER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'solar-system-explorer', kind: 'solarSystem', guideKey: 'explainersSolarSystem', category: 'everyday', icon: 'globe', tier: 'popular', shareable: true,
    keywords: ['age on other planets', 'my age on mars', 'weight on mars', 'weight on the moon', 'weight on jupiter', 'planet size comparison', 'solar system to scale', 'compare planets', 'planet facts', 'how old am i on mercury', 'planet year length', 'solar system explorer'],
  }, explainers.toolCatalog),
  definePackTool({
    id: 'learn-the-clock', kind: 'learnClock', guideKey: 'explainersLearnClock', category: 'everyday', icon: 'clock', tier: 'popular',
    keywords: ['learn the clock', 'learn to tell time', 'clock for kids', 'analog clock for kids', 'teach kids time', 'telling time worksheet', 'clock worksheet printable', 'read the clock quiz', 'set the clock game', 'half past quarter past', 'o clock for kids', 'interactive clock'],
  }, explainers.toolCatalog),
];
