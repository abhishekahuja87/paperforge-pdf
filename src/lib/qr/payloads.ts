/** Builds the text stored inside a QR code for each kind of content phones understand. */

export type QrKind = 'url' | 'text' | 'whatsapp' | 'wifi' | 'contact' | 'email' | 'phone' | 'sms' | 'geo' | 'event';

export interface WifiFields { ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean }
export interface ContactFields { first: string; last: string; org: string; title: string; phone: string; email: string; website: string; address: string; note: string }
export interface WhatsAppFields { number: string; message: string }
export interface EmailFields { to: string; subject: string; body: string }
export interface SmsFields { number: string; message: string }
export interface GeoFields { lat: string; lng: string }
export interface EventFields { title: string; start: string; end: string; location: string; description: string; allDay: boolean }

export const defaultWifi = (): WifiFields => ({ ssid: '', password: '', security: 'WPA', hidden: false });
export const defaultContact = (): ContactFields => ({ first: '', last: '', org: '', title: '', phone: '', email: '', website: '', address: '', note: '' });
export const defaultWhatsApp = (): WhatsAppFields => ({ number: '', message: '' });
export const defaultEmail = (): EmailFields => ({ to: '', subject: '', body: '' });
export const defaultSms = (): SmsFields => ({ number: '', message: '' });
export const defaultGeo = (): GeoFields => ({ lat: '', lng: '' });
export const defaultEvent = (): EventFields => ({ title: '', start: '', end: '', location: '', description: '', allDay: false });

/** Wi-Fi codes escape backslash, semicolon, comma, colon and double quote. */
const wifiEscape = (value: string) => value.replace(/([\\;,:"])/g, '\\$1');

export function wifiPayload({ ssid, password, security, hidden }: WifiFields): string {
  if (!ssid) return '';
  const pass = security === 'nopass' ? '' : `P:${wifiEscape(password)};`;
  return `WIFI:T:${security};S:${wifiEscape(ssid)};${pass}${hidden ? 'H:true;' : ''};`;
}

/** vCard text values escape backslash, comma, semicolon and line breaks. */
const vcardEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

export function contactPayload(c: ContactFields): string {
  const name = [c.first, c.last].filter(Boolean).join(' ');
  if (!name && !c.org) return '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vcardEscape(c.last)};${vcardEscape(c.first)};;;`, `FN:${vcardEscape(name || c.org)}`];
  if (c.org) lines.push(`ORG:${vcardEscape(c.org)}`);
  if (c.title) lines.push(`TITLE:${vcardEscape(c.title)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone.replace(/[^\d+]/g, '')}`);
  if (c.email) lines.push(`EMAIL:${c.email.trim()}`);
  if (c.website) lines.push(`URL:${c.website.trim()}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${vcardEscape(c.address)};;;;`);
  if (c.note) lines.push(`NOTE:${vcardEscape(c.note)}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export function urlPayload(value: string): string {
  const text = value.trim();
  if (!text) return '';
  return /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
}

/** wa.me link that opens a WhatsApp chat with the number, with an optional first message filled in. The number needs its country code. */
export function whatsappPayload({ number, message }: WhatsAppFields): string {
  const digits = number.replace(/\D/g, '').replace(/^00/, '');
  if (digits.length < 7) return '';
  return `https://wa.me/${digits}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`;
}

export function emailPayload({ to, subject, body }: EmailFields): string {
  if (!to.trim()) return '';
  const params = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean).join('&');
  return `mailto:${to.trim()}${params ? `?${params}` : ''}`;
}

export const phonePayload = (value: string): string => {
  const digits = value.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};

export function smsPayload({ number, message }: SmsFields): string {
  const digits = number.replace(/[^\d+]/g, '');
  return digits ? `SMSTO:${digits}:${message}` : '';
}

export function geoPayload({ lat, lng }: GeoFields): string {
  const a = Number(lat);
  const b = Number(lng);
  if (lat.trim() === '' || lng.trim() === '' || !Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180) return '';
  return `geo:${a},${b}`;
}

/** Converts a datetime-local value (or a date for all-day events) to iCalendar basic format. */
const icalDate = (value: string, allDay: boolean): string => {
  const digits = value.replace(/[-:]/g, '');
  if (allDay) return digits.slice(0, 8);
  return digits.length === 13 ? `${digits}00` : digits;
};

export function eventPayload(e: EventFields): string {
  if (!e.title.trim() || !e.start) return '';
  const tag = e.allDay ? ';VALUE=DATE' : '';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `SUMMARY:${vcardEscape(e.title)}`, `DTSTART${tag}:${icalDate(e.start, e.allDay)}`];
  if (e.end) lines.push(`DTEND${tag}:${icalDate(e.end, e.allDay)}`);
  if (e.location) lines.push(`LOCATION:${vcardEscape(e.location)}`);
  if (e.description) lines.push(`DESCRIPTION:${vcardEscape(e.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
}

/** Relative luminance of a #rrggbb colour, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const channel = (offset: number) => {
    const v = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG-style contrast ratio between two colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
