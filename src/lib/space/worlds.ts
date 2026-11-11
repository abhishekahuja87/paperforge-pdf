/**
 * Facts about the Sun, the eight planets and the Moon, from the NASA planetary fact sheets (public domain figures,
 * rounded). Moon counts keep growing as new ones are found, so they are shown with a plus sign.
 */
export interface World {
  id: string;
  name: string;
  kind: 'star' | 'rocky planet' | 'gas giant' | 'ice giant' | 'moon';
  /** Width across the middle, in km. */
  diameterKm: number;
  /** Average distance from the Sun in millions of km (for the Moon: from Earth, in millions of km). */
  distanceMkm: number;
  /** Time to go once round the Sun, in Earth days (for the Moon: round Earth). */
  orbitDays: number;
  /** Length of one turn on its axis in Earth hours. Negative means it spins backwards. */
  rotationHours: number;
  /** Pull at the surface in m/s squared. */
  gravity: number;
  moons: string;
  /** Average surface (or cloud-top) temperature in degrees Celsius. */
  tempC: number | null;
  color: string;
}

export const WORLDS: World[] = [
  { id: 'sun', name: 'Sun', kind: 'star', diameterKm: 1392700, distanceMkm: 0, orbitDays: 0, rotationHours: 609.1, gravity: 274, moons: '0', tempC: 5500, color: '#f59e0b' },
  { id: 'mercury', name: 'Mercury', kind: 'rocky planet', diameterKm: 4879, distanceMkm: 57.9, orbitDays: 88, rotationHours: 1407.6, gravity: 3.7, moons: '0', tempC: 167, color: '#9ca3af' },
  { id: 'venus', name: 'Venus', kind: 'rocky planet', diameterKm: 12104, distanceMkm: 108.2, orbitDays: 224.7, rotationHours: -5832.5, gravity: 8.9, moons: '0', tempC: 464, color: '#d97706' },
  { id: 'earth', name: 'Earth', kind: 'rocky planet', diameterKm: 12756, distanceMkm: 149.6, orbitDays: 365.2, rotationHours: 23.9, gravity: 9.8, moons: '1', tempC: 15, color: '#2563eb' },
  { id: 'moon', name: 'Moon', kind: 'moon', diameterKm: 3475, distanceMkm: 0.384, orbitDays: 27.3, rotationHours: 655.7, gravity: 1.62, moons: '0', tempC: -20, color: '#cbd5e1' },
  { id: 'mars', name: 'Mars', kind: 'rocky planet', diameterKm: 6792, distanceMkm: 228, orbitDays: 687, rotationHours: 24.6, gravity: 3.7, moons: '2', tempC: -65, color: '#dc2626' },
  { id: 'jupiter', name: 'Jupiter', kind: 'gas giant', diameterKm: 142984, distanceMkm: 778.5, orbitDays: 4331, rotationHours: 9.9, gravity: 23.1, moons: '95+', tempC: -110, color: '#c2410c' },
  { id: 'saturn', name: 'Saturn', kind: 'gas giant', diameterKm: 120536, distanceMkm: 1432, orbitDays: 10747, rotationHours: 10.7, gravity: 9, moons: '145+', tempC: -140, color: '#ca8a04' },
  { id: 'uranus', name: 'Uranus', kind: 'ice giant', diameterKm: 51118, distanceMkm: 2867, orbitDays: 30589, rotationHours: -17.2, gravity: 8.7, moons: '28+', tempC: -195, color: '#0891b2' },
  { id: 'neptune', name: 'Neptune', kind: 'ice giant', diameterKm: 49528, distanceMkm: 4515, orbitDays: 59800, rotationHours: 16.1, gravity: 11, moons: '16+', tempC: -200, color: '#4338ca' },
];

/** The eight planets in order from the Sun. */
export const PLANETS = WORLDS.filter((world) => world.kind !== 'star' && world.kind !== 'moon');

export const EARTH_GRAVITY = 9.8;
const LIGHT_KM_PER_SECOND = 299792.458;
const DAY_MS = 24 * 60 * 60 * 1000;

export const getWorld = (id: string): World => WORLDS.find((world) => world.id === id) ?? WORLDS[3];

/** How many times wider the first world is than the second. */
export const widthRatio = (a: World, b: World): number => a.diameterKm / b.diameterKm;

/** How many of the smaller world would fit inside the larger by volume, ignoring gaps between spheres. */
export const volumeRatio = (big: World, small: World): number => (big.diameterKm / small.diameterKm) ** 3;

/** Minutes for sunlight to reach a planet. */
export const lightMinutes = (world: World): number => (world.distanceMkm * 1_000_000) / LIGHT_KM_PER_SECOND / 60;

/** Weight (the pull you would feel) on a world for someone of the given weight on Earth. */
export const weightOn = (world: World, earthWeight: number): number => (earthWeight * world.gravity) / EARTH_GRAVITY;

export interface Birthday { years: number; nextAge: number; nextDate: Date }

/** Age in years of that world, and the date of the next birthday there. Returns null when the date is missing or in the future. */
export function ageOn(world: World, birth: Date | null, now: Date = new Date()): Birthday | null {
  if (!birth || world.orbitDays <= 0 || birth.getTime() > now.getTime()) return null;
  const days = (now.getTime() - birth.getTime()) / DAY_MS;
  const years = days / world.orbitDays;
  const nextAge = Math.floor(years) + 1;
  return { years, nextAge, nextDate: new Date(birth.getTime() + nextAge * world.orbitDays * DAY_MS) };
}

/** Compact number for facts: 142,984 or 4.5 or 0.38. */
export function formatNumber(value: number): string {
  if (value >= 100) return Math.round(value).toLocaleString('en-IN');
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}

/** Length of a day with its direction, for example "23.9 hours" or "243 days (spins backwards)". */
export function describeDay(world: World): string {
  const hours = Math.abs(world.rotationHours);
  const text = hours >= 72 ? `${formatNumber(hours / 24)} Earth days` : `${formatNumber(hours)} hours`;
  return world.rotationHours < 0 ? `${text} (spins backwards)` : text;
}

/** Length of a year on a planet: "88 days" or "11.9 Earth years". */
export function describeYear(world: World): string {
  if (world.orbitDays <= 0) return '—';
  return world.orbitDays >= 700 ? `${formatNumber(world.orbitDays / 365.25)} Earth years` : `${formatNumber(world.orbitDays)} Earth days`;
}
