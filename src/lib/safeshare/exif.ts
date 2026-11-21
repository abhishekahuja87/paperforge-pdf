/**
 * Reads the hidden details a JPEG photo carries (place, camera, time, editing app) so a person can see what they
 * are about to share. Written for this site instead of pulling in a library: it only reads, never writes.
 */
export interface PhotoFacts {
  /** True when the file is a JPEG that was readable. Other formats are cleaned but not read. */
  readable: boolean;
  gps: { latitude: number; longitude: number; altitude?: number } | null;
  make: string;
  model: string;
  software: string;
  taken: string;
  artist: string;
  copyright: string;
  /** Names of extra hidden blocks found, such as XMP or IPTC. */
  extras: string[];
}

const EMPTY: PhotoFacts = { readable: false, gps: null, make: '', model: '', software: '', taken: '', artist: '', copyright: '', extras: [] };
const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

interface Entry { type: number; count: number; at: number }

class Tiff {
  private view: DataView;
  private base: number;
  private little: boolean;
  constructor(view: DataView, base: number, little: boolean) { this.view = view; this.base = base; this.little = little; }
  u16(at: number) { return this.view.getUint16(this.base + at, this.little); }
  u32(at: number) { return this.view.getUint32(this.base + at, this.little); }
  inside(at: number, length: number) { return at >= 0 && this.base + at + length <= this.view.byteLength; }
  entries(ifd: number): Map<number, Entry> {
    const found = new Map<number, Entry>();
    if (!this.inside(ifd, 2)) return found;
    const total = Math.min(this.u16(ifd), 300);
    for (let i = 0; i < total; i += 1) {
      const row = ifd + 2 + i * 12;
      if (!this.inside(row, 12)) break;
      const type = this.u16(row + 2);
      const count = this.u32(row + 4);
      const size = (TYPE_SIZE[type] ?? 1) * count;
      const at = size <= 4 ? row + 8 : this.u32(row + 8);
      if (!this.inside(at, Math.min(size, 1))) continue;
      found.set(this.u16(row), { type, count, at });
    }
    return found;
  }
  text(entry: Entry | undefined): string {
    if (!entry || entry.type !== 2 || !this.inside(entry.at, entry.count)) return '';
    let out = '';
    for (let i = 0; i < Math.min(entry.count, 200); i += 1) {
      const code = this.view.getUint8(this.base + entry.at + i);
      if (code === 0) break;
      out += String.fromCharCode(code);
    }
    return out.trim();
  }
  numbers(entry: Entry | undefined, wanted: number): number[] {
    if (!entry) return [];
    const out: number[] = [];
    for (let i = 0; i < Math.min(entry.count, wanted); i += 1) {
      if (entry.type === 5 || entry.type === 10) {
        const at = entry.at + i * 8;
        if (!this.inside(at, 8)) break;
        const bottom = this.u32(at + 4);
        out.push(bottom === 0 ? 0 : this.u32(at) / bottom);
      } else if (entry.type === 3) {
        if (!this.inside(entry.at + i * 2, 2)) break;
        out.push(this.u16(entry.at + i * 2));
      } else if (entry.type === 4) {
        if (!this.inside(entry.at + i * 4, 4)) break;
        out.push(this.u32(entry.at + i * 4));
      } else if (entry.type === 1) {
        if (!this.inside(entry.at + i, 1)) break;
        out.push(this.view.getUint8(this.base + entry.at + i));
      }
    }
    return out;
  }
}

const degrees = (parts: number[], ref: string) => {
  if (parts.length < 3) return null;
  const value = parts[0]! + parts[1]! / 60 + parts[2]! / 3600;
  if (!Number.isFinite(value)) return null;
  return ref === 'S' || ref === 'W' ? -value : value;
};

/** Formats a camera date such as "2026:11:08 14:03:22" for people. */
export function prettyTaken(raw: string): string {
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/.exec(raw);
  if (!match) return raw;
  const [, y, mo, d, h, mi] = match;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(mo) - 1] ?? mo} ${y}, ${h}:${mi}`;
}

export function readPhotoFacts(buffer: ArrayBuffer): PhotoFacts {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return { ...EMPTY, extras: [] };
  const facts: PhotoFacts = { ...EMPTY, readable: true, extras: [] };
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(offset + 2);
    const start = offset + 4;
    if (length < 2 || start + length - 2 > view.byteLength) break;
    const head = (n: number) => { let s = ''; for (let i = 0; i < n && start + i < view.byteLength; i += 1) s += String.fromCharCode(view.getUint8(start + i)); return s; };
    if (marker === 0xe1) {
      if (head(6) === 'Exif\0\0') parseExif(view, start + 6, facts);
      else if (head(28).startsWith('http://ns.adobe.com/xap')) { if (!facts.extras.includes('XMP')) facts.extras.push('XMP'); }
    } else if (marker === 0xed && head(13).startsWith('Photoshop')) {
      if (!facts.extras.includes('IPTC')) facts.extras.push('IPTC');
    }
    offset += 2 + length;
  }
  return facts;
}

function parseExif(view: DataView, base: number, facts: PhotoFacts) {
  if (base + 8 > view.byteLength) return;
  const order = view.getUint16(base);
  if (order !== 0x4949 && order !== 0x4d4d) return;
  const tiff = new Tiff(view, base, order === 0x4949);
  const first = tiff.entries(tiff.u32(4));
  facts.make = tiff.text(first.get(0x010f));
  facts.model = tiff.text(first.get(0x0110));
  facts.software = tiff.text(first.get(0x0131));
  facts.artist = tiff.text(first.get(0x013b));
  facts.copyright = tiff.text(first.get(0x8298));
  facts.taken = tiff.text(first.get(0x0132));
  const exifPointer = first.get(0x8769);
  if (exifPointer) {
    const [at] = tiff.numbers({ ...exifPointer, type: 4, count: 1 }, 1);
    if (at !== undefined) {
      const inner = tiff.entries(at);
      const original = tiff.text(inner.get(0x9003));
      if (original) facts.taken = original;
    }
  }
  const gpsPointer = first.get(0x8825);
  if (gpsPointer) {
    const [at] = tiff.numbers({ ...gpsPointer, type: 4, count: 1 }, 1);
    if (at !== undefined) {
      const gps = tiff.entries(at);
      const latitude = degrees(tiff.numbers(gps.get(2), 3), tiff.text(gps.get(1)));
      const longitude = degrees(tiff.numbers(gps.get(4), 3), tiff.text(gps.get(3)));
      if (latitude !== null && longitude !== null && (latitude !== 0 || longitude !== 0)) {
        const [altitude] = tiff.numbers(gps.get(6), 1);
        facts.gps = { latitude, longitude, ...(altitude !== undefined ? { altitude } : {}) };
      }
    }
  }
}

/** True when the photo reveals anything worth removing before sharing. */
export function hasHiddenDetails(facts: PhotoFacts): boolean {
  return Boolean(facts.gps || facts.make || facts.model || facts.software || facts.taken || facts.artist || facts.copyright || facts.extras.length);
}
