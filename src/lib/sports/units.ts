const INCH = 0.0254;

const trim = (value: number, digits: number) => Number(value.toFixed(digits)).toString();

/** "5 ft 1 in" for a length in metres. Under a foot it is just inches. */
export function feetInches(metres: number): string {
  const total = metres / INCH;
  let feet = Math.floor(total / 12);
  let inches = Math.round((total - feet * 12) * 10) / 10;
  if (inches >= 12) { feet += 1; inches = 0; }
  if (feet === 0) return `${trim(inches, 1)} in`;
  return `${feet} ft ${trim(inches, 1)} in`;
}

/** "13.4 m (44 ft 0 in)". Metres to three decimals at most, without trailing zeros. */
export function formatLength(metres: number): string {
  const digits = metres < 10 ? 3 : 2;
  return `${trim(metres, digits)} m (${feetInches(metres)})`;
}

/** Metres from a value typed in metres or feet. */
export const toMetres = (value: number, unit: 'm' | 'ft'): number => (unit === 'ft' ? value * 0.3048 : value);

/** Short form for labels on a drawing: "13.4 m (43'11.6")". */
export function shortLength(metres: number): string {
  const total = metres / INCH;
  let feet = Math.floor(total / 12);
  let inches = Math.round((total - feet * 12) * 10) / 10;
  if (inches >= 12) { feet += 1; inches = 0; }
  return `${trim(metres, metres < 10 ? 3 : 2)} m (${feet}'${trim(inches, 1)}")`;
}
