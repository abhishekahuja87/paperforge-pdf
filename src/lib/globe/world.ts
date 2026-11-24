import { capRadius, toVec, type Vec } from './geo';

/** Shape of src/data/globe/world.json, made by scripts/build-globe-data.py. */
export interface RawWorld { c: [string, string, number, number, number, number[][]][]; m: string; mw: number; mh: number }
/** Shape of src/data/globe/places.json: name, country, latitude and longitude in hundredths of a degree, and 0 (capital), 1 (over a million people) or 2. */
export type RawPlaces = [string, string, number, number, number][];

export interface Ring {
  /** x, y, z of every point on the unit sphere, one after another. */
  vec: Float32Array;
  count: number;
  center: Vec;
  /** Angle in radians from the center to the farthest point. */
  radius: number;
}

export interface Country { name: string; id: string; lon: number; lat: number; span: number; rings: Ring[] }

export interface World {
  countries: Country[];
  /** One entry per half degree cell, 1 for land. Rows run from north to south. */
  mask: Uint8Array;
  maskCols: number;
  maskRows: number;
}

/** Longest step between two points before extra points are put between them, in degrees. Edges are straight in longitude and latitude, as in the source data. */
const MAX_STEP = 1.2;

function decodeRing(flat: number[]): Ring {
  const lons: number[] = [], lats: number[] = [];
  let x = flat[0], y = flat[1];
  lons.push(x / 100); lats.push(y / 100);
  for (let i = 2; i < flat.length; i += 2) {
    const nx = x + flat[i], ny = y + flat[i + 1];
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(nx - x), Math.abs(ny - y)) / 100 / MAX_STEP));
    for (let s = 1; s <= steps; s++) { lons.push((x + ((nx - x) * s) / steps) / 100); lats.push((y + ((ny - y) * s) / steps) / 100); }
    x = nx; y = ny;
  }
  const count = lons.length;
  const vec = new Float32Array(count * 3);
  const points: Vec[] = [];
  let sx = 0, sy = 0, sz = 0;
  for (let i = 0; i < count; i++) {
    const v = toVec(lons[i], lats[i]);
    vec[i * 3] = v[0]; vec[i * 3 + 1] = v[1]; vec[i * 3 + 2] = v[2];
    sx += v[0]; sy += v[1]; sz += v[2];
    if (i % 4 === 0) points.push(v);
  }
  const length = Math.hypot(sx, sy, sz);
  const center: Vec = length > 1e-6 ? [sx / length, sy / length, sz / length] : points[0];
  return { vec, count, center, radius: capRadius(center, points) + 0.002 };
}

export function decodeWorld(raw: RawWorld): World {
  const countries = raw.c.map(([name, id, lon, lat, span, rings]) => ({ name, id, lon, lat, span, rings: rings.map(decodeRing) }));
  const bytes = Uint8Array.from(atob(raw.m), (ch) => ch.charCodeAt(0));
  const mask = new Uint8Array(raw.mw * raw.mh);
  for (let i = 0; i < mask.length; i++) mask[i] = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
  return { countries, mask, maskCols: raw.mw, maskRows: raw.mh };
}
