import type { RawPlaces, World } from './world';
import type { Stop } from './types';

export interface PlaceEntry {
  name: string;
  /** Country the place is in (for a country, empty). */
  sub: string;
  lon: number;
  lat: number;
  kind: 'country' | 'city';
  countryId?: string;
  span?: number;
  /** Lower comes first when matches are equal: countries and capitals, then big cities. */
  rank: number;
  /** Lower case words to match, with accents removed, including other names people use. */
  search: string;
  /** Name with accents removed and lower case, for matching what was typed. */
  norm: string;
}

/** Lower case and no accents, so "Zürich" is found by "zurich" and "Pūnch" by "punch". */
export const normalise = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Older and other names for cities, by the name on the map (without accents). Typing the old name finds the city. */
export const CITY_ALIASES: Record<string, string> = {
  bengaluru: 'bangalore', mumbai: 'bombay', kolkata: 'calcutta', chennai: 'madras', pune: 'poona', thiruvananthapuram: 'trivandrum', kochi: 'cochin ernakulam',
  vadodara: 'baroda', mysuru: 'mysore', gurugram: 'gurgaon', gurgaon: 'gurugram', prayagraj: 'allahabad', allahabad: 'prayagraj', varanasi: 'benares banaras kashi',
  visakhapatnam: 'vizag vishakhapatnam waltair', kozhikode: 'calicut', puducherry: 'pondicherry', mangaluru: 'mangalore', belagavi: 'belgaum', belgaum: 'belagavi',
  shimla: 'simla', guwahati: 'gauhati', thanjavur: 'tanjore', hubballi: 'hubli', 'hubli-dharwad': 'hubli dharwad', tiruchirappalli: 'trichy trichinopoly', kanpur: 'cawnpore',
  udhagamandalam: 'ooty ootacamund', ujjain: 'ujain', kalaburagi: 'gulbarga', vijayapura: 'bijapur', shivamogga: 'shimoga', tumakuru: 'tumkur', ballari: 'bellary',
  'delhi': 'new delhi nct', 'new delhi': 'delhi', thrissur: 'trichur', alappuzha: 'alleppey', kollam: 'quilon', palakkad: 'palghat', kannur: 'cannanore',
  bhubaneswar: 'bhubaneshwar', ahmedabad: 'amdavad', jabalpur: 'jubbulpore',  nashik: 'nasik', 'chhatrapati sambhajinagar': 'aurangabad',
  'ho chi minh city': 'saigon', yangon: 'rangoon', istanbul: 'constantinople', beijing: 'peking', kyiv: 'kiev', dhaka: 'dacca', 'mexico city': 'ciudad de mexico cdmx',
  'new york': 'nyc new york city', 'los angeles': 'la', 'washington, d.c.': 'washington dc', 'san francisco': 'sf frisco', 'kuala lumpur': 'kl', 'saint petersburg': 'st petersburg leningrad',
  chongqing: 'chungking', guangzhou: 'canton', colombo: 'sri jayawardenepura', 'phnom penh': 'pnom penh', 'ulaanbaatar': 'ulan bator', 'kathmandu': 'katmandu',
  gdansk: 'danzig', wroclaw: 'breslau', kaliningrad: 'konigsberg', ljubljana: 'laibach', thessaloniki: 'salonica', izmir: 'smyrna',
};

/** Some ids differ between the place list and the map. */
const ID_FIX: Record<string, string> = { SSD: 'SDS' };
export const fixCountryId = (id: string) => ID_FIX[id] ?? id;

/** Words to match for a city: its name, its other names and its country. */
export const citySearch = (name: string, country: string) => { const norm = normalise(name); return `${norm} ${CITY_ALIASES[norm] ?? ''} ${normalise(country)}`.trim(); };

