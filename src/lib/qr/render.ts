import type { QrCode } from './encoder';

export interface QrStyle {
  fg: string;
  bg: string;
  /** Quiet zone in modules. The standard asks for 4. */
  quiet: number;
  /** Share of the code width a centre logo may cover, 0 for none. Capped at MAX_LOGO. */
  logo: number;
  rounded: boolean;
}

export const MAX_LOGO = 0.24;

export const defaultStyle = (): QrStyle => ({ fg: '#000000', bg: '#ffffff', quiet: 4, logo: 0, rounded: false });

/** Modules hidden behind the logo box (a square, centred, with a one-module margin). */
function logoBox(qr: QrCode, style: QrStyle): { from: number; to: number } | null {
  if (style.logo <= 0) return null;
  const side = Math.max(3, Math.round(qr.size * Math.min(style.logo, MAX_LOGO)));
  const from = Math.floor((qr.size - side) / 2) - 1;
  return { from, to: from + side + 2 };
}

const hidden = (box: { from: number; to: number } | null, x: number, y: number) => box !== null && x >= box.from && x < box.to && y >= box.from && y < box.to;

/** SVG markup for the code, one path for all dark modules. Units are modules. */
export function qrSvg(qr: QrCode, style: QrStyle, logoHref = ''): string {
  const box = logoBox(qr, style);
  const total = qr.size + style.quiet * 2;
  let path = '';
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (!qr.modules[y][x] || hidden(box, x, y)) continue;
      path += style.rounded ? roundedModule(x + style.quiet, y + style.quiet) : `M${x + style.quiet} ${y + style.quiet}h1v1h-1z`;
    }
  }
  let logo = '';
  if (box && logoHref) {
    const at = box.from + 1 + style.quiet;
    const side = box.to - box.from - 2;
    logo = `<image href="${logoHref}" x="${at}" y="${at}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${style.bg}"/><path d="${path}" fill="${style.fg}"/>${logo}</svg>`;
}

const roundedModule = (x: number, y: number) => `M${x + 0.5} ${y}a0.5 0.5 0 1 0 0.001 0z`;

/** PNG at a whole number of pixels per module so edges stay sharp. */
export async function qrPng(qr: QrCode, style: QrStyle, targetPx: number, logoImage: HTMLImageElement | null): Promise<Blob> {
  const total = qr.size + style.quiet * 2;
  const scale = Math.max(1, Math.round(targetPx / total));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = total * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = style.fg;
  const box = logoBox(qr, style);
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (!qr.modules[y][x] || hidden(box, x, y)) continue;
      const px = (x + style.quiet) * scale;
      const py = (y + style.quiet) * scale;
      if (style.rounded) { ctx.beginPath(); ctx.arc(px + scale / 2, py + scale / 2, scale / 2, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(px, py, scale, scale);
    }
  }
  if (box && logoImage) {
    const at = (box.from + 1 + style.quiet) * scale;
    const side = (box.to - box.from - 2) * scale;
    const ratio = Math.min(side / logoImage.naturalWidth, side / logoImage.naturalHeight);
    const w = logoImage.naturalWidth * ratio;
    const h = logoImage.naturalHeight * ratio;
    ctx.drawImage(logoImage, at + (side - w) / 2, at + (side - h) / 2, w, h);
  }
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not make the PNG.'))), 'image/png'));
}

/** Asks the browser's own barcode reader (where it exists) to read the finished image. null = cannot check here. */
export async function selfCheck(blob: Blob, expected: string): Promise<boolean | null> {
  const Detector = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect(i: ImageBitmap): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
  if (!Detector || typeof createImageBitmap !== 'function') return null;
  try {
    const found = await new Detector({ formats: ['qr_code'] }).detect(await createImageBitmap(blob));
    return found.some((item) => item.rawValue === expected);
  } catch {
    return null;
  }
}
