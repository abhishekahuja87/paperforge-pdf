/** Largest canvas we ask the browser for. Bigger canvases silently fail on many phones. */
export const MAX_RENDER_PIXELS = 16_000_000;

interface MeasurablePage {
  getViewport(options: { scale: number }): { width: number; height: number };
}

/** The wanted scale, lowered when the page is so large that the canvas would be too big. */
export function safeRenderScale(page: MeasurablePage, wanted: number): number {
  const base = page.getViewport({ scale: 1 });
  const pixels = base.width * base.height;
  if (pixels <= 0) return wanted;
  return Math.min(wanted, Math.sqrt(MAX_RENDER_PIXELS / pixels));
}
