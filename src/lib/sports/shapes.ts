/** Tiny SVG path builders. Everything is in metres, x along the length of the court and y across it, with y pointing down. */

const n = (value: number) => Number(value.toFixed(4));

export const line = (x1: number, y1: number, x2: number, y2: number) => `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
export const rect = (x: number, y: number, w: number, h: number) => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
export const circle = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0z`;
/** Start a sub-path at x, y. */
export const move = (x: number, y: number) => `M${n(x)} ${n(y)}`;
export const lineTo = (x: number, y: number) => `L${n(x)} ${n(y)}`;
/** Arc of radius r to x, y. sweep 1 turns clockwise on screen, 0 anticlockwise. */
export const arcTo = (r: number, x: number, y: number, sweep: 0 | 1, large: 0 | 1 = 0) => `A${n(r)} ${n(r)} 0 ${large} ${sweep} ${n(x)} ${n(y)}`;
