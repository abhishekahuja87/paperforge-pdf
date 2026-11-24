import { angleBetween, clamp, easeInOut, fromVec, lerp, slerp, smoothstep, toVec, type Vec } from './geo';
import type { Frame, GlobeOptions, Stop } from './types';

/** Zoom that shows a stop at a good size. 1 is the whole globe. */
export function stopZoom(stop: Stop): number {
  if (stop.kind === 'country' && stop.span) {
    // Fit the country to about two thirds of the shorter side of the picture. The globe is drawn with a radius of 0.4 of that side at zoom 1.
    const fit = 0.775 / Math.sin((Math.min(Math.max(stop.span, 0.2), 140) * Math.PI) / 360);
    return clamp(fit, 1.15, 7);
  }
  return stop.kind === 'city' ? 6.5 : 5;
}

interface Phase { start: number; end: number; kind: 'hold' | 'travel'; index: number }

/** Plans the video: a hold on the first stop, a move to each next stop, and a hold at the end. Returns a function that gives the picture at any time. */
export function buildTimeline(stops: Stop[], options: Pick<GlobeOptions, 'motion' | 'seconds' | 'caption'>) {
  const total = Math.max(2, options.seconds);
  const hops = Math.max(0, stops.length - 1);
  const vecs: Vec[] = stops.map((stop) => toVec(stop.lon, stop.lat));
  const zooms = stops.map((stop) => stopZoom(stop));
  const dist = (i: number) => angleBetween(vecs[i], vecs[i + 1]) * 180 / Math.PI;

  const firstHold = total * 0.14, lastHold = total * 0.2, midHold = total * 0.07;
  const travelBudget = Math.max(total * 0.3, total - firstHold - lastHold - midHold * Math.max(0, hops - 1));
  const weights = Array.from({ length: hops }, (_, i) => 12 + dist(i));
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

  const phases: Phase[] = [];
  let at = 0;
  phases.push({ start: at, end: at + firstHold, kind: 'hold', index: 0 }); at += firstHold;
  for (let i = 0; i < hops; i++) {
    const length = (travelBudget * weights[i]) / weightSum;
    phases.push({ start: at, end: at + length, kind: 'travel', index: i }); at += length;
    const hold = i === hops - 1 ? lastHold : midHold;
    phases.push({ start: at, end: at + hold, kind: 'hold', index: i + 1 }); at += hold;
  }
  const duration = at;

  const frameAt = (seconds: number): Frame => {
    const t = clamp(seconds, 0, duration);
    const phase = phases.find((p) => t <= p.end) ?? phases[phases.length - 1];
    const local = clamp((t - phase.start) / Math.max(1e-6, phase.end - phase.start), 0, 1);
    const routes = Array.from({ length: hops }, () => 0);
    const pins = stops.map(() => 0);
    const glow = stops.map(() => 0);
    const popIn = (since: number) => clamp((t - since) / 0.5, 0, 1);

    // Where each stop is first reached
    const reachedAt = [0, ...phases.filter((p) => p.kind === 'travel').map((p) => p.end)];
    stops.forEach((_, i) => { pins[i] = i === 0 ? popIn(0.15) : popIn(reachedAt[i] ?? duration); glow[i] = i === 0 ? clamp(t / 0.8, 0, 1) : popIn((reachedAt[i] ?? duration) - 0.2); });

    let center: Vec = vecs[0];
    let zoom = zooms[0];
    let head: Frame['head'] = null;
    const farZoom = (i: number) => {
      const d = dist(i);
      const wide = smoothstep(4, 70, d);
      return lerp(Math.min(zooms[i], zooms[i + 1]), 1.12, wide);
    };

    for (let i = 0; i < hops; i++) {
      const phaseStart = phases.find((p) => p.kind === 'travel' && p.index === i)!;
      if (t >= phaseStart.end) routes[i] = 1;
    }

    if (phase.kind === 'hold') {
      center = vecs[phase.index];
      zoom = zooms[phase.index];
      if (options.motion === 'zoom') {
        // Whole globe all the way, then closer at the last stop
        const lastIdx = stops.length - 1;
        if (phase.index === lastIdx) zoom = lerp(1.25, zooms[lastIdx], easeInOut(local * 1.6));
        else zoom = 1.25;
      } else if (options.motion === 'spin') zoom = 1.3;
      // A slow drift keeps the hold from looking frozen
      const drift = (local - 0.5) * 0.4 * Math.PI / 180;
      const ll = fromVec(center);
      center = toVec(ll.lon + drift * 6, ll.lat);
      if (phase.index === 0 && options.motion === 'fly') zoom = lerp(zooms[0] * 0.92, zooms[0], easeInOut(local));
    } else {
      const i = phase.index;
      const e = easeInOut(local);
      const a = vecs[i], b = vecs[i + 1];
      center = slerp(a, b, e);
      const startZoom = options.motion === 'fly' ? zooms[i] : options.motion === 'spin' ? 1.3 : 1.25;
      const endZoom = options.motion === 'fly' ? zooms[i + 1] : options.motion === 'spin' ? 1.3 : 1.25;
      if (options.motion === 'fly') {
        const base = Math.exp(lerp(Math.log(startZoom), Math.log(endZoom), e));
        const far = farZoom(i);
        const pull = Math.sin(Math.PI * clamp(local * 1.0, 0, 1)) ** 0.7;
        zoom = Math.exp(lerp(Math.log(base), Math.log(Math.min(base, far)), pull));
      } else zoom = lerp(startZoom, endZoom, e);
      // The route runs a little ahead of the camera
      const r = smoothstep(0, 0.92, local);
      routes[i] = r;
      head = { hop: i, t: r };
    }
    const ll = fromVec(center);
    const captionIn = options.caption ? clamp(t / 0.7, 0, 1) * clamp((duration - t) / 0.5 + 0.0001, 0, 1) : 0;
    return { lon: ll.lon, lat: ll.lat, zoom, routes, pins, glow, head, caption: captionIn, time: t };
  };

  return { duration, frameAt };
}

export type Timeline = ReturnType<typeof buildTimeline>;
