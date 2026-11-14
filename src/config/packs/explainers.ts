import explainers from '../../locales/packs/explainers.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Visual explainers built on open data. Each one runs in the browser and nothing is uploaded. */
export const EXPLAINER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'solar-system-explorer', kind: 'solarSystem', guideKey: 'explainersSolarSystem', category: 'everyday', icon: 'globe', tier: 'popular',
    keywords: ['age on other planets', 'my age on mars', 'weight on mars', 'weight on the moon', 'weight on jupiter', 'planet size comparison', 'solar system to scale', 'compare planets', 'planet facts', 'how old am i on mercury', 'planet year length', 'solar system explorer'],
  }, explainers.toolCatalog),
  definePackTool({
    id: 'learn-the-clock', kind: 'learnClock', guideKey: 'explainersLearnClock', category: 'everyday', icon: 'clock', tier: 'popular',
    keywords: ['learn the clock', 'learn to tell time', 'clock for kids', 'analog clock for kids', 'teach kids time', 'telling time worksheet', 'clock worksheet printable', 'read the clock quiz', 'set the clock game', 'half past quarter past', 'o clock for kids', 'interactive clock'],
  }, explainers.toolCatalog),
  definePackTool({
    id: 'kids-maths-practice', kind: 'kidsMaths', guideKey: 'explainersKidsMaths', category: 'everyday', icon: 'calculator', tier: 'popular',
    keywords: ['kids maths practice', 'maths worksheet for kids', 'addition worksheet', 'subtraction worksheet', 'multiplication tables practice', 'times tables quiz', 'money word problems class 2', 'rupees word problems', 'maths quiz for class 1 2 3', 'printable maths worksheet', 'division practice for kids', 'maths practice online free'],
  }, explainers.toolCatalog),
];
