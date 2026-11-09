/**
 * QR Code encoder (byte mode, versions 1 to 40). It follows ISO/IEC 18004: Reed-Solomon error
 * correction over GF(256), the eight mask patterns and the penalty rules to pick the best one.
 */

export type EccLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrCode {
  version: number;
  size: number;
  ecc: EccLevel;
  mask: number;
  /** modules[y][x] is true for a dark module. */
  modules: boolean[][];
}

const ECC_INDEX: Record<EccLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };
const FORMAT_BITS: Record<EccLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

const ECC_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

const BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

export const MAX_VERSION = 40;

const rawModules = (version: number): number => {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
};

const dataCodewords = (version: number, ecc: EccLevel): number =>
  Math.floor(rawModules(version) / 8) - ECC_PER_BLOCK[ECC_INDEX[ecc]][version] * BLOCKS[ECC_INDEX[ecc]][version];

const countBits = (version: number): number => (version <= 9 ? 8 : 16);

/** Largest number of bytes that fit at this error correction level, or 0 if none do. */
export function maxBytes(ecc: EccLevel): number {
  return Math.floor((dataCodewords(MAX_VERSION, ecc) * 8 - 4 - countBits(MAX_VERSION)) / 8);
}

// Reed-Solomon over GF(256) with polynomial 0x11D.
const gfMultiply = (x: number, y: number): number => {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
};

const rsDivisor = (degree: number): number[] => {
  const result: number[] = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
};

const rsRemainder = (data: number[], divisor: number[]): number[] => {
  const result: number[] = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => { result[i] ^= gfMultiply(coef, factor); });
  }
  return result;
};

const bit = (value: number, index: number): boolean => ((value >>> index) & 1) !== 0;

class Builder {
  readonly version: number;
  readonly size: number;
  readonly modules: boolean[][];
  private readonly ecc: EccLevel;
  private readonly fixed: boolean[][];

  constructor(version: number, ecc: EccLevel) {
    this.version = version;
    this.ecc = ecc;
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.fixed = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.drawFunctionPatterns();
  }

  private set(x: number, y: number, dark: boolean): void {
    this.modules[y][x] = dark;
    this.fixed[y][x] = true;
  }

  private drawFunctionPatterns(): void {
    const { size } = this;
    for (let i = 0; i < size; i += 1) { this.set(6, i, i % 2 === 0); this.set(i, 6, i % 2 === 0); }
    this.finder(3, 3); this.finder(size - 4, 3); this.finder(3, size - 4);
    const positions = this.alignmentPositions();
    const last = positions.length - 1;
    positions.forEach((px, i) => positions.forEach((py, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      this.alignment(px, py);
    }));
    this.formatBits(0);
    this.versionBits();
  }

