/** Barcode encoders for shop labels: Code 128 (any text) and EAN-13 (retail numbers). Each returns bar and space widths in modules. */

/** Code 128 widths for values 0 to 105, then the stop pattern (index 106). Each is bar, space, bar, space, bar, space. */
const CODE128 = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
const START_B = 104;
const STOP = 106;

export const CODE128_PATTERNS = CODE128;

export interface Barcode {
  /** Alternating widths in modules, starting with a bar. */
  widths: number[];
  /** Text shown under the bars. */
  label: string;
  /** Total width in modules, without the quiet zone. */
  modules: number;
}

const total = (widths: number[]) => widths.reduce((sum, w) => sum + w, 0);
const fromDigits = (pattern: string) => pattern.split('').map(Number);

/** Code 128 subset B: letters, digits and the usual symbols (ASCII 32 to 126). Throws a plain message otherwise. */
export function encodeCode128(text: string): Barcode {
  if (!text) throw new Error('Type the text or number for the barcode.');
  if (text.length > 40) throw new Error('Use 40 characters or fewer so the barcode stays easy to scan.');
  const values = [START_B];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) throw new Error('Use letters, digits and common symbols only (no accents or emoji).');
    values.push(code - 32);
  }
  const check = values.reduce((sum, value, index) => sum + value * (index === 0 ? 1 : index), 0) % 103;
  values.push(check, STOP);
  const widths = values.flatMap((value) => fromDigits(CODE128[value]!));
  return { widths, label: text, modules: total(widths) };
}

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = L.map((code) => code.split('').map((bit) => (bit === '0' ? '1' : '0')).join(''));
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** The EAN-13 check digit for the first 12 digits. */
export function eanCheckDigit(first12: string): number {
  const sum = first12.split('').reduce((acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

/** EAN-13 from 12 digits (the check digit is added) or 13 digits (the check digit is verified). */
export function encodeEan13(input: string): Barcode {
  const digits = input.replace(/\s+/g, '');
  if (!/^\d{12,13}$/.test(digits)) throw new Error('An EAN-13 barcode needs 12 digits (the last check digit is added for you) or all 13 digits.');
  const first12 = digits.slice(0, 12);
  const check = eanCheckDigit(first12);
  if (digits.length === 13 && Number(digits[12]) !== check) throw new Error(`The last digit should be ${check} for these numbers. Fix it or enter only the first 12 digits.`);
  const full = `${first12}${check}`;
  const parity = PARITY[Number(full[0])]!;
  let bits = '101';
  for (let i = 0; i < 6; i += 1) bits += (parity[i] === 'L' ? L : G)[Number(full[i + 1])];
  bits += '01010';
  for (let i = 0; i < 6; i += 1) bits += R[Number(full[i + 7])];
  bits += '101';
  const widths: number[] = [];
  let run = 1;
  for (let i = 1; i < bits.length; i += 1) {
    if (bits[i] === bits[i - 1]) run += 1; else { widths.push(run); run = 1; }
  }
  widths.push(run);
  return { widths, label: full, modules: total(widths) };
}

/** Draws bars and the text under them on a canvas. Returns the canvas width and height. */
export function drawBarcode(canvas: HTMLCanvasElement, code: Barcode, module: number, barHeight: number, showText: boolean): void {
  const quiet = 10 * module;
  const textH = showText ? Math.round(module * 7) + 6 : 0;
  canvas.width = Math.round(code.modules * module + quiet * 2);
  canvas.height = Math.round(barHeight + textH + module * 3);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot draw the barcode.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  let x = quiet;
  code.widths.forEach((width, index) => {
    if (index % 2 === 0) ctx.fillRect(x, module * 1.5, width * module, barHeight);
    x += width * module;
  });
  if (showText) {
    ctx.font = `${Math.round(module * 6)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(code.label, canvas.width / 2, module * 1.5 + barHeight + 4);
  }
}
