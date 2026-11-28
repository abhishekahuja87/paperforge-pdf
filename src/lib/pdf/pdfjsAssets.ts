import { version } from 'pdfjs-dist';

/**
 * Where the PDF library finds its support files, served by this site from public/pdfjs/<version>/
 * (copied there by scripts/copy-pdfjs-assets.mjs). Spread into every getDocument call:
 *   pdfjsLib.getDocument({ ...PDFJS_ASSETS, data })
 * Without wasmUrl, JBIG2 and JPEG 2000 images (common in scanned PDFs) cannot be decoded and those pages draw blank;
 * without standardFontDataUrl, PDFs that name a standard font without embedding it are drawn with a substitute.
 * Nothing is fetched from another site.
 */
const base = `/pdfjs/${version}/`;

export const PDFJS_ASSETS = {
  cMapUrl: `${base}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${base}standard_fonts/`,
  wasmUrl: `${base}wasm/`,
  iccUrl: `${base}iccs/`,
} as const;
