import type { Contact, LabelledValue } from './parser';

export type FieldGroup = 'name' | 'work' | 'phones' | 'emails' | 'urls' | 'addresses' | 'birthday' | 'categories' | 'note';

export interface TableOptions {
  groups: Record<FieldGroup, boolean>;
  /** Several phones, emails and so on: each in its own column, or all in one cell. */
  multiple: 'columns' | 'cell';
  /** Remove spaces, dashes and brackets from phone numbers (a leading + is kept). */
  cleanPhones: boolean;
  removeDuplicates: boolean;
  sort: boolean;
  /** For CSV opened in Excel: write phone numbers as ="+123" so Excel keeps the + and leading zeros. */
  protectPhones: boolean;
}

export const defaultOptions = (): TableOptions => ({
  groups: { name: true, work: true, phones: true, emails: true, urls: true, addresses: true, birthday: true, categories: false, note: false },
  multiple: 'columns', cleanPhones: false, removeDuplicates: true, sort: false, protectPhones: false,
});

export const GROUP_LABELS: Record<FieldGroup, string> = {
  name: 'Name parts', work: 'Company and title', phones: 'Phones', emails: 'Emails', urls: 'Websites', addresses: 'Addresses', birthday: 'Birthday', categories: 'Categories', note: 'Notes',
};

/** Columns for repeated values stop here; anything beyond is joined into the last column so no data is lost. */
export const MAX_REPEAT = 8;

export interface Table { headers: string[]; rows: string[][]; duplicates: number; phoneColumns: number[] }

const cleanPhone = (value: string) => { const plus = value.trim().startsWith('+'); return (plus ? '+' : '') + value.replace(/[^\d]/g, '') || value; };
const digits = (value: string) => value.replace(/\D/g, '');

const nameKey = (c: Contact) => c.full.toLowerCase().replace(/\s+/g, ' ').trim();
const phoneSet = (c: Contact) => c.phones.map((p) => digits(p.value)).filter(Boolean);
const emailSet = (c: Contact) => c.emails.map((e) => e.value.trim().toLowerCase());
const exactKey = (c: Contact) => [nameKey(c), [...phoneSet(c)].sort().join(','), [...emailSet(c)].sort().join(',')].join('|');

/**
 * Drops cards that add nothing: the same name whose phones and emails are all already on a card that is kept
 * (phones compared by digits, emails ignoring case). The richest card of each name is kept first. Cards with no name
 * are only dropped when identical.
 */
function withoutDuplicates(contacts: Contact[]): { list: Contact[]; removed: number } {
  const keep = new Set<Contact>();
  const byName = new Map<string, Contact[]>();
  const exact = new Set<string>();
  const ranked = contacts.map((c, i) => ({ c, i, size: c.phones.length + c.emails.length })).sort((a, b) => b.size - a.size || a.i - b.i);
  for (const { c } of ranked) {
    const name = nameKey(c);
    if (!name) { const key = exactKey(c); if (!exact.has(key)) { exact.add(key); keep.add(c); } continue; }
    const kept = byName.get(name) ?? [];
    const phones = new Set(kept.flatMap(phoneSet));
    const emails = new Set(kept.flatMap(emailSet));
    if (kept.length > 0 && phoneSet(c).every((p) => phones.has(p)) && emailSet(c).every((e) => emails.has(e))) continue;
    kept.push(c);
    byName.set(name, kept);
    keep.add(c);
  }
  return { list: contacts.filter((c) => keep.has(c)), removed: contacts.length - keep.size };
}

export function buildTable(contacts: Contact[], options: TableOptions): Table {
  let list = contacts;
  let duplicates = 0;
  if (options.removeDuplicates) {
    const result = withoutDuplicates(contacts);
    list = result.list;
    duplicates = result.removed;
  }
  if (options.sort) list = [...list].sort((a, b) => (a.last || a.full).localeCompare(b.last || b.full, undefined, { sensitivity: 'base' }) || a.first.localeCompare(b.first, undefined, { sensitivity: 'base' }));

  const g = options.groups;
  const headers: string[] = [];
  const getters: ((c: Contact) => string)[] = [];
  const add = (header: string, get: (c: Contact) => string) => { headers.push(header); getters.push(get); };

  if (g.name) {
    add('Full name', (c) => c.full);
    add('Prefix', (c) => c.prefix); add('First name', (c) => c.first); add('Middle name', (c) => c.middle); add('Last name', (c) => c.last); add('Suffix', (c) => c.suffix); add('Nickname', (c) => c.nickname);
  }
  if (g.work) { add('Company', (c) => c.org); add('Department', (c) => c.department); add('Job title', (c) => c.title); }

  const repeated = (header: string, pick: (c: Contact) => LabelledValue[], format: (v: string) => string) => {
    if (options.multiple === 'cell') {
      add(header, (c) => pick(c).map((v) => (v.type ? `${format(v.value)} (${v.type})` : format(v.value))).join('; '));
      return;
    }
    const most = Math.min(MAX_REPEAT, list.reduce((m, c) => Math.max(m, pick(c).length), 0));
    for (let i = 0; i < most; i += 1) {
      const last = i === MAX_REPEAT - 1;
      add(`${header} ${i + 1}`, (c) => (last ? pick(c).slice(i).map((v) => format(v.value)).join('; ') : format(pick(c)[i]?.value ?? '')));
      add(`${header} ${i + 1} type`, (c) => (last ? '' : pick(c)[i]?.type ?? ''));
    }
  };
  if (g.phones) repeated('Phone', (c) => c.phones, (v) => (options.cleanPhones ? cleanPhone(v) : v));
  if (g.emails) repeated('Email', (c) => c.emails, (v) => v);
  if (g.urls) repeated('Website', (c) => c.urls, (v) => v);
  if (g.addresses) repeated('Address', (c) => c.addresses, (v) => v);
  if (g.birthday) add('Birthday', (c) => c.birthday);
  if (g.categories) add('Categories', (c) => c.categories);
  if (g.note) add('Notes', (c) => c.note);

  const rows = list.map((c) => getters.map((get) => get(c)));
  const phoneColumns = headers.map((h, i) => (/^Phone( \d+)?$/.test(h) ? i : -1)).filter((i) => i >= 0);
  return { headers, rows, duplicates, phoneColumns };
}
