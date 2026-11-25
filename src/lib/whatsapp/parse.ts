/**
 * Reading a WhatsApp "Export chat" text file. It handles the Android style ("12/03/2024, 9:41 pm - Riya: Hello") and the iPhone style
 * ("[12/03/2024, 9:41:05 PM] Riya: Hello"), 12 and 24 hour clocks, day-first and month-first dates, messages that run over several lines,
 * system notes, photos and deleted messages. Everything happens on the device.
 */
export type MessageKind = 'text' | 'media' | 'deleted' | 'system';
export type DateOrder = 'dmy' | 'mdy';

export interface ChatMessage {
  /** Local date as YYYY-MM-DD. */
  day: string;
  /** Minutes after midnight. */
  minutes: number;
  /** Null for system notes such as "Messages are end-to-end encrypted". */
  sender: string | null;
  text: string;
  kind: MessageKind;
  /** For a photo or file message, the name of the file the export mentions. */
  file?: string;
}

export interface Chat {
  messages: ChatMessage[];
  /** People in the order they first wrote. */
  senders: string[];
  /** The date order that was used. */
  order: DateOrder;
  /** True when the dates could be read either way and nothing in the file settled it. */
  ambiguous: boolean;
}

interface Raw { a: number; b: number; c: number; hour: number; minute: number; mark: string; rest: string; lines: string[] }

const HEADER = /^[‎‏﻿]*\[?(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4}),?[\s ]+(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?[\s ]*([ap]\.?\s?m\.?)?(?:\][\s ]*|[\s ]-[\s ]+)(.*)$/i;
const MEDIA_LINE = /^(?:<media omitted>|<attached:\s*(.+?)>|(.+?)\s*\(file attached\)|(?:image|video|audio|sticker|gif|document|contact card|photo)\s+omitted|null)$/i;
const DELETED = /^(?:this message was deleted|you deleted this message|<this message was deleted>)\.?$/i;
const EDITED = /\s*<this message was edited>\s*$/i;
const clean = (text: string) => text.replace(/[‎‏‪-‮]/g, '');

const pad = (n: number) => String(n).padStart(2, '0');

/** Reads the whole exported text. `order` forces the date order; leave it out to work it out from the dates. */
export function parseChat(text: string, order?: DateOrder): Chat {
  const raws: Raw[] = [];
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const match = HEADER.exec(line);
    if (match) {
      raws.push({ a: Number(match[1]), b: Number(match[2]), c: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]), mark: (match[6] ?? '').toLowerCase().replace(/[.\s]/g, ''), rest: match[7] ?? '', lines: [] });
    } else if (raws.length > 0) raws[raws.length - 1]!.lines.push(line);
  }
  // Settle the date order: a first number above 12 can only be a day, a second number above 12 can only be a day too.
  const yearFirst = raws.length > 0 && raws.every((raw) => raw.a > 31);
  const dayFirstProof = raws.some((raw) => !yearFirst && raw.a > 12), monthFirstProof = raws.some((raw) => !yearFirst && raw.b > 12);
  const ambiguous = !order && !yearFirst && dayFirstProof === monthFirstProof;
  const used: DateOrder = order ?? (monthFirstProof && !dayFirstProof ? 'mdy' : 'dmy');

  const messages: ChatMessage[] = [];
  const senders: string[] = [];
  for (const raw of raws) {
    let year: number, month: number, day: number;
    if (yearFirst) { year = raw.a; month = raw.b; day = raw.c; }
    else { year = raw.c; if (used === 'dmy') { day = raw.a; month = raw.b; } else { month = raw.a; day = raw.b; } }
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    let hour = raw.hour;
    if (raw.mark.startsWith('p') && hour < 12) hour += 12;
    if (raw.mark.startsWith('a') && hour === 12) hour = 0;
    const body = clean([raw.rest, ...raw.lines].join('\n')).replace(/\n+$/, '');
    const split = /^([^:\n"]{1,60}?):[\s ]([\s\S]*)$/.exec(body);
    const sender = split ? split[1]!.trim() : null;
    let content = (split ? split[2]! : body).replace(EDITED, '');
    let kind: MessageKind = sender === null ? 'system' : 'text';
    let file: string | undefined;
    if (sender !== null) {
      const first = content.split('\n')[0]!.trim();
      const media = MEDIA_LINE.exec(first);
      if (media) { kind = 'media'; file = (media[1] ?? media[2])?.trim(); content = content.split('\n').slice(1).join('\n'); }
      else if (DELETED.test(content.trim())) kind = 'deleted';
      if (!senders.includes(sender)) senders.push(sender);
    }
    messages.push({ day: `${year}-${pad(month)}-${pad(day)}`, minutes: hour * 60 + raw.minute, sender, text: content, kind, file });
  }
  return { messages, senders, order: used, ambiguous };
}

export interface Filter {
  from: string;
  to: string;
  /** People to leave out. */
  hidden: string[];
  search: string;
  system: boolean;
  media: boolean;
  deleted: boolean;
}

/** The messages that pass the person's choices, in their original order. */
export function filterChat(chat: Chat, filter: Filter): ChatMessage[] {
  const needle = filter.search.trim().toLowerCase();
  return chat.messages.filter((message) => {
    if (filter.from && message.day < filter.from) return false;
    if (filter.to && message.day > filter.to) return false;
    if (message.kind === 'system') return filter.system;
    if (message.sender && filter.hidden.includes(message.sender)) return false;
    if (message.kind === 'media' && !filter.media) return false;
    if (message.kind === 'deleted' && !filter.deleted) return false;
    if (needle && !message.text.toLowerCase().includes(needle)) return false;
    return true;
  });
}

/** Hides the middle of anything that looks like a phone number, keeping the last three digits. */
export function maskNumbers(text: string): string {
  return text.replace(/\+?\d[\d\s\-()]{6,}\d/g, (found) => { const digits = found.replace(/\D/g, ''); return digits.length < 8 ? found : `${found.trim().startsWith('+') ? '+' : ''}•••••${digits.slice(-3)}`; });
}

export interface Summary { total: number; days: number; first: string; last: string; busiest: { day: string; count: number } | null; people: { name: string; count: number }[] }

/** Totals for the summary page. System notes are not counted. */
export function summarise(messages: ChatMessage[]): Summary {
  const people = new Map<string, number>(), perDay = new Map<string, number>();
  let total = 0;
  for (const message of messages) {
    if (message.kind === 'system' || !message.sender) continue;
    total += 1; people.set(message.sender, (people.get(message.sender) ?? 0) + 1); perDay.set(message.day, (perDay.get(message.day) ?? 0) + 1);
  }
  let busiest: Summary['busiest'] = null;
  for (const [day, count] of perDay) if (!busiest || count > busiest.count) busiest = { day, count };
  const all = messages.map((message) => message.day).sort();
  return { total, days: perDay.size, first: all[0] ?? '', last: all[all.length - 1] ?? '', busiest, people: [...people].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count) };
}
