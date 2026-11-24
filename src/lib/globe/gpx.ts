/**
 * Reads a GPX file (a route or track from a phone, a watch or a map app) and picks a few places along it for the globe.
 * Only the first and last point and a few evenly spaced points between them are kept, so the video shows the trip, not every metre.
 */
import { distanceDeg } from './geo';
import type { PlaceEntry } from './places';
import { stopFromCoordinates, stopFromPlace } from './places';
import type { Stop } from './types';

export interface GpxPoint { lat: number; lon: number }

const EARTH_KM = 6371;
const kmBetween = (a: GpxPoint, b: GpxPoint) => (distanceDeg(a, b) * Math.PI) / 180 * EARTH_KM;

/** Points of the file in order. Uses the track, else the route, else the waypoints. Returns [] when the text is not a usable GPX file. */
export function parseGpx(text: string): GpxPoint[] {
  let doc: Document;
  try { doc = new DOMParser().parseFromString(text, 'application/xml'); } catch { return []; }
  if (doc.getElementsByTagName('parsererror').length > 0) return [];
  for (const tag of ['trkpt', 'rtept', 'wpt']) {
    const found: GpxPoint[] = [];
    for (const node of Array.from(doc.getElementsByTagName(tag))) {
      const lat = Number(node.getAttribute('lat')), lon = Number(node.getAttribute('lon'));
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) found.push({ lat, lon });
    }
    if (found.length >= 2) return found;
  }
  return [];
}

/** Length of the whole path in kilometres. */
export function pathKm(points: GpxPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += kmBetween(points[i - 1]!, points[i]!);
  return total;
}

/** How many places to keep: 2 for a short trip, 3 for a medium one, 5 for a long one. */
export const placeCount = (km: number) => (km < 20 ? 2 : km < 100 ? 3 : 5);

/** The first point, the last point and evenly spaced points by distance along the path between them. */
export function samplePoints(points: GpxPoint[], count: number): GpxPoint[] {
  if (points.length <= count) return points.slice();
  const total = pathKm(points);
  if (total <= 0) return [points[0]!, points[points.length - 1]!];
  const out: GpxPoint[] = [points[0]!];
  let walked = 0, next = 1;
  for (let i = 1; i < points.length && next < count - 1; i += 1) {
    walked += kmBetween(points[i - 1]!, points[i]!);
    if (walked >= (total * next) / (count - 1)) { out.push(points[i]!); next += 1; }
  }
  out.push(points[points.length - 1]!);
  return out;
}

/** Turn sampled points into stops, named after a known city when one is within 60 km, otherwise by coordinates. */
export function stopsFromPoints(points: GpxPoint[], cities: PlaceEntry[]): Stop[] {
  const towns = cities.filter((place) => place.kind === 'city');
  return points.map((point) => {
    let best: PlaceEntry | null = null, bestKm = 60;
    for (const town of towns) {
      if (Math.abs(town.lat - point.lat) > 1) continue;
      const km = kmBetween(point, town);
      if (km < bestKm) { best = town; bestKm = km; }
    }
    return best ? stopFromPlace(best) : stopFromCoordinates(point.lat, point.lon);
  });
}
