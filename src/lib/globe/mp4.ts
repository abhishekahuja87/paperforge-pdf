/** A small MP4 writer for one H.264 video track. Samples must already be in length-prefixed (AVCC) form, which is what the browser video encoder gives with format "avc". */

export interface Mp4Sample { data: Uint8Array; key: boolean }

const u32 = (value: number) => new Uint8Array([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
const u16 = (value: number) => new Uint8Array([(value >>> 8) & 255, value & 255]);
const ascii = (text: string) => new Uint8Array([...text].map((char) => char.charCodeAt(0)));
const join = (...parts: Uint8Array[]) => { const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let at = 0; for (const part of parts) { out.set(part, at); at += part.length; } return out; };
const box = (type: string, ...parts: Uint8Array[]) => { const body = join(...parts); return join(u32(body.length + 8), ascii(type), body); };
const full = (type: string, version: number, flags: number, ...parts: Uint8Array[]) => box(type, new Uint8Array([version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255]), ...parts);
const zeros = (count: number) => new Uint8Array(count);
const MATRIX = join(u32(0x10000), zeros(12), u32(0x10000), zeros(12), u32(0x40000000));

/** One AAC audio track: each sample is one encoded frame of 1024 sound samples. `description` is the AudioSpecificConfig from the encoder. */
export interface Mp4Audio { samples: Uint8Array[]; description: Uint8Array; sampleRate: number; channels: number }

const descriptor = (tag: number, ...parts: Uint8Array[]) => { const body = join(...parts); return join(new Uint8Array([tag, body.length]), body); };

/** Builds the whole file. `description` is the AVC decoder configuration record (avcC contents) from the encoder. A sound track is added when `audio` is given. */
export function writeMp4(samples: Mp4Sample[], description: Uint8Array, width: number, height: number, fps: number, audio?: Mp4Audio): Uint8Array {
  const scale = fps * 1000;
  const delta = 1000;
  const duration = samples.length * delta;
  const ftyp = box('ftyp', ascii('isom'), u32(512), ascii('isom'), ascii('iso2'), ascii('avc1'), ascii('mp41'));

  const stsd = full('stsd', 0, 0, u32(1), box('avc1', zeros(6), u16(1), zeros(16), u16(width), u16(height), u32(0x480000), u32(0x480000), u32(0), u16(1), zeros(32), u16(0x18), u16(0xffff), box('avcC', description)));
  const stts = full('stts', 0, 0, u32(1), u32(samples.length), u32(delta));
  const keys = samples.map((sample, index) => (sample.key ? index + 1 : 0)).filter(Boolean);
  const stss = full('stss', 0, 0, u32(keys.length), ...keys.map(u32));
  const stsc = full('stsc', 0, 0, u32(1), u32(1), u32(samples.length), u32(1));
  const stsz = full('stsz', 0, 0, u32(0), u32(samples.length), ...samples.map((sample) => u32(sample.data.length)));
  // stco holds where the data starts; it is filled in once the size of everything before it is known.
  const build = (offset: number, audioOffset = 0) => {
    const stco = full('stco', 0, 0, u32(1), u32(offset));
    const stbl = box('stbl', stsd, stts, stss, stsc, stsz, stco);
    const minf = box('minf', full('vmhd', 0, 1, zeros(8)), box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1))), stbl);
    const mdia = box('mdia', full('mdhd', 0, 0, u32(0), u32(0), u32(scale), u32(duration), u16(0x55c4), u16(0)), full('hdlr', 0, 0, u32(0), ascii('vide'), zeros(12), ascii('Video\0')), minf);
    const trak = box('trak', full('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(duration), zeros(8), u16(0), u16(0), u16(0), u16(0), MATRIX, u32(width << 16), u32(height << 16)), mdia);
    let soundTrak = new Uint8Array(0);
    if (audio) {
      const count = audio.samples.length;
      const soundDuration = count * 1024;
      const movieDuration = Math.round((soundDuration / audio.sampleRate) * scale);
      const esds = full('esds', 0, 0, descriptor(0x03, u16(0), new Uint8Array([0]), descriptor(0x04, new Uint8Array([0x40, 0x15]), zeros(3), u32(192000), u32(128000), descriptor(0x05, audio.description)), descriptor(0x06, new Uint8Array([2]))));
      const mp4a = box('mp4a', zeros(6), u16(1), zeros(8), u16(audio.channels), u16(16), u16(0), u16(0), u32((audio.sampleRate << 16) >>> 0), esds);
      const aStbl = box('stbl', full('stsd', 0, 0, u32(1), mp4a), full('stts', 0, 0, u32(1), u32(count), u32(1024)), full('stsc', 0, 0, u32(1), u32(1), u32(count), u32(1)),
        full('stsz', 0, 0, u32(0), u32(count), ...audio.samples.map((sample) => u32(sample.length))), full('stco', 0, 0, u32(1), u32(audioOffset)));
      const aMinf = box('minf', full('smhd', 0, 0, zeros(4)), box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1))), aStbl);
      const aMdia = box('mdia', full('mdhd', 0, 0, u32(0), u32(0), u32(audio.sampleRate), u32(soundDuration), u16(0x55c4), u16(0)), full('hdlr', 0, 0, u32(0), ascii('soun'), zeros(12), ascii('Sound\0')), aMinf);
      soundTrak = box('trak', full('tkhd', 0, 3, u32(0), u32(0), u32(2), u32(0), u32(movieDuration), zeros(8), u16(0), u16(0), u16(0x100), u16(0), MATRIX, u32(0), u32(0)), aMdia);
    }
    return box('moov', full('mvhd', 0, 0, u32(0), u32(0), u32(scale), u32(duration), u32(0x10000), u16(0x100), zeros(10), MATRIX, zeros(24), u32(audio ? 3 : 2)), trak, soundTrak);
  };
  const moovSize = build(0, 0).length;
  const dataStart = ftyp.length + moovSize + 8;
  const videoBytes = samples.reduce((sum, sample) => sum + sample.data.length, 0);
  const moov = build(dataStart, dataStart + videoBytes);
  const audioBytes = audio ? audio.samples.reduce((sum, sample) => sum + sample.length, 0) : 0;
  const total = videoBytes + audioBytes;
  const out = new Uint8Array(dataStart + total);
  out.set(ftyp, 0); out.set(moov, ftyp.length);
  out.set(u32(total + 8), ftyp.length + moov.length); out.set(ascii('mdat'), ftyp.length + moov.length + 4);
  let at = dataStart;
  for (const sample of samples) { out.set(sample.data, at); at += sample.data.length; }
  if (audio) for (const sample of audio.samples) { out.set(sample, at); at += sample.length; }
  return out;
}
