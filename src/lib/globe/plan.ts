import { distanceDeg } from './geo';
import { buildFanTimeline } from './fanTimeline';
import { buildTimeline } from './timeline';
import type { Frame, GlobeOptions, Stop } from './types';

/** Seconds the intro card and the end card stay on screen. They are added to the length of the globe part. */
export const INTRO_SECONDS = 2.2;
export const OUTRO_SECONDS = 3;

type PlanOptions = Pick<GlobeOptions, 'motion' | 'seconds' | 'caption' | 'layout'> & Partial<Pick<GlobeOptions, 'introTitle' | 'introSub' | 'outroTitle' | 'outroSub' | 'facts'>> & { photoStops?: boolean[] };

export const hasIntro = (options: Partial<Pick<GlobeOptions, 'introTitle' | 'introSub'>>) => !!(options.introTitle?.trim() || options.introSub?.trim());
export const hasOutro = (options: Partial<Pick<GlobeOptions, 'outroTitle' | 'outroSub' | 'facts'>>) => !!(options.outroTitle?.trim() || options.outroSub?.trim() || options.facts);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The timeline for the chosen layout, with an intro card before it and an end card after it when they have text. */
export function buildPlan(stops: Stop[], options: PlanOptions) {
  const inner = options.layout === 'fan' || options.layout === 'visited' ? buildFanTimeline(stops, options) : buildTimeline(stops, options);
  const intro = hasIntro(options) ? INTRO_SECONDS : 0;
  const outro = hasOutro(options) ? OUTRO_SECONDS : 0;
  if (!intro && !outro) return inner;
  const duration = intro + inner.duration + outro;
  const frameAt = (seconds: number): Frame => {
    const t = Math.min(duration, Math.max(0, seconds));
    const frame = inner.frameAt(Math.min(inner.duration, Math.max(0, t - intro)));
    if (intro && t < intro) {
      const fade = clamp01((intro - t) / (intro * 0.35));
      return { ...frame, card: { which: 'intro', alpha: Math.min(1, fade) } };
    }
    const into = t - intro - inner.duration;
    if (outro && into > 0) return { ...frame, card: { which: 'outro', alpha: clamp01(into / 0.8) } };
    return frame;
  };
  return { duration, frameAt };
}

export type Plan = ReturnType<typeof buildPlan>;

/** Seconds a video needs at least, so that every place can be seen. */
export const minimumSeconds = (layout: GlobeOptions['layout'], stops: number) => (layout === 'chain' ? Math.max(5, 3 * (stops - 1) + 2) : Math.max(6, Math.ceil(stops * 1.2) + 3));

/** Largest number of places for the layout. */
export const maximumStops = (layout: GlobeOptions['layout']) => (layout === 'chain' ? 5 : 12);

const EARTH_KM = 6371;

/** The facts line for the end card: places, countries and, for a trip, the distance. Distances are straight lines over the globe. */
export function tripFacts(stops: Stop[], layout: GlobeOptions['layout'], unit: 'km' | 'mi'): string {
  const parts = [`${stops.length} ${stops.length === 1 ? 'place' : 'places'}`];
  const countries = new Set(stops.map((stop) => stop.countryId).filter(Boolean)).size;
  if (countries > 0) parts.push(`${countries} ${countries === 1 ? 'country' : 'countries'}`);
  if (layout === 'chain' && stops.length > 1) {
    let km = 0;
    for (let i = 1; i < stops.length; i += 1) km += (distanceDeg(stops[i - 1]!, stops[i]!) * Math.PI) / 180 * EARTH_KM;
    const value = unit === 'mi' ? km * 0.621371 : km;
    const rounded = value >= 100 ? Math.round(value / 10) * 10 : Math.round(value);
    parts.push(`${rounded.toLocaleString('en-US')} ${unit}`);
  }
  return parts.join(' · ');
}
