/**
 * Streaming vCard (.vcf) reader for versions 2.1, 3.0 and 4.0. Text is fed in chunks of any size, so a file of
 * hundreds of megabytes never has to be held as one string. Handles line folding, quoted-printable text,
 * grouped properties (item1.TEL with a separate label), escapes, and skips embedded photos.
 */

export interface LabelledValue { value: string; type: string }

export interface Contact {
  prefix: string; first: string; middle: string; last: string; suffix: string; full: string; nickname: string;
  org: string; department: string; title: string;
  phones: LabelledValue[]; emails: LabelledValue[]; urls: LabelledValue[]; addresses: LabelledValue[];
  birthday: string; categories: string; note: string;
}

const emptyContact = (): Contact => ({
  prefix: '', first: '', middle: '', last: '', suffix: '', full: '', nickname: '', org: '', department: '', title: '',
  phones: [], emails: [], urls: [], addresses: [], birthday: '', categories: '', note: '',
});

const SKIP = new Set(['PHOTO', 'LOGO', 'SOUND', 'KEY']);
const NOT_TYPES = new Set(['VOICE', 'PREF', 'INTERNET', 'X400', 'PERSONAL']);
const PARAM_NAMES = new Set(['ENCODING', 'CHARSET', 'LANGUAGE', 'VALUE', 'PREF', 'TYPE', 'LABEL', 'GEO', 'TZ', 'ALTID', 'PID', 'MEDIATYPE']);

/** Splits on a separator that is not escaped with a backslash and not inside double quotes. */
function splitOutside(text: string, sep: string, honourQuotes: boolean): string[] {
  const parts: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && !honourQuotes && i + 1 < text.length) { current += ch + text[i + 1]; i += 1; continue; }
    if (honourQuotes && ch === '"') { quoted = !quoted; current += ch; continue; }
    if (ch === sep && !quoted) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  parts.push(current);
  return parts;
}

const unescapeText = (value: string): string => value.replace(/\r\n?/g, '\n').replace(/\\([nN,;\\])/g, (_m, ch: string) => (ch === 'n' || ch === 'N' ? '\n' : ch));

const decodeQuotedPrintable = (value: string, charset: string): string => {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '=' && /^[0-9A-Fa-f]{2}$/.test(value.slice(i + 1, i + 3))) { bytes.push(parseInt(value.slice(i + 1, i + 3), 16)); i += 2; }
    else if (ch.charCodeAt(0) < 128) bytes.push(ch.charCodeAt(0));
    else bytes.push(...new TextEncoder().encode(ch));
  }
  try { return new TextDecoder(charset || 'utf-8').decode(Uint8Array.from(bytes)); } catch { return new TextDecoder('utf-8').decode(Uint8Array.from(bytes)); }
};

const tidyType = (types: string[]): string => {
  const seen: string[] = [];
  for (const raw of types) {
    const t = raw.trim().replace(/^"|"$/g, '');
    if (!t || NOT_TYPES.has(t.toUpperCase())) continue;
    const label = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    if (!seen.includes(label)) seen.push(label);
  }
  return seen.join(' ');
};

/** Apple and Google write custom labels as "_$!<Mobile>!$_". */
const cleanLabel = (label: string): string => label.replace(/^_\$!<(.*)>!\$_$/, '$1').trim();

interface Entry { kind: 'phones' | 'emails' | 'urls' | 'addresses'; group: string; item: LabelledValue }

export class VCardParser {
  readonly contacts: Contact[] = [];
  /** Cards that had no usable name, phone or email and were left out. */
  skipped = 0;
  private tail = '';
  private pending: string | null = null;
  private card: Contact | null = null;
  private entries: Entry[] = [];
  private labels = new Map<string, string>();

  /** Feeds the next piece of the file. Pieces can end anywhere, even in the middle of a line. */
  push(text: string): void {
    const data = this.tail + text;
    let start = 0;
    for (;;) {
      const nl = data.indexOf('\n', start);
      if (nl === -1) break;
      let line = data.slice(start, nl);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      this.line(line);
      start = nl + 1;
    }
    this.tail = data.slice(start);
  }

  /** Call after the last piece of a file. */
  end(): void {
    if (this.tail) { this.line(this.tail.endsWith('\r') ? this.tail.slice(0, -1) : this.tail); this.tail = ''; }
    if (this.pending !== null) { this.logical(this.pending); this.pending = null; }
    this.card = null;
  }

  private line(line: string): void {
    if (this.pending !== null) {
      if (this.pending.endsWith('=') && /ENCODING=QUOTED-PRINTABLE/i.test(this.pending.slice(0, this.pending.indexOf(':') >= 0 ? this.pending.indexOf(':') : 0))) {
        this.pending = this.pending.slice(0, -1) + line;
        return;
      }
      if (line.startsWith(' ') || line.startsWith('\t')) { this.pending += line.slice(1); return; }
      this.logical(this.pending);
      this.pending = null;
    }
    if (line !== '') this.pending = line;
  }

