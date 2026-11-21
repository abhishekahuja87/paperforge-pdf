/**
 * Page geometry for PDFs whose pages are rotated by the file's own Rotate setting. A person sees and draws on the page
 * as displayed (origin top-left, y down); pdf-lib writes in the unrotated page space (origin bottom-left, y up).
 */
export type Rotation = 0 | 90 | 180 | 270;

export const normRotation = (angle: number): Rotation => ((((Math.round(angle / 90) * 90) % 360) + 360) % 360) as Rotation;

/** Size of the page as displayed, given its unrotated width and height. */
export const displaySize = (rotation: Rotation, width: number, height: number): { w: number; h: number } =>
  (rotation === 90 || rotation === 270 ? { w: height, h: width } : { w: width, h: height });

/** A point on the displayed page (points from the top-left) to the unrotated page space. */
export function displayToPage(rotation: Rotation, width: number, height: number, dx: number, dy: number): { x: number; y: number } {
  switch (rotation) {
    case 0: return { x: dx, y: height - dy };
    case 90: return { x: dy, y: dx };
    case 180: return { x: width - dx, y: dy };
    default: return { x: width - dy, y: height - dx };
  }
}

/** The reverse: a point in the unrotated page space to the displayed page. */
export function pageToDisplay(rotation: Rotation, width: number, height: number, x: number, y: number): { dx: number; dy: number } {
  switch (rotation) {
    case 0: return { dx: x, dy: height - y };
    case 90: return { dx: y, dy: x };
    case 180: return { dx: width - x, dy: y };
    default: return { dx: height - y, dy: width - x };
  }
}

/** A rectangle drawn on the displayed page, as the same rectangle in the unrotated page space. */
export function displayRectToPage(rotation: Rotation, width: number, height: number, dx: number, dy: number, dw: number, dh: number): { x: number; y: number; width: number; height: number } {
  const a = displayToPage(rotation, width, height, dx, dy);
  const b = displayToPage(rotation, width, height, dx + dw, dy + dh);
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}
