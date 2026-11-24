import isoToId from '../../data/globe/iso2.json';
import { citySearch, fixCountryId, normalise, searchPlaces, shortName, type PlaceEntry } from './places';
import type { World } from './world';

/**
 * Extra towns and cities (about 170,000, GeoNames, CC BY 4.0), kept in small files by first letter in public/globe. A file is fetched only when
 * a person asks to search more places, and only the letter they typed. Made by scripts/build-globe-more-places.py.
 */
interface Shard { a: string[]; c: [string, number, number, number][] }

const cache = new Map<string, Promise<PlaceEntry[]>>();
const ids = isoToId as Record<string, string>;

export const shardLetter = (query: string) => { const ch = normalise(query).charAt(0); return ch >= 'a' && ch <= 'z' ? ch : '_'; };

function toEntries(shard: Shard, world: World): PlaceEntry[] {
  const names = new Map(world.countries.map((country) => [country.id, country.name]));
  return shard.c.map(([name, lat, lon, label]) => {
    const [state, iso] = (shard.a[label] ?? '|').split('|');
    const id = fixCountryId(ids[iso ?? ''] ?? '');
    const country = shortName(names.get(id) ?? iso ?? '');
    return { name, sub: state ? `${state}, ${country}` : country, lon: lon / 100, lat: lat / 100, kind: 'city', rank: 4, search: citySearch(name, country), norm: normalise(name), countryId: names.has(id) ? id : undefined } as PlaceEntry;
  });
}

/** Downloads the file for this first letter (once) and returns its places. Rejects if the file cannot be fetched, for example when offline. */
export function loadMorePlaces(query: string, world: World): Promise<PlaceEntry[]> {
  const letter = shardLetter(query);
  let found = cache.get(letter);
  if (!found) {
    found = fetch(`/globe/places-${letter}.json`).then((response) => { if (!response.ok) throw new Error('missing'); return response.json() as Promise<Shard>; }).then((shard) => toEntries(shard, world));
    found.catch(() => cache.delete(letter));
    cache.set(letter, found);
  }
  return found;
}

/** Best matches in the extra list, leaving out places that the main list already has. */
export function searchMore(extra: PlaceEntry[], main: PlaceEntry[], query: string, limit = 8): PlaceEntry[] {
  const have = new Set(main.filter((p) => p.kind === 'city').map((p) => `${p.norm}|${Math.round(p.lat)}|${Math.round(p.lon)}`));
  return searchPlaces(extra, query, limit * 3).filter((p) => !have.has(`${p.norm}|${Math.round(p.lat)}|${Math.round(p.lon)}`)).slice(0, limit);
}
