/**
 * The flat world map used by the Region Map Video: every country as outlines in Mercator units, the big cities for pins,
 * and the search that turns a typed name into a country or a city. No drawing happens here.
 */

import { CITY_ALIASES, fixCountryId, normalise, shortName } from '../globe/places';
import type { RawPlaces, RawWorld } from '../globe/world';

/** Left, bottom, right, top in Mercator units (x is the longitude in radians, y grows north). */
export type Box = [number, number, number, number];

export interface Region {
  id: string;
  /** Name shown in the video. */
  name: string;
  /** Centre of the main land. */
  cx: number;
  cy: number;
  /** The main land (islands far away are left out), used to decide how far to zoom. */
  box: Box;
  /** Every outline, for drawing. */
  box2: Box;
  /** Each outline as x, y, x, y, … in Mercator units. */
  rings: Float32Array[];
}

export interface City { name: string; country: string; countryId: string; lon: number; lat: number; rank: number }

export interface Atlas { regions: Region[]; byId: Map<string, Region>; keys: Map<string, string>; cities: City[] }

const RAD = Math.PI / 180;
export const mercX = (lon: number) => lon * RAD;
export const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * RAD) / 2));
export const lonOf = (x: number) => x / RAD;
export const latOf = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / RAD;

/** Other names people type, by the id of the country. */
const PHRASES: Record<string, string[]> = {
  USA: ['usa', 'us', 'u s', 'u s a', 'united states', 'united states of america', 'america'],
  GBR: ['uk', 'u k', 'united kingdom', 'britain', 'great britain', 'england', 'scotland', 'wales', 'northern ireland'],
  ARE: ['uae', 'emirates', 'united arab emirates', 'dubai', 'abu dhabi'],
  COD: ['drc', 'dr congo', 'congo kinshasa', 'democratic republic of the congo', 'democratic republic of congo'],
  COG: ['congo', 'congo brazzaville', 'republic of the congo', 'republic of congo'],
  KOR: ['south korea', 'korea', 'republic of korea'],
  PRK: ['north korea', 'dprk'],
  CZE: ['czech republic', 'czechia'],
  MMR: ['burma', 'myanmar'],
  MKD: ['macedonia', 'north macedonia'],
  RUS: ['russia', 'russian federation'],
  TUR: ['turkey', 'turkiye'],
  CIV: ['ivory coast', 'cote d ivoire'],
  SDS: ['south sudan'],
  GNQ: ['equatorial guinea'],
  BIH: ['bosnia', 'bosnia and herzegovina'],
  CAF: ['central african republic', 'car'],
  DOM: ['dominican republic'],
  NLD: ['netherlands', 'holland', 'the netherlands'],
  SWZ: ['eswatini', 'swaziland'],
  TLS: ['east timor', 'timor leste'],
  CPV: ['cape verde', 'cabo verde'],
  IND: ['india', 'bharat'],
  CHN: ['china', 'peoples republic of china', 'prc'],
  VNM: ['vietnam', 'viet nam'],
  LAO: ['laos'],
  SYR: ['syria'],
  IRN: ['iran'],
  FRO: ['faroe islands', 'faeroe islands'],
  PSX: ['palestine'],
  VAT: ['vatican', 'vatican city', 'holy see'],
  MAC: ['macau', 'macao'],
  FSM: ['micronesia'],
  STP: ['sao tome', 'sao tome and principe'],
  ATG: ['antigua', 'antigua and barbuda'],
  KNA: ['saint kitts', 'st kitts', 'saint kitts and nevis'],
  VCT: ['saint vincent', 'st vincent', 'saint vincent and the grenadines'],
  TTO: ['trinidad', 'trinidad and tobago'],
  PNG: ['png', 'papua new guinea'],
  NZL: ['new zealand', 'nz'],
  ZAF: ['south africa'],
  SAU: ['saudi arabia', 'saudi'],
  LKA: ['sri lanka', 'ceylon'],
};

