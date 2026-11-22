/** Maths for the spinner wheel. The winner is chosen first, then the wheel is turned so the pointer ends on that slice. */

export const WHEEL_COLOURS = ['#ea580c', '#15803d', '#1d4ed8', '#be123c', '#a16207', '#7e22ce', '#0f766e', '#c2410c'];

/** The colour of slice `index`. The last slice of an odd count never repeats the first colour next to it. */
export function sliceColour(index: number, count: number): string {
  const size = WHEEL_COLOURS.length;
  if (count > 1 && count % size === 1 && index === count - 1) return WHEEL_COLOURS[2]!;
  return WHEEL_COLOURS[index % size]!;
}

const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** SVG path of slice `index` out of `count`, from the top going clockwise, around the point (0, 0). */
export function slicePath(index: number, count: number, radius: number): string {
  if (count <= 1) return `M ${radius} 0 A ${radius} ${radius} 0 1 1 ${-radius} 0 A ${radius} ${radius} 0 1 1 ${radius} 0 Z`;
  const size = 360 / count;
  const from = rad(index * size - 90);
  const to = rad((index + 1) * size - 90);
  const large = size > 180 ? 1 : 0;
  const point = (angle: number) => `${(Math.cos(angle) * radius).toFixed(3)} ${(Math.sin(angle) * radius).toFixed(3)}`;
  return `M 0 0 L ${point(from)} A ${radius} ${radius} 0 ${large} 1 ${point(to)} Z`;
}

/**
 * The new rotation in degrees (always larger than `current`) that brings slice `index` under the pointer at the top.
 * `offset` is a number from -0.4 to 0.4 that moves the stop inside the slice, so the wheel does not always stop in the middle.
 */
export function spinTarget(current: number, index: number, count: number, offset: number, turns: number): number {
  const size = 360 / Math.max(1, count);
  const aim = (index + 0.5 + Math.max(-0.4, Math.min(0.4, offset))) * size;
  const wanted = (((-aim) % 360) + 360) % 360;
  const base = Math.ceil(current / 360) * 360;
  let next = base + Math.max(1, Math.floor(turns)) * 360 + wanted;
  if (next <= current + 360) next += 360;
  return next;
}

/** Which slice is under the pointer for a rotation. */
export function sliceAt(rotation: number, count: number): number {
  const size = 360 / Math.max(1, count);
  const angle = (((-rotation) % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(angle / size));
}

/** Shortens a long slice label so it fits on the wheel. */
export function sliceLabel(text: string, count: number): string {
  const max = count > 24 ? 8 : count > 12 ? 12 : 18;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
