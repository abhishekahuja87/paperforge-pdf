import type { Margin, Variant } from './courtData';
import { spaceNeeded } from './fit';
import { annotation, chainPositions, noteLines, type AnnotateOptions } from './annotate';
import { setOutPrims } from './marking';
import { xml } from './xml';
import { anchor, type Step } from './marking';
import { formatLength } from './units';

export { xml };
const num = (value: number): string => Number(value.toFixed(3)).toString();

export interface Diagram {
  /** SVG viewBox, in metres. */
  box: { x: number; y: number; w: number; h: number };
  /** SVG markup to put inside an <svg>. */
  body: string;
}

/**
 * The court drawn to scale with its sizes written on it: the length and width with their feet and inches, numbered
 * points for the key lines (listed in the marking plan under the same numbers) and the clear space as a dotted box.
 * All lengths are in metres; text sizes follow the width of the drawing so it reads the same for a table and a football pitch.
 */
export interface DiagramOptions {
  /** Number each item of the set-out guide on the drawing. */
  steps?: Step[];
  /** Draw both diagonals, for checking that the corners are square. */
  diagonals?: boolean;
  /** Hide the green key-line points (the set-out drawing has its own numbers). */
  hideKeyPoints?: boolean;
  /** Write the distance of every line, centre and spot from both ends and both sides on the drawing, in light grey. */
  annotate?: AnnotateOptions;
}