/** Lower case, no accents, no dots, dashes or a leading "the", so "U.S.A." and "the Netherlands" are found. */
export const mapKey = (text: string) => normalise(text).replace(/[.'’]/g, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').replace(/^the /, '').trim();

const flatten = (flat: number[]): Float32Array => {
  const out: number[] = []; let x = flat[0]!, y = flat[1]!;
  out.push(mercX(x / 100), mercY(y / 100));
  for (let i = 2; i < flat.length; i += 2) { x += flat[i]!; y += flat[i + 1]!; out.push(mercX(x / 100), mercY(y / 100)); }
  return Float32Array.from(out);
};

const boxOf = (ring: Float32Array): Box => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < ring.length; i += 2) { const x = ring[i]!, y = ring[i + 1]!; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
};
const area = (b: Box) => (b[2] - b[0]) * (b[3] - b[1]);
export const union = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];

export function buildAtlas(raw: RawWorld, places: RawPlaces): Atlas {
  const regions: Region[] = []; const byId = new Map<string, Region>(); const keys = new Map<string, string>();
  for (const [full, id, , , , rawRings] of raw.c) {
    if (id === 'ATA') continue; // the pole does not fit a flat map
    const rings = rawRings.map(flatten); const boxes = rings.map(boxOf);
    let big = 0; boxes.forEach((b, k) => { if (area(b) > area(boxes[big]!)) big = k; });
    const bigBox = boxes[big]!; const mid = [(bigBox[0] + bigBox[2]) / 2, (bigBox[1] + bigBox[3]) / 2];
    // The main land: the biggest outline and the sizeable ones near it. French Guiana or Alaska do not pull the camera away.
    let main: Box = bigBox; let all: Box = bigBox;
    boxes.forEach((b, k) => {
      all = union(all, b);
      if (k === big) return;
      const near = Math.abs((b[0] + b[2]) / 2 - mid[0]!) < 0.7 && Math.abs((b[1] + b[3]) / 2 - mid[1]!) < 0.7;
      if (near && area(b) >= area(bigBox) * 0.03) main = union(main, b);
    });
    const region: Region = { id, name: shortName(full), cx: (main[0] + main[2]) / 2, cy: (main[1] + main[3]) / 2, box: main, box2: all, rings };
    regions.push(region); byId.set(id, region);
    const add = (text: string) => { const key = mapKey(text); if (key && !keys.has(key)) keys.set(key, id); };
    add(shortName(full)); add(full); (PHRASES[id] ?? []).forEach(add);
  }
  const cities: City[] = places.map(([name, country, lat, lon, rank, id]) => ({ name, country, countryId: fixCountryId(id), lon: lon / 100, lat: lat / 100, rank }));
  return { regions, byId, keys, cities };
}

/** The country a typed name means, or null. A name that starts the same way as only one country also counts ("Switz" is Switzerland). */
export function findRegion(atlas: Atlas, text: string): Region | null {
  const key = mapKey(text); if (!key) return null;
  const exact = atlas.keys.get(key); if (exact) return atlas.byId.get(exact) ?? null;
  if (key.length < 3) return null;
  const ids = new Set<string>(); for (const [name, id] of atlas.keys) if (name.startsWith(key)) ids.add(id);
  return ids.size === 1 ? atlas.byId.get([...ids][0]!) ?? null : null;
}

/** A city from the list of big cities. "Paris" or "Paris, France" (the country picks between cities of the same name). */
export function findCity(atlas: Atlas, text: string): City | null {
  const parts = text.split(',').map((part) => part.trim()).filter(Boolean); if (parts.length === 0) return null;
  const country = parts.length > 1 ? findRegion(atlas, parts[parts.length - 1]!) : null;
  const name = mapKey((country ? parts.slice(0, -1) : parts).join(' '));
  let best: City | null = null;
  for (const city of atlas.cities) {
    if (country && city.countryId !== country.id) continue;
    const norm = mapKey(city.name); const other = ` ${mapKey(CITY_ALIASES[normalise(city.name)] ?? '')} `;
    if (norm === name || (name.length >= 4 && other.includes(` ${name} `))) { if (!best || city.rank < best.rank) best = city; }
  }
  return best;
}
