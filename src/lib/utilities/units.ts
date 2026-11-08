export interface UnitDef { id: string; label: string; factor: number }
export interface UnitCategory { id: string; label: string; units: UnitDef[]; special?: 'temperature' }

/** Factors convert one unit to the category's base unit (metre, gram, square metre, litre, m/s, byte). */
export const UNIT_CATEGORIES: UnitCategory[] = [
  { id: 'length', label: 'Length', units: [
    { id: 'mm', label: 'Millimetre (mm)', factor: 0.001 }, { id: 'cm', label: 'Centimetre (cm)', factor: 0.01 },
    { id: 'm', label: 'Metre (m)', factor: 1 }, { id: 'km', label: 'Kilometre (km)', factor: 1000 },
    { id: 'in', label: 'Inch (in)', factor: 0.0254 }, { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
    { id: 'yd', label: 'Yard (yd)', factor: 0.9144 }, { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
  ] },
  { id: 'weight', label: 'Weight', units: [
    { id: 'mg', label: 'Milligram (mg)', factor: 0.001 }, { id: 'g', label: 'Gram (g)', factor: 1 },
    { id: 'kg', label: 'Kilogram (kg)', factor: 1000 }, { id: 'quintal', label: 'Quintal (100 kg)', factor: 100_000 },
    { id: 'tonne', label: 'Tonne (1000 kg)', factor: 1_000_000 }, { id: 'oz', label: 'Ounce (oz)', factor: 28.349523125 },
    { id: 'lb', label: 'Pound (lb)', factor: 453.59237 },
  ] },
  { id: 'area', label: 'Area', units: [
    { id: 'sqm', label: 'Square metre (sq m)', factor: 1 }, { id: 'sqft', label: 'Square foot (sq ft)', factor: 0.09290304 },
    { id: 'sqyd', label: 'Square yard (sq yd)', factor: 0.83612736 }, { id: 'acre', label: 'Acre', factor: 4046.8564224 },
    { id: 'hectare', label: 'Hectare', factor: 10_000 }, { id: 'sqkm', label: 'Square kilometre (sq km)', factor: 1_000_000 },
  ] },
  { id: 'volume', label: 'Volume', units: [
    { id: 'ml', label: 'Millilitre (ml)', factor: 0.001 }, { id: 'l', label: 'Litre (l)', factor: 1 },
    { id: 'm3', label: 'Cubic metre (m³)', factor: 1000 }, { id: 'usgal', label: 'US gallon', factor: 3.785411784 },
    { id: 'floz', label: 'US fluid ounce', factor: 0.0295735295625 }, { id: 'cup', label: 'US cup', factor: 0.2365882365 },
  ] },
  { id: 'speed', label: 'Speed', units: [
    { id: 'kmh', label: 'Kilometre per hour (km/h)', factor: 1 / 3.6 }, { id: 'ms', label: 'Metre per second (m/s)', factor: 1 },
    { id: 'mph', label: 'Mile per hour (mph)', factor: 0.44704 }, { id: 'knot', label: 'Knot', factor: 0.514444444 },
  ] },
  { id: 'data', label: 'Data size', units: [
    { id: 'b', label: 'Byte (B)', factor: 1 }, { id: 'kb', label: 'Kilobyte (KB, 1024 B)', factor: 1024 },
    { id: 'mb', label: 'Megabyte (MB)', factor: 1024 ** 2 }, { id: 'gb', label: 'Gigabyte (GB)', factor: 1024 ** 3 },
    { id: 'tb', label: 'Terabyte (TB)', factor: 1024 ** 4 },
  ] },
  { id: 'temperature', label: 'Temperature', special: 'temperature', units: [
    { id: 'c', label: 'Celsius (°C)', factor: 1 }, { id: 'f', label: 'Fahrenheit (°F)', factor: 1 }, { id: 'k', label: 'Kelvin (K)', factor: 1 },
  ] },
];

export function convertUnit(category: UnitCategory, value: number, fromId: string, toId: string): number {
  if (category.special === 'temperature') {
    const celsius = fromId === 'f' ? ((value - 32) * 5) / 9 : fromId === 'k' ? value - 273.15 : value;
    return toId === 'f' ? (celsius * 9) / 5 + 32 : toId === 'k' ? celsius + 273.15 : celsius;
  }
  const from = category.units.find((unit) => unit.id === fromId);
  const to = category.units.find((unit) => unit.id === toId);
  if (!from || !to) return NaN;
  return (value * from.factor) / to.factor;
}