  private finder(cx: number, cy: number): void {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) this.set(x, y, dist !== 2 && dist !== 4);
      }
    }
  }

  private alignment(cx: number, cy: number): void {
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) this.set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  private alignmentPositions(): number[] {
    const { version, size } = this;
    if (version === 1) return [];
    const count = Math.floor(version / 7) + 2;
    const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
    const result = [6];
    for (let pos = size - 7; result.length < count; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  private formatBits(mask: number): void {
    const data = (FORMAT_BITS[this.ecc] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const { size } = this;
    for (let i = 0; i <= 5; i += 1) this.set(8, i, bit(bits, i));
    this.set(8, 7, bit(bits, 6)); this.set(8, 8, bit(bits, 7)); this.set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i += 1) this.set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i += 1) this.set(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i += 1) this.set(8, size - 15 + i, bit(bits, i));
    this.set(8, size - 8, true);
  }

  private versionBits(): void {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i += 1) {
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.set(a, b, bit(bits, i));
      this.set(b, a, bit(bits, i));
    }
  }

  placeData(codewords: number[]): void {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert += 1) {
        for (let j = 0; j < 2; j += 1) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.fixed[y][x] && i < codewords.length * 8) {
            this.modules[y][x] = bit(codewords[i >>> 3], 7 - (i & 7));
            i += 1;
          }
        }
      }
    }
  }

  applyMask(mask: number): void {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        let invert: boolean;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0; break;
          default: invert = ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0; break;
        }
        if (!this.fixed[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  setFormat(mask: number): void { this.formatBits(mask); }

  penalty(): number {
    const { size, modules } = this;
    let result = 0;
    const lineScore = (get: (i: number) => boolean) => {
      let score = 0;
      let run = 1;
      for (let i = 1; i < size; i += 1) {
        if (get(i) === get(i - 1)) { run += 1; if (run === 5) score += 3; else if (run > 5) score += 1; } else run = 1;
      }
      const window = [true, false, true, true, true, false, true];
      for (let i = 0; i + 7 <= size; i += 1) {
        if (window.every((value, k) => get(i + k) === value)) {
          const before = i >= 4 && [1, 2, 3, 4].every((k) => !get(i - k));
          const after = i + 11 <= size && [7, 8, 9, 10].every((k) => !get(i + k));
          if (before) score += 40;
          if (after) score += 40;
        }
      }
      return score;
    };
    for (let y = 0; y < size; y += 1) result += lineScore((i) => modules[y][i]);
    for (let x = 0; x < size; x += 1) result += lineScore((i) => modules[i][x]);
    for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) result += 3;
    }
    const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    const total = size * size;
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return result;
  }
}

function buildCodewords(bytes: number[], version: number, ecc: EccLevel): number[] {
  const capacity = dataCodewords(version, ecc);
  const bits: number[] = [];
  const push = (value: number, length: number) => { for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, countBits(version));
  bytes.forEach((byte) => push(byte, 8));
  push(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  for (let pad = 0xec; bits.length < capacity * 8; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));

  const blocks = BLOCKS[ECC_INDEX[ecc]][version];
  const eccLen = ECC_PER_BLOCK[ECC_INDEX[ecc]][version];
  const raw = Math.floor(rawModules(version) / 8);
  const shortBlocks = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const divisor = rsDivisor(eccLen);
  const parts: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i += 1) {
    const chunk = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1));
    k += chunk.length;
    const check = rsRemainder(chunk, divisor);
    if (i < shortBlocks) chunk.push(0);
    parts.push(chunk.concat(check));
  }
  const result: number[] = [];
  for (let i = 0; i < parts[0].length; i += 1) {
    parts.forEach((part, j) => { if (i !== shortLen - eccLen || j >= shortBlocks) result.push(part[i]); });
  }
  return result;
}

/** Encodes text as a QR code. Throws if it does not fit in version 40 at the chosen level. */
export function encodeQr(text: string, ecc: EccLevel = 'M', boostEcc = true): QrCode {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 1;
  while (version <= MAX_VERSION && 4 + countBits(version) + bytes.length * 8 > dataCodewords(version, ecc) * 8) version += 1;
  if (version > MAX_VERSION) throw new RangeError('Too much data for a QR code at this error correction level.');
  let level = ecc;
  if (boostEcc) {
    for (const higher of ['M', 'Q', 'H'] as EccLevel[]) {
      if (ECC_INDEX[higher] > ECC_INDEX[level] && 4 + countBits(version) + bytes.length * 8 <= dataCodewords(version, higher) * 8) level = higher;
    }
  }
  const codewords = buildCodewords(bytes, version, level);
  let best: Builder | null = null;
  let bestMask = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const builder = new Builder(version, level);
    builder.placeData(codewords);
    builder.applyMask(mask);
    builder.setFormat(mask);
    const score = builder.penalty();
    if (score < bestScore) { best = builder; bestMask = mask; bestScore = score; }
  }
  const chosen = best as Builder;
  return { version, size: chosen.size, ecc: level, mask: bestMask, modules: chosen.modules };
}
