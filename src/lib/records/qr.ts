import { encodeQr } from '../qr/encoder';
import { fillRect, type Ctx } from './draw';

/** Draws a QR code as vector squares inside a box of `size` mm, with a white quiet zone around it. Returns false when the text is too long for a code. */
export function drawQr(c: Ctx, x: number, y: number, size: number, text: string): boolean {
  let qr;
  try { qr = encodeQr(text, 'M'); } catch { return false; }
  const quiet = 3;
  const cell = size / (qr.size + quiet * 2);
  fillRect(c, x, y, size, size, '#ffffff');
  for (let row = 0; row < qr.size; row += 1) {
    let col = 0;
    while (col < qr.size) {
      if (!qr.modules[row]![col]) { col += 1; continue; }
      let end = col;
      while (end < qr.size && qr.modules[row]![end]) end += 1;
      fillRect(c, x + (col + quiet) * cell, y + (row + quiet) * cell, (end - col) * cell + 0.02, cell + 0.02, '#000000');
      col = end;
    }
  }
  return true;
}
