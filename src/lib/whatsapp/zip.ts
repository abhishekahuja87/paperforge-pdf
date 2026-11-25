/**
 * Reading a .zip file the person picked, without a library. WhatsApp's "Export chat, include media" makes a zip with the chat as a text file and the photos beside it.
 * Only the list of files is read at first; a file is unpacked when it is asked for. The browser's own DecompressionStream does the unpacking.
 */
export interface ZipArchive {
  /** Every file name inside, with folders. */
  names: string[];
  /** The bytes of one file, or null when it cannot be read. */
  read: (name: string) => Promise<Blob | null>;
}

interface Entry { name: string; method: number; compressed: number; offset: number }

const u16 = (view: DataView, at: number) => view.getUint16(at, true);
const u32 = (view: DataView, at: number) => view.getUint32(at, true);

/** True when the first bytes of the file say it is a zip. */
export async function looksLikeZip(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return head[0] === 0x50 && head[1] === 0x4b && (head[2] === 3 || head[2] === 5);
}

/** Opens a zip. Rejects when it is damaged, empty or too new for this reader (very large zip64 files). */
export async function openZip(file: File): Promise<ZipArchive> {
  const tailSize = Math.min(file.size, 66000);
  const tail = new DataView(await file.slice(file.size - tailSize).arrayBuffer());
  let end = -1;
  for (let at = tailSize - 22; at >= 0; at -= 1) { if (u32(tail, at) === 0x06054b50) { end = at; break; } }
  if (end < 0) throw new Error('Not a zip.');
  const count = u16(tail, end + 10), size = u32(tail, end + 12), offset = u32(tail, end + 16);
  if (count === 0xffff || size === 0xffffffff || offset === 0xffffffff) throw new Error('Too large for this reader.');
  const dir = new DataView(await file.slice(offset, offset + size).arrayBuffer());
  const decoder = new TextDecoder('utf-8');
  const entries = new Map<string, Entry>();
  let at = 0;
  for (let n = 0; n < count && at + 46 <= dir.byteLength; n += 1) {
    if (u32(dir, at) !== 0x02014b50) break;
    const method = u16(dir, at + 10), compressed = u32(dir, at + 20), nameLength = u16(dir, at + 28), extra = u16(dir, at + 30), comment = u16(dir, at + 32), local = u32(dir, at + 42);
    const name = decoder.decode(new Uint8Array(dir.buffer, dir.byteOffset + at + 46, nameLength));
    if (!name.endsWith('/')) entries.set(name, { name, method, compressed, offset: local });
    at += 46 + nameLength + extra + comment;
  }
  if (entries.size === 0) throw new Error('Empty zip.');

  const read = async (name: string): Promise<Blob | null> => {
    const entry = entries.get(name); if (!entry) return null;
    try {
      const head = new DataView(await file.slice(entry.offset, entry.offset + 30).arrayBuffer());
      if (u32(head, 0) !== 0x04034b50) return null;
      const from = entry.offset + 30 + u16(head, 26) + u16(head, 28);
      const raw = file.slice(from, from + entry.compressed);
      if (entry.method === 0) return raw;
      if (entry.method !== 8 || typeof DecompressionStream === 'undefined') return null;
      return await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
    } catch { return null; }
  };
  return { names: [...entries.keys()], read };
}

/** The last part of a path, so a photo is found whether or not it sits in a folder. */
export const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);