export function buildDiagram(variant: Variant, margin: Margin, clearCaption: string, options: DiagramOptions = {}): Diagram {
  const [needLong, needShort] = spaceNeeded(variant, margin, 0);
  const L = variant.length;
  const W = variant.width;
  const ox = (needLong - L) / 2;
  const oy = (needShort - W) / 2;
  const bx0 = Math.min(0, -ox);
  const by0 = Math.min(0, -oy);
  const bx1 = Math.max(L, L + ox);
  const by1 = Math.max(W, W + oy);
  const f = Math.max(needLong, L) / 34;
  const gap = f * 1.7;
  const r = f * 0.62;
  // With measurements written on the drawing, every side gets a zone for the labels.
  const chains = options.annotate ? chainPositions(variant, setOutPrims(variant)) : null;
  const zoneY = chains && chains.xs.length > 0 ? f * 6.8 : 0;
  const zoneX = chains && chains.ys.length > 0 ? f * 6.8 : 0;
  const dimY = by0 - gap - zoneY;
  const dimX = bx1 + gap + zoneX;
  const markY = by1 + f * 1.1 + zoneY;
  const markX = bx0 - f * 1.1;

  const layer = options.annotate ? annotation(variant, f, { bx0, by0, bx1, by1 }, options.annotate) : null;
  const footer = options.annotate?.names ? noteLines(variant, options.annotate.names, 'footer') : [];
  const legend = layer?.legend ?? [];
  const box = { x: bx0 - f * 2.2 - zoneX, y: dimY - f * 1.8, w: dimX + f * 2.8 - (bx0 - f * 2.2 - zoneX), h: markY + f * 3.4 + footer.length * f * 1.1 + (legend.length > 0 ? legend.length * f * 1.0 + f * 1.4 : 0) - (dimY - f * 1.8) };

  const line = num(f * 0.13);
  const thin = num(f * 0.07);
  const dash = (a: number, b: number) => `${num(f * a)} ${num(f * b)}`;
  let body = '';
  body += `<rect x="${num(box.x)}" y="${num(box.y)}" width="${num(box.w)}" height="${num(box.h)}" fill="#ffffff"/>`;
  body += `<rect x="${num(bx0)}" y="${num(by0)}" width="${num(bx1 - bx0)}" height="${num(by1 - by0)}" fill="#ecfdf5" stroke="#64748b" stroke-width="${thin}" stroke-dasharray="${dash(0.12, 0.45)}"/>`;
  body += variant.round
    ? `<ellipse cx="${num(L / 2)}" cy="${num(W / 2)}" rx="${num(L / 2)}" ry="${num(W / 2)}" fill="#d1fae5"/>`
    : `<rect x="0" y="0" width="${num(L)}" height="${num(W)}" fill="#d1fae5"/>`;
  body += `<g fill="none" stroke="#065f46" stroke-linejoin="round" stroke-width="${line}">${variant.lines.map((d) => `<path d="${d}"/>`).join('')}`;
  body += (variant.dashed ?? []).map((d) => `<path d="${d}" stroke="#b45309" stroke-dasharray="${dash(0.7, 0.45)}"/>`).join('') + '</g>';

  // Length and width, with feet and inches.
  const dim = `stroke="#0f172a" stroke-width="${thin}"`;
  const tick = f * 0.45;
  body += `<g ${dim} fill="none"><path d="M0 ${num(dimY)}H${num(L)}M0 ${num(dimY - tick)}V${num(dimY + tick)}M${num(L)} ${num(dimY - tick)}V${num(dimY + tick)}`
    + `M${num(dimX)} 0V${num(W)}M${num(dimX - tick)} 0H${num(dimX + tick)}M${num(dimX - tick)} ${num(W)}H${num(dimX + tick)}"/></g>`;
  body += `<text x="${num(L / 2)}" y="${num(dimY - f * 0.5)}" text-anchor="middle" font-size="${num(f * 0.95)}" font-weight="700" fill="#0f172a" font-family="Arial, Helvetica, sans-serif">${xml(formatLength(L))}</text>`;
  const wx = dimX + f * 1.15;
  body += `<text x="${num(wx)}" y="${num(W / 2)}" text-anchor="middle" font-size="${num(f * 0.95)}" font-weight="700" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" transform="rotate(90 ${num(wx)} ${num(W / 2)})">${xml(formatLength(W))}</text>`;

  // Numbered key lines.
  const marker = (cx: number, cy: number, n: number) => `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="#065f46"/><text x="${num(cx)}" y="${num(cy + f * 0.27)}" text-anchor="middle" font-size="${num(f * 0.8)}" font-weight="700" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${n}</text>`;
  (options.hideKeyPoints || options.annotate ? [] : variant.marks).forEach((mark, i) => {
    if (mark.from === 'end') body += `<path d="M${num(mark.m)} ${num(W)}V${num(markY - r)}" stroke="#94a3b8" stroke-width="${thin}" stroke-dasharray="${dash(0.3, 0.3)}" fill="none"/>${marker(mark.m, markY, i + 1)}`;
    else body += `<path d="M0 ${num(mark.m)}H${num(markX + r)}" stroke="#94a3b8" stroke-width="${thin}" stroke-dasharray="${dash(0.3, 0.3)}" fill="none"/>${marker(markX, mark.m, i + 1)}`;
  });

  if (layer) body += layer.markup;
  const label = (x: number, y: number, text: string, fill: string) => `<text x="${num(x)}" y="${num(y)}" text-anchor="middle" font-size="${num(f * 0.95)}" font-weight="700" fill="${fill}" font-family="Arial, Helvetica, sans-serif">${xml(text)}</text>`;
  if (!variant.round) {
    if (options.diagonals) body += `<path d="M0 0L${num(L)} ${num(W)}M${num(L)} 0L0 ${num(W)}" fill="none" stroke="#94a3b8" stroke-width="${thin}" stroke-dasharray="${dash(0.3, 0.45)}"/>`;
    body += label(-f * 0.7, -f * 0.35, 'A', '#0f172a') + label(L + f * 0.7, -f * 0.35, 'B', '#0f172a') + label(L + f * 0.7, W + f * 0.95, 'C', '#0f172a') + label(-f * 0.7, W + f * 0.95, 'D', '#0f172a');
  }
  for (const step of options.steps ?? []) {
    if (!step.prim) continue;
    const [ax, ay] = anchor(step.prim);
    body += `<circle cx="${num(ax)}" cy="${num(ay)}" r="${num(r * 0.95)}" fill="#b45309" stroke="#ffffff" stroke-width="${thin}"/><text x="${num(ax)}" y="${num(ay + f * 0.25)}" text-anchor="middle" font-size="${num(f * 0.7)}" font-weight="700" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${step.n}</text>`;
  }
  body += `<text x="${num(L / 2)}" y="${num(markY + f * 2.5)}" text-anchor="middle" font-size="${num(f * 0.8)}" fill="#475569" font-family="Arial, Helvetica, sans-serif">${xml(clearCaption)}</text>`;
  footer.forEach((note, i) => {
    body += `<text x="${num(L / 2)}" y="${num(markY + f * 4 + i * f * 1.1)}" text-anchor="middle" font-size="${num(f * 0.8)}" fill="#334155" font-family="Arial, Helvetica, sans-serif">${xml(note)}</text>`;
  });
  legend.forEach((entry, i) => {
    body += `<text x="${num(box.x + f * 1.5)}" y="${num(markY + f * 4 + footer.length * f * 1.1 + f * 1.6 + i * f * 1.0)}" font-size="${num(f * 0.82)}" fill="#334155" font-family="Arial, Helvetica, sans-serif">${xml(entry)}</text>`;
  });
  return { box, body };
}

/** A standalone <svg> element for the diagram. */
export function diagramSvg(diagram: Diagram, label: string, extra = ''): string {
  const { x, y, w, h } = diagram.box;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${xml(label)}" viewBox="${num(x)} ${num(y)} ${num(w)} ${num(h)}" ${extra}>${diagram.body}</svg>`;
}
