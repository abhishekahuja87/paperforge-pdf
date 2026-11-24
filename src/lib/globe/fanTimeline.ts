import { angleBetween, clamp, easeInOut, fromVec, lerp, slerp, toVec, type Vec } from './geo';
import { stopZoom } from './timeline';
import type { Frame, GlobeOptions, Stop } from './types';

/**
 * Timelines for the two layouts that are not a single trip.
 * fan:     the camera starts on the origin, pulls back to show every place, and an arc grows from the origin to each place in turn.
 * visited: no routes; the camera shows every place and the pins come up one after another.
 */
export function buildFanTimeline(stops: Stop[], options: Pick<GlobeOptions, 'seconds' | 'caption' | 'layout'>) {
  const total = Math.max(3, options.seconds);
  const fan = options.layout === 'fan';
  const n = stops.length;
  const hops = fan ? Math.max(0, n - 1) : 0;
  const vecs: Vec[] = stops.map((stop) => toVec(stop.lon, stop.lat));

  // A view that fits every place: centred between them, close enough to fill the picture.
  const sum: Vec = vecs.reduce<Vec>((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0]);
  const length = Math.hypot(sum[0], sum[1], sum[2]);
  const middle: Vec = length > 0.05 ? [sum[0] / length, sum[1] / length, sum[2] / length] : vecs[0]!;
  const widest = vecs.reduce((m, v) => Math.max(m, angleBetween(middle, v)), 0) * (180 / Math.PI);
  const fitZoom = clamp(0.775 / Math.sin((Math.min(180, widest * 2 + 16) * Math.PI) / 360), 1, 5.5);
  const startZoom = stopZoom(stops[0]!);

  const intro = fan ? total * 0.16 : 0;
  const pull = fan ? total * 0.2 : 0;
  const slots = fan ? Math.max(1, hops) : n;
  // Fan: arcs start one after another, each takes a share of the time and they overlap a little.
  const arcStart = intro + total * 0.06;
  const arcWindow = total * 0.62;
  const arcLength = arcWindow * (hops > 1 ? 0.4 : 0.9);
  const arcAt = (i: number) => arcStart + (hops > 1 ? ((arcWindow - arcLength) * i) / (hops - 1) : 0);
  // Visited: pins come up between 10% and 84% of the video.
  const pinAt = (i: number) => (fan ? (i === 0 ? 0.15 : arcAt(i - 1) + arcLength * 0.92) : total * 0.1 + (total * 0.74 * i) / slots);

  const frameAt = (seconds: number): Frame => {
    const t = clamp(seconds, 0, total);
    const routes = Array.from({ length: hops }, (_, i) => easeInOut(clamp((t - arcAt(i)) / arcLength, 0, 1)));
    const popIn = (since: number) => clamp((t - since) / 0.5, 0, 1);
    const pins = stops.map((_, i) => popIn(pinAt(i)));
    const glow = stops.map((_, i) => popIn(pinAt(i) - 0.15));
    const photos = stops.map((_, i) => {
      const arrive = pinAt(i) + (fan && i === 0 ? 0.1 : 0);
      const leave = fan ? (i === 0 ? intro : arrive + 1.4) : i < n - 1 ? pinAt(i + 1) : arrive + 1.6;
      return clamp((t - arrive) / 0.5, 0, 1) * clamp(1 - (t - leave) / 0.4, 0, 1);
    });
    const heads = routes.map((r, i) => ({ hop: i, t: r })).filter((h) => h.t > 0.001 && h.t < 0.999);

    let center: Vec = middle, zoom = fitZoom;
    if (fan) {
      const k = easeInOut(clamp((t - intro) / pull, 0, 1));
      center = slerp(vecs[0]!, middle, k);
      zoom = Math.exp(lerp(Math.log(startZoom), Math.log(fitZoom), k));
    } else zoom = lerp(fitZoom * 0.88, fitZoom, easeInOut(clamp(t / (total * 0.25), 0, 1)));
    // A slow turn after the pull-back shows places on the far side and keeps the picture alive.
    const ll = fromVec(center);
    const turn = fan ? clamp((t - intro - pull) / Math.max(1, total - intro - pull), 0, 1) * 55 : clamp(t / total, 0, 1) * 40;
    const spun = toVec(ll.lon + turn, ll.lat);
    const out = fromVec(spun);
    const caption = options.caption ? clamp(t / 0.7, 0, 1) * clamp((total - t) / 0.5 + 0.0001, 0, 1) : 0;
    return { lon: out.lon, lat: out.lat, zoom, routes, pins, glow, photos, heads, caption: caption, time: t };
  };

  return { duration: total, frameAt };
}

