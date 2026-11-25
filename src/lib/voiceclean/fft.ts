/** A small in-place FFT (radix 2) for the noise remover. Sizes are powers of two. Pure code, so it can be checked on its own. */

export interface Fft { size: number; forward: (re: Float32Array, im: Float32Array) => void; inverse: (re: Float32Array, im: Float32Array) => void }

export function makeFft(size: number): Fft {
  if (size < 2 || (size & (size - 1)) !== 0) throw new Error('The FFT size must be a power of two.');
  const levels = Math.log2(size);
  const cos = new Float32Array(size / 2), sin = new Float32Array(size / 2);
  for (let i = 0; i < size / 2; i += 1) { cos[i] = Math.cos((2 * Math.PI * i) / size); sin[i] = Math.sin((2 * Math.PI * i) / size); }
  const reversed = new Uint32Array(size);
  for (let i = 0; i < size; i += 1) { let r = 0; for (let b = 0; b < levels; b += 1) r |= ((i >> b) & 1) << (levels - 1 - b); reversed[i] = r; }
  const run = (re: Float32Array, im: Float32Array, sign: 1 | -1) => {
    for (let i = 0; i < size; i += 1) { const j = reversed[i]!; if (j > i) { const tr = re[i]!; re[i] = re[j]!; re[j] = tr; const ti = im[i]!; im[i] = im[j]!; im[j] = ti; } }
    for (let span = 2; span <= size; span *= 2) {
      const half = span / 2, step = size / span;
      for (let start = 0; start < size; start += span) {
        for (let k = 0, t = 0; k < half; k += 1, t += step) {
          const wr = cos[t]!, wi = sign * -sin[t]!; const a = start + k, b = a + half;
          const xr = re[b]! * wr - im[b]! * wi, xi = re[b]! * wi + im[b]! * wr;
          re[b] = re[a]! - xr; im[b] = im[a]! - xi; re[a] = re[a]! + xr; im[a] = im[a]! + xi;
        }
      }
    }
  };
  return {
    size,
    forward: (re, im) => run(re, im, 1),
    inverse: (re, im) => { run(re, im, -1); for (let i = 0; i < size; i += 1) { re[i] = re[i]! / size; im[i] = im[i]! / size; } },
  };
}
