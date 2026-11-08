// ---------- Colours ----------
export interface Rgb { r: number; g: number; b: number }

export function parseHex(value: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split('').map((char) => char + char).join('') : match[1];
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

export const toHex = ({ r, g, b }: Rgb): string => `#${[r, g, b].map((part) => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, '0')).join('')}`;

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const [red, green, blue] = [r, g, b].map((part) => part / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === red) h = ((green - blue) / d) % 6;
  else if (max === green) h = (blue - red) / d + 2;
  else h = (red - green) / d + 4;
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function luminance({ r, g, b }: Rgb): number {
  const [red, green, blue] = [r, g, b].map((part) => {
    const channel = part / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// ---------- UUID ----------
export function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------- Timestamps ----------
/** Treats numbers of 12 or more digits as milliseconds, otherwise as seconds. */
export function epochToDate(input: string): Date | null {
  const text = input.trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  const ms = Math.abs(value) >= 1e11 ? value : value * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ---------- Time zones ----------
function zoneOffsetMs(zone: string, instant: number): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant (as a Date) at which the wall clock in `zone` shows the given date and time. */
export function zonedTimeToDate(date: string, time: string, zone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const wall = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  const first = wall - zoneOffsetMs(zone, wall);
  const second = wall - zoneOffsetMs(zone, first);
  return new Date(second);
}

export function formatInZone(date: Date, zone: string): { date: string; time: string; abbreviation: string } {
  const opts = { timeZone: zone } as const;
  return {
    date: date.toLocaleDateString('en-IN', { ...opts, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { ...opts, hour: '2-digit', minute: '2-digit', hour12: true }),
    abbreviation: new Intl.DateTimeFormat('en-US', { ...opts, timeZoneName: 'short' }).formatToParts(date).find((part) => part.type === 'timeZoneName')?.value ?? '',
  };
}

export const COMMON_ZONES = ['Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'Pacific/Auckland'];

// ---------- Lorem ipsum ----------
const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

function pick(random: () => number): string {
  return LOREM_WORDS[Math.floor(random() * LOREM_WORDS.length)];
}

export function loremParagraphs(count: number, sentencesPer: number, startWithLorem: boolean, random: () => number = Math.random): string[] {
  const paragraphs: string[] = [];
  for (let p = 0; p < count; p += 1) {
    const sentences: string[] = [];
    for (let s = 0; s < sentencesPer; s += 1) {
      const length = 8 + Math.floor(random() * 10);
      const words = Array.from({ length }, () => pick(random));
      if (p === 0 && s === 0 && startWithLorem) words.splice(0, 5, 'lorem', 'ipsum', 'dolor', 'sit', 'amet');
      const sentence = words.join(' ');
      sentences.push(`${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`);
    }
    paragraphs.push(sentences.join(' '));
  }
  return paragraphs;
}

// ---------- EPF ----------
export interface EpfInput {
  monthlyWage: number;
  currentBalance: number;
  years: number;
  yearlyRaisePercent: number;
  ratePercent: number;
}

export interface EpfYear { year: number; monthlyWage: number; contributed: number; interest: number; balance: number }

/**
 * Projects an EPF balance. Employee pays 12% of wage; the employer's 12% is split between EPS
 * (8.33% of wage capped at a wage of ₹15,000) and EPF. Interest is worked out monthly on the running
 * balance and credited at the end of each year, which is how EPFO describes it. Rates and the wage cap
 * change, so these are estimates.
 */
export function projectEpf({ monthlyWage, currentBalance, years, yearlyRaisePercent, ratePercent }: EpfInput) {
  let balance = currentBalance;
  let wage = monthlyWage;
  let totalEmployee = 0;
  let totalEmployer = 0;
  let totalInterest = 0;
  const rows: EpfYear[] = [];
  for (let year = 1; year <= years; year += 1) {
    const employee = wage * 0.12;
    const eps = Math.min(wage, 15000) * 0.0833;
    const employer = wage * 0.12 - eps;
    let accrued = 0;
    for (let month = 1; month <= 12; month += 1) {
      balance += employee + employer;
      accrued += (balance * ratePercent) / 1200;
    }
    balance += accrued;
    totalEmployee += employee * 12;
    totalEmployer += employer * 12;
    totalInterest += accrued;
    rows.push({ year, monthlyWage: wage, contributed: (employee + employer) * 12, interest: accrued, balance });
    wage *= 1 + yearlyRaisePercent / 100;
  }
  return { balance, totalEmployee, totalEmployer, totalInterest, rows };
}