  private logical(raw: string): void {
    let colon = -1;
    let quoted = false;
    for (let i = 0; i < raw.length; i += 1) {
      if (raw[i] === '"') quoted = !quoted;
      else if (raw[i] === ':' && !quoted) { colon = i; break; }
    }
    if (colon < 1) return;
    const headParts = splitOutside(raw.slice(0, colon), ';', true);
    let name = headParts[0].toUpperCase();
    let group = '';
    const dot = name.lastIndexOf('.');
    if (dot >= 0) { group = name.slice(0, dot); name = name.slice(dot + 1); }

    if (name === 'BEGIN') { if (raw.slice(colon + 1).trim().toUpperCase() === 'VCARD') this.start(); return; }
    if (name === 'END') { if (raw.slice(colon + 1).trim().toUpperCase() === 'VCARD') this.finish(); return; }
    if (!this.card || SKIP.has(name)) return;

    const types: string[] = [];
    let encoding = '';
    let charset = '';
    for (const param of headParts.slice(1)) {
      const eq = param.indexOf('=');
      if (eq === -1) { if (!PARAM_NAMES.has(param.toUpperCase())) types.push(param); continue; }
      const key = param.slice(0, eq).toUpperCase();
      const val = param.slice(eq + 1);
      if (key === 'TYPE') types.push(...val.replace(/"/g, '').split(','));
      else if (key === 'ENCODING') encoding = val.toUpperCase();
      else if (key === 'CHARSET') charset = val;
    }
    if (encoding === 'BASE64' || encoding === 'B') return;
    let value = raw.slice(colon + 1);
    if (encoding === 'QUOTED-PRINTABLE') value = decodeQuotedPrintable(value, charset);
    this.property(name, group, value, tidyType(types));
  }

  private start(): void {
    this.card = emptyContact();
    this.entries = [];
    this.labels = new Map();
  }

  private property(name: string, group: string, value: string, type: string): void {
    const card = this.card;
    if (!card) return;
    const text = () => unescapeText(value).trim();
    switch (name) {
      case 'N': {
        const p = splitOutside(value, ';', false).map((part) => unescapeText(part).trim());
        [card.last, card.first, card.middle, card.prefix, card.suffix] = [p[0] ?? '', p[1] ?? '', p[2] ?? '', p[3] ?? '', p[4] ?? ''];
        break;
      }
      case 'FN': card.full = text(); break;
      case 'NICKNAME': card.nickname = text(); break;
      case 'ORG': { const p = splitOutside(value, ';', false).map((part) => unescapeText(part).trim()).filter(Boolean); card.org = p[0] ?? ''; card.department = p.slice(1).join(' / '); break; }
      case 'TITLE': card.title = text(); break;
      case 'TEL': this.entries.push({ kind: 'phones', group, item: { value: text().replace(/^tel:/i, ''), type } }); break;
      case 'EMAIL': this.entries.push({ kind: 'emails', group, item: { value: text().replace(/^mailto:/i, ''), type } }); break;
      case 'URL': this.entries.push({ kind: 'urls', group, item: { value: text(), type } }); break;
      case 'ADR': {
        const p = splitOutside(value, ';', false).map((part) => unescapeText(part).replace(/\s*\n\s*/g, ' ').trim());
        const line = [p[2], p[1], p[0], p[3], p[4], p[5], p[6]].filter(Boolean).join(', ');
        if (line) this.entries.push({ kind: 'addresses', group, item: { value: line, type } });
        break;
      }
      case 'BDAY': card.birthday = text(); break;
      case 'NOTE': card.note = text(); break;
      case 'CATEGORIES': card.categories = splitOutside(value, ',', false).map((part) => unescapeText(part).trim()).filter(Boolean).join(', '); break;
      case 'X-ABLABEL': if (group) this.labels.set(group, cleanLabel(text())); break;
      default: break;
    }
  }

  private finish(): void {
    const card = this.card;
    this.card = null;
    if (!card) return;
    for (const entry of this.entries) {
      const label = entry.group ? this.labels.get(entry.group) : undefined;
      if (label && !entry.item.type) entry.item.type = label;
      if (entry.item.value) card[entry.kind].push(entry.item);
    }
    if (!card.full) card.full = [card.prefix, card.first, card.middle, card.last, card.suffix].filter(Boolean).join(' ');
    if (!card.full && !card.org && card.phones.length === 0 && card.emails.length === 0) { this.skipped += 1; return; }
    this.contacts.push(card);
  }
}
