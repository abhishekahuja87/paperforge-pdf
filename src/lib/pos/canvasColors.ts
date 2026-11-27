/** Turns oklch() colours into plain rgb() before a bill is drawn to an image, because the canvas renderer cannot read oklch. */
const OKLCH_PATTERN = /oklch\(([^)]+)\)/gi;

function oklchToRgba(value: string): string {
  const [lightnessValue, chromaValue, hueValue, alphaValue] = value.replace(/\s*\/\s*/, ' ').trim().split(/\s+/);
  const lightness = Number.parseFloat(lightnessValue) / (lightnessValue.endsWith('%') ? 100 : 1);
  const chroma = Number.parseFloat(chromaValue) * (chromaValue.endsWith('%') ? 0.004 : 1);
  const hueNumber = Number.parseFloat(hueValue);
  const hue = hueNumber * (
    hueValue.endsWith('turn') ? 360
      : hueValue.endsWith('rad') ? 180 / Math.PI
        : hueValue.endsWith('grad') ? 0.9
          : 1
  );
  const alpha = alphaValue
    ? Number.parseFloat(alphaValue) / (alphaValue.endsWith('%') ? 100 : 1)
    : 1;
  if (![lightness, chroma, hue, alpha].every(Number.isFinite)) {
    throw new Error(`Could not normalize the bill color "${value}".`);
  }
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => {
    const linear = Math.max(0, Math.min(1, channel));
    const srgb = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
    return Math.round(srgb * 255);
  });
  return `rgba(${channels.join(', ')}, ${alpha})`;
}

export function normalizeCanvasColors(document: Document, root: HTMLElement): void {
  document.documentElement.style.backgroundColor = 'transparent';
  document.body.style.backgroundColor = 'transparent';
  const elements = [root, ...root.querySelectorAll<HTMLElement>('*')];
  for (const element of elements) {
    const computedStyle = document.defaultView?.getComputedStyle(element);
    if (!computedStyle) continue;
    for (let index = 0; index < computedStyle.length; index += 1) {
      const property = computedStyle.item(index);
      if (property.startsWith('--')) continue;
      const value = computedStyle.getPropertyValue(property);
      if (value.includes('oklch(')) {
        element.style.setProperty(property, value.replace(OKLCH_PATTERN, (_, color: string) => oklchToRgba(color)));
      }
    }
  }
}
