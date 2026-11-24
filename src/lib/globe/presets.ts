import type { GlobeOptions, ShapeId } from './types';

/**
 * Ready-made starting points. Each one sets the layout, shape, look and places in one tap; the person can change anything afterwards.
 * The six purpose pages (src/config/globePages.ts) open the tool with one of these. The wording for the buttons is in globe.ui.en.json (presets).
 */
export interface GlobePreset {
  id: string;
  /** Names of the places, as typed in the place search. */
  stops: string[];
  shape: ShapeId;
  /** Only what differs from the tool's usual settings. */
  options: Partial<GlobeOptions>;
}

export const GLOBE_PRESETS: GlobePreset[] = [
  { id: 'travel', stops: ['Delhi', 'Bangkok', 'Tokyo'], shape: 'reel', options: { layout: 'chain', styleId: 'earth', motion: 'fly', line: 'glow', mover: 'plane', arc: 'lifted', distance: 'km', labels: true, seconds: 12, caption: 'My trip' } },
  { id: 'flight', stops: ['Mumbai', 'London'], shape: 'reel', options: { layout: 'chain', styleId: 'midnight', motion: 'fly', line: 'glow', mover: 'plane', arc: 'lifted', distance: 'km', night: true, seconds: 10 } },
  { id: 'moving', stops: ['India', 'Canada'], shape: 'reel', options: { layout: 'chain', styleId: 'daylight', motion: 'fly', line: 'solid', mover: 'plane', arc: 'lifted', highlight: true, seconds: 10, caption: 'We are moving!' } },
  { id: 'export', stops: ['India', 'United States', 'Germany', 'UAE', 'Singapore', 'Australia', 'Japan'], shape: 'wide', options: { layout: 'fan', styleId: 'midnight', line: 'glow', mover: 'dot', arc: 'lifted', highlight: true, labels: true, seconds: 14, caption: 'Where we ship' } },
  { id: 'intro', stops: ['India', 'United States'], shape: 'wide', options: { layout: 'chain', styleId: 'neon', motion: 'spin', line: 'glow', mover: 'dot', arc: 'lifted', labels: false, seconds: 8, caption: 'Welcome to my channel' } },
  { id: 'visited', stops: ['India', 'Thailand', 'France', 'Japan', 'Italy', 'Egypt', 'Canada'], shape: 'reel', options: { layout: 'visited', styleId: 'earth', highlight: true, labels: true, seconds: 14, caption: 'Countries I have visited' } },
];

export const presetById = (id: string) => GLOBE_PRESETS.find((preset) => preset.id === id);
