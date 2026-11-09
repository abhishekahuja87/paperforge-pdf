/** Code 128 (set B) barcodes: printable ASCII 32 to 126, which covers product codes, SKUs and text. */

// Bar and space widths for symbol values 0 to 105 (start B is 104); the stop symbol has 7 elements.
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232',
];
const STOP = '2331112';
const START_B = 104;

export const MAX_CODE_LENGTH = 40;

/** True when every character can be written in set B. */
export const canEncode128 = (text: string): boolean => text.length > 0 && text.length <= MAX_CODE_LENGTH && /^[\x20-\x7e]+$/.test(text);

/** Symbol values for the text, including the start symbol and check digit but not the stop symbol. */
export function code128Values(text: string): number[] {
  const values = [START_B, ...Array.from(text, (ch) => ch.charCodeAt(0) - 32)];
  const check = values.reduce((sum, value, index) => sum + value * (index === 0 ? 1 : index), 0) % 103;
  return [...values, check];
}

/** Dark and light run lengths in modules, starting with a dark bar. Includes the stop bar. Empty when the text cannot be encoded. */
export function code128Runs(text: string): number[] {
  if (!canEncode128(text)) return [];
  const runs: number[] = [];
  for (const value of code128Values(text)) PATTERNS[value].split('').forEach((width) => runs.push(Number(width)));
  STOP.split('').forEach((width) => runs.push(Number(width)));
  return runs;
}

/** Width of the symbol in modules, without the quiet zones. */
export const code128Modules = (text: string): number => code128Runs(text).reduce((sum, run) => sum + run, 0);

/** SVG path data (units are modules) for the dark bars, with `quiet` empty modules each side. Height is `height` units. */
export function code128Svg(text: string, height = 40, quiet = 10, color = '#000000'): string {
  const runs = code128Runs(text);
  if (runs.length === 0) return '';
  let x = quiet;
  let path = '';
  runs.forEach((run, index) => {
    if (index % 2 === 0) path += `M${x} 0h${run}v${height}h-${run}z`;
    x += run;
  });
  const width = x + quiet;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" shape-rendering="crispEdges"><path d="${path}" fill="${color}"/></svg>`;
}