/** Other names people type for a country. The first name is the one on the map data. */
const ALIASES: Record<string, string> = {
  'United States': 'usa us united states of america america',
  'United Kingdom': 'uk britain great britain england scotland wales',
  'United Arab Emirates': 'uae emirates',
  'Democratic Republic of the Congo': 'drc dr congo congo kinshasa',
  'Republic of the Congo': 'congo brazzaville',
  'Republic of Korea': 'south korea korea',
  'Dem. Rep. Korea': 'north korea',
  'Czechia': 'czech republic',
  'Myanmar': 'burma',
  'North Macedonia': 'macedonia',
  'Russia': 'russian federation',
  'Turkey': 'turkiye',
  "Côte d'Ivoire": 'ivory coast',
  'S. Sudan': 'south sudan',
  'Eq. Guinea': 'equatorial guinea',
  'Bosnia and Herz.': 'bosnia and herzegovina',
  'Central African Rep.': 'central african republic',
  'Dominican Rep.': 'dominican republic',
};

/** Shorter or clearer names for the label on the video and in the list. */
const SHORT: Record<string, string> = {
  'United States': 'USA', 'United Kingdom': 'UK', 'United Arab Emirates': 'UAE', 'Democratic Republic of the Congo': 'DR Congo',
  'Republic of Korea': 'South Korea', 'Dem. Rep. Korea': 'North Korea', 'S. Sudan': 'South Sudan', 'Eq. Guinea': 'Equatorial Guinea',
  'Central African Rep.': 'Central African Republic', 'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Dominican Rep.': 'Dominican Republic',
  'Republic of the Congo': 'Congo',
};

export const shortName = (name: string) => SHORT[name] ?? name;

export function buildPlaces(world: World, cities: RawPlaces): PlaceEntry[] {
  const list: PlaceEntry[] = world.countries.map((c) => ({
    name: shortName(c.name), sub: '', lon: c.lon, lat: c.lat, kind: 'country', countryId: c.id, span: c.span, rank: 0,
    search: normalise(`${shortName(c.name)} ${c.name} ${ALIASES[c.name] ?? ''}`), norm: normalise(shortName(c.name)),
  }));
  const known = new Set(world.countries.map((c) => c.id));
  for (const [name, country, lat, lon, rank, id] of cities) {
    const countryId = fixCountryId(id);
    list.push({ name, sub: shortName(country), lon: lon / 100, lat: lat / 100, kind: 'city', rank: rank === 0 ? 1 : rank === 1 ? 2 : 3, search: citySearch(name, country), norm: normalise(name), countryId: known.has(countryId) ? countryId : undefined });
  }
  return list;
}

/** Best matches for what the person has typed: names that start with it first, then names with a word that starts with it, then names that contain it. */
export function searchPlaces(list: PlaceEntry[], query: string, limit = 8): PlaceEntry[] {
  const q = normalise(query);
  if (q.length < 1) return [];
  const scored: { entry: PlaceEntry; score: number }[] = [];
  for (const entry of list) {
    const name = entry.norm;
    let score = -1;
    if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (entry.search.split(' ').some((word) => word.startsWith(q))) score = 2;
    else if (q.length >= 3 && entry.search.includes(q)) score = 3;
    if (score >= 0) scored.push({ entry, score: score * 10 + entry.rank });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map((item) => item.entry);
}

/** Reads "28.61, 77.21" or "28.61 N 77.21 E" as a place. */
export function parseCoordinates(text: string): { lat: number; lon: number } | null {
  const match = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?$/i);
  if (!match) return null;
  let lat = Number(match[1]), lon = Number(match[3]);
  if (match[2]?.toUpperCase() === 'S') lat = -Math.abs(lat);
  if (match[4]?.toUpperCase() === 'W') lon = -Math.abs(lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export function stopFromPlace(place: PlaceEntry): Stop {
  return { label: place.name, lon: place.lon, lat: place.lat, kind: place.kind, countryId: place.countryId, span: place.span, highlight: false };
}

export const stopFromCoordinates = (lat: number, lon: number): Stop => ({ label: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lon, lat, kind: 'point' });
