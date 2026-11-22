export type GrayMode = 'gray' | 'blackwhite';

/** Turns RGBA pixels grey in place. In black and white mode, anything lighter than the threshold (0 to 255) becomes white and the rest black. */
export function toGray(data: Uint8ClampedArray, mode: GrayMode, threshold = 160): void {
  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.round(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
    const value = mode === 'blackwhite' ? (luma >= threshold ? 255 : 0) : luma;
    data[i] = value; data[i + 1] = value; data[i + 2] = value;
  }
}
