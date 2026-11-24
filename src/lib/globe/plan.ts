import { buildFanTimeline } from './fanTimeline';
import { buildTimeline } from './timeline';
import type { GlobeOptions, Stop } from './types';

/** The timeline for the chosen layout. */
export function buildPlan(stops: Stop[], options: Pick<GlobeOptions, 'motion' | 'seconds' | 'caption' | 'layout'> & { photoStops?: boolean[] }) {
  return options.layout === 'fan' || options.layout === 'visited' ? buildFanTimeline(stops, options) : buildTimeline(stops, options);
}

export type Plan = ReturnType<typeof buildPlan>;

/** Seconds a video needs at least, so that every place can be seen. */
export const minimumSeconds = (layout: GlobeOptions['layout'], stops: number) => (layout === 'chain' ? Math.max(5, 3 * (stops - 1) + 2) : Math.max(6, Math.ceil(stops * 1.2) + 3));

/** Largest number of places for the layout. */
export const maximumStops = (layout: GlobeOptions['layout']) => (layout === 'chain' ? 5 : 12);
