import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef, type PDFObject } from 'pdf-lib';

export type FoundImage =
  | { id: number; width: number; height: number; kind: 'jpeg'; bytes: Uint8Array }
  | { id: number; width: number; height: number; kind: 'raw'; rgba: Uint8ClampedArray };

export interface Extracted { images: FoundImage[]; skipped: number }

const name = (value: PDFObject | undefined): string => (value instanceof PDFName ? value.asString().replace(/^\//, '') : '');
const num = (value: PDFObject | undefined, fallback: number): number => (value instanceof PDFNumber ? value.asNumber() : fallback);

/** The filters on a stream, in the order they were applied. */
function filtersOf(dict: PDFDict): string[] {
  const value = dict.lookup(PDFName.of('Filter'));
  if (value instanceof PDFName) return [name(value)];
  if (value instanceof PDFArray) return Array.from({ length: value.size() }, (_, index) => name(value.lookup(index)));
  return [];
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Undo the PNG row filters used by Flate images (Predictor 10 and above). */
export function unfilterPng(data: Uint8Array, columns: number, colors: number, bpc: number): Uint8Array {
  const bpp = Math.max(1, Math.ceil((colors * bpc) / 8));
  const row = Math.ceil((columns * colors * bpc) / 8);
  const rows = Math.floor(data.length / (row + 1));
  const out = new Uint8Array(rows * row);
  for (let y = 0; y < rows; y += 1) {
    const type = data[y * (row + 1)]!;
    for (let x = 0; x < row; x += 1) {
      const raw = data[y * (row + 1) + 1 + x]!;
      const left = x >= bpp ? out[y * row + x - bpp]! : 0;
      const up = y > 0 ? out[(y - 1) * row + x]! : 0;
      const upLeft = y > 0 && x >= bpp ? out[(y - 1) * row + x - bpp]! : 0;
      let add = 0;
      if (type === 1) add = left;
      else if (type === 2) add = up;
      else if (type === 3) add = (left + up) >> 1;
      else if (type === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left); const pb = Math.abs(p - up); const pc = Math.abs(p - upLeft);
        add = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      out[y * row + x] = (raw + add) & 255;
    }
  }
  return out;
}

/** Decoded 8-bit samples of a Flate image stream, or null when the stream uses something this tool does not handle. */
async function samplesOf(stream: PDFRawStream, expect: number): Promise<Uint8Array | null> {
  const dict = stream.dict;
  const filters = filtersOf(dict);
  if (filters.length !== 1 || filters[0] !== 'FlateDecode') return null;
  if (num(dict.lookup(PDFName.of('BitsPerComponent')), 8) !== 8) return null;
  let data = await inflate(stream.getContents());
  const parmsRaw = dict.lookup(PDFName.of('DecodeParms'));
  const parms = parmsRaw instanceof PDFDict ? parmsRaw : parmsRaw instanceof PDFArray ? parmsRaw.lookup(0) : undefined;
  if (parms instanceof PDFDict) {
    const predictor = num(parms.lookup(PDFName.of('Predictor')), 1);
    if (predictor >= 10) data = unfilterPng(data, num(parms.lookup(PDFName.of('Columns')), 1), num(parms.lookup(PDFName.of('Colors')), 1), 8);
    else if (predictor !== 1) return null;
  }
  return data.length >= expect ? data : null;
}

/** Number of colour components, or 0 for colour spaces that are not plain grey, RGB or CMYK. */
function componentsOf(dict: PDFDict): number {
  const space = dict.lookup(PDFName.of('ColorSpace'));
  const direct = name(space);
  if (direct === 'DeviceGray' || direct === 'CalGray') return 1;
  if (direct === 'DeviceRGB' || direct === 'CalRGB') return 3;
  if (direct === 'DeviceCMYK') return 4;
  if (space instanceof PDFArray) {
    const kind = name(space.lookup(0));
    if (kind === 'ICCBased') {
      const profile = space.lookup(1);
      return profile instanceof PDFRawStream ? num(profile.dict.lookup(PDFName.of('N')), 0) : 0;
    }
    if (kind === 'CalRGB') return 3;
    if (kind === 'CalGray') return 1;
  }
  return 0;
}

/** Pulls every picture out of a PDF as it was stored: photos keep their original JPEG, other pictures come back as pixels. Pictures that need unusual colour handling are counted as skipped. */
export async function extractImages(bytes: ArrayBuffer, minSize = 0): Promise<Extracted> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const images: FoundImage[] = []; let skipped = 0; let id = 0;
  // Transparency masks are stored as pictures too; they belong to their image and are not listed on their own.
  const masks = new Set<PDFRef>();
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    const mask = object.dict.get(PDFName.of('SMask'));
    if (mask instanceof PDFRef) masks.add(mask);
  }
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream) || masks.has(ref)) continue;
    const dict = object.dict;
    if (name(dict.lookup(PDFName.of('Subtype'))) !== 'Image') continue;
    const width = num(dict.lookup(PDFName.of('Width')), 0); const height = num(dict.lookup(PDFName.of('Height')), 0);
    if (!width || !height) continue;
    if (minSize && Math.max(width, height) < minSize) continue;
    if (dict.get(PDFName.of('ImageMask'))) { skipped += 1; continue; }
    const components = componentsOf(dict);
    const filters = filtersOf(dict);
    id += 1;
    if (filters.length === 1 && filters[0] === 'DCTDecode') {
      if (components === 1 || components === 3) images.push({ id, width, height, kind: 'jpeg', bytes: object.getContents() }); else { skipped += 1; id -= 1; }
      continue;
    }
    if ((components !== 1 && components !== 3) || width * height > 60_000_000) { skipped += 1; id -= 1; continue; }
    const samples = await samplesOf(object, width * height * components).catch(() => null);
    if (!samples) { skipped += 1; id -= 1; continue; }
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      if (components === 3) { rgba[i * 4] = samples[i * 3]!; rgba[i * 4 + 1] = samples[i * 3 + 1]!; rgba[i * 4 + 2] = samples[i * 3 + 2]!; }
      else { const g = samples[i]!; rgba[i * 4] = g; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = g; }
      rgba[i * 4 + 3] = 255;
    }
    const maskRef = dict.get(PDFName.of('SMask'));
    const mask = maskRef instanceof PDFRef ? doc.context.lookup(maskRef) : undefined;
    if (mask instanceof PDFRawStream && num(mask.dict.lookup(PDFName.of('Width')), 0) === width && num(mask.dict.lookup(PDFName.of('Height')), 0) === height) {
      const alpha = await samplesOf(mask, width * height).catch(() => null);
      if (alpha) for (let i = 0; i < width * height; i += 1) rgba[i * 4 + 3] = alpha[i]!;
    }
    images.push({ id, width, height, kind: 'raw', rgba });
  }
  return { images, skipped };
}
