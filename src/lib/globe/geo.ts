/** Maths for the globe: points on a sphere, the view from a chosen point, and great circle paths. Angles in degrees unless a name says radians. */
export type Vec = [number, number, number];

const RAD = Math.PI / 180;

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Slow start and slow end, flatter than smoothstep at both ends. */
export const easeInOut = (t: number) => { const x = clamp(t, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };

/** Unit vector for a longitude and latitude. */
export function toVec(lon: number, lat: number): Vec {
  const la = lat * RAD, lo = lon * RAD, c = Math.cos(la);
  return [c * Math.cos(lo), c * Math.sin(lo), Math.sin(la)];
}

export function fromVec(v: Vec): { lon: number; lat: number } {
  return { lon: Math.atan2(v[1], v[0]) / RAD, lat: Math.asin(clamp(v[2], -1, 1)) / RAD };
}

export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Angle between two unit vectors, in radians. */
export const angleBetween = (a: Vec, b: Vec) => Math.acos(clamp(dot(a, b), -1, 1));

/** Distance in degrees along the great circle between two places. */
export const distanceDeg = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) => angleBetween(toVec(a.lon, a.lat), toVec(b.lon, b.lat)) / RAD;

/** The point a fraction t of the way along the great circle from a to b. */
export function slerp(a: Vec, b: Vec, t: number): Vec {
  const omega = angleBetween(a, b);
  if (omega < 1e-6) return a;
  const s = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / s, wb = Math.sin(t * omega) / s;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

/** Longitude difference taken the short way round, so a turn from 170 to -170 degrees is 20 degrees. */
export const shortLonDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

/** The three directions of the view when the camera looks straight down at a place: right (east), up (north) and towards the viewer. */
export interface View { east: Vec; north: Vec; out: Vec }

export function viewAt(lon: number, lat: number): View {
  const lo = lon * RAD, la = lat * RAD;
  return {
    east: [-Math.sin(lo), Math.cos(lo), 0],
    north: [-Math.sin(la) * Math.cos(lo), -Math.sin(la) * Math.sin(lo), Math.cos(la)],
    out: toVec(lon, lat),
  };
}

/** Screen-space result of projecting a unit vector (x right, y up, both in globe radii; depth above 0 faces the viewer). */
export interface Projected { x: number; y: number; depth: number }

export function project(v: Vec, view: View, lift = 1): Projected {
  return {
    x: (v[0] * view.east[0] + v[1] * view.east[1] + v[2] * view.east[2]) * lift,
    y: (v[0] * view.north[0] + v[1] * view.north[1] + v[2] * view.north[2]) * lift,
    depth: (v[0] * view.out[0] + v[1] * view.out[1] + v[2] * view.out[2]) * lift,
  };
}

/** Bearing of the path at a point, as the screen angle in radians of the step from one projected point to the next. */
export const screenAngle = (from: { x: number; y: number }, to: { x: number; y: number }) => Math.atan2(to.y - from.y, to.x - from.x);

/** Bounding angular radius used to skip shapes that cannot be seen. */
export const capRadius = (center: Vec, points: Vec[]) => points.reduce((max, p) => Math.max(max, angleBetween(center, p)), 0);
