export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard';
export type SourceType = 'website' | 'book' | 'journal';

export interface CitationInput {
  style: CitationStyle;
  type: SourceType;
  /** One author per line: "First Last" or "Last, First". */
  authors: string;
  title: string;
  /** Website name or journal name. */
  container: string;
  publisher: string;
  place: string;
  edition: string;
  year: string;
  month: string;
  day: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  accessed: string;
}

export const emptyCitation = (): CitationInput => ({
  style: 'apa', type: 'website', authors: '', title: '', container: '', publisher: '', place: '', edition: '',
  year: '', month: '', day: '', volume: '', issue: '', pages: '', doi: '', url: '', accessed: '',
});

/** Text made of plain and italic pieces, so it can be shown, copied as text or copied with formatting. */
export type Segment = { text: string; italic?: boolean };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MLA_MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const t = (text: string): Segment => ({ text });
const i = (text: string): Segment => ({ text, italic: true });

export interface Author { last: string; first: string }

export function parseAuthors(text: string): Author[] {
  return text.split(/\r?\n/).map(clean).filter(Boolean).map((line) => {
    if (line.includes(',')) {
      const [last, ...rest] = line.split(',');
      return { last: clean(last), first: clean(rest.join(' ')) };
    }
    const parts = line.split(' ');
    if (parts.length === 1) return { last: parts[0], first: '' };
    return { last: parts[parts.length - 1], first: parts.slice(0, -1).join(' ') };
  });
}

const initials = (first: string) => first.split(/[\s-]+/).filter(Boolean).map((part) => `${part[0].toUpperCase()}.`).join(' ');
const lastFirst = (author: Author) => (author.first ? `${author.last}, ${author.first}` : author.last);
const firstLast = (author: Author) => (author.first ? `${author.first} ${author.last}` : author.last);
const lastInitials = (author: Author) => (author.first ? `${author.last}, ${initials(author.first)}` : author.last);

function listAuthors(style: CitationStyle, authors: Author[]): string {
  if (authors.length === 0) return '';
  if (style === 'apa') {
    const names = authors.slice(0, 20).map(lastInitials);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}, & ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
  }
  if (style === 'mla') {
    if (authors.length === 1) return lastFirst(authors[0]);
    if (authors.length === 2) return `${lastFirst(authors[0])}, and ${firstLast(authors[1])}`;
    return `${lastFirst(authors[0])}, et al.`;
  }
  if (style === 'chicago') {
    const names = authors.slice(0, 10).map((author, index) => (index === 0 ? lastFirst(author) : firstLast(author)));
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}, and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  }
  // Harvard (Cite Them Right): four or more authors become "first author et al."
  if (authors.length >= 4) return `${lastInitials(authors[0])} et al.`;
  const names = authors.map(lastInitials);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const monthName = (value: string): string => {
  const number = Number(value);
  if (Number.isInteger(number) && number >= 1 && number <= 12) return MONTHS[number - 1];
  const found = MONTHS.find((name) => name.toLowerCase().startsWith(clean(value).toLowerCase().slice(0, 3)) && clean(value).length >= 3);
  return found ?? clean(value);
};

const mlaMonth = (value: string) => MLA_MONTHS[MONTHS.indexOf(monthName(value))] ?? monthName(value);

/** Ends a piece of text with a full stop unless it already ends with one (or ? or !). */
const stop = (text: string) => (/[.?!]$/.test(text) ? text : `${text}.`);
const nonEmpty = (segments: Segment[]) => segments.filter((segment) => segment.text !== '');

function accessDate(value: string, style: CitationStyle): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return clean(value);
  const day = Number(match[3]);
  const month = MONTHS[Number(match[2]) - 1];
  if (style === 'mla') return `${day} ${mlaMonth(match[2])} ${match[1]}`;
  if (style === 'chicago') return `${month} ${day}, ${match[1]}`;
  return `${day} ${month} ${match[1]}`;
}

const link = (input: CitationInput) => clean(input.doi) ? (/^https?:/i.test(clean(input.doi)) ? clean(input.doi) : `https://doi.org/${clean(input.doi).replace(/^doi:\s*/i, '')}`) : clean(input.url);

export interface CitationResult { segments: Segment[]; missing: string[] }

export function buildCitation(input: CitationInput): CitationResult {
  const authors = parseAuthors(input.authors);
  const who = listAuthors(input.style, authors);
  const title = clean(input.title);
  const container = clean(input.container);
  const publisher = clean(input.publisher);
  const place = clean(input.place);
  const edition = clean(input.edition);
  const year = clean(input.year);
  const volume = clean(input.volume);
  const issue = clean(input.issue);
  const pages = clean(input.pages).replace(/-/g, '–');
  const where = link(input);
  const month = clean(input.month) ? monthName(input.month) : '';
  const day = clean(input.day);
  const accessed = clean(input.accessed);
  const missing: string[] = [];
  if (!title) missing.push('title');
  if (!year && input.type !== 'website') missing.push('year');
  if (input.type === 'journal' && !container) missing.push('journal name');

  const out: Segment[] = [];
  const push = (...segments: Segment[]) => out.push(...segments);
  const origin = [place, publisher].filter(Boolean).join(': ');

  if (input.style === 'apa') {
    const date = year ? (input.type === 'website' && month ? `(${year}, ${month}${day ? ` ${day}` : ''})` : `(${year})`) : '(n.d.)';
    const edText = edition ? ` (${edition} ed.)` : '';
    const heading = input.type === 'journal' ? [t(`${stop(title)} `)] : input.type === 'book' ? [i(title), t(`${edText}. `)] : [i(title), t('. ')];
    if (who) push(t(`${stop(who)} ${date}. `), ...heading); else push(...heading, t(`${date}. `));
    if (input.type === 'journal') {
      push(i(container));
      if (volume) { push(t(', '), i(volume)); if (issue) push(t(`(${issue})`)); }
      if (pages) push(t(`, ${pages}`));
      push(t('.'));
      if (where) push(t(` ${where}`));
    } else if (input.type === 'book') {
      if (publisher) push(t(stop(publisher)));
      if (where) push(t(` ${where}`));
    } else {
      if (container && container !== who) push(t(stop(container)));
      if (where) push(t(` ${where}`));
    }
  } else if (input.style === 'mla') {
    if (who) push(t(`${stop(who)} `));
    if (input.type === 'journal') {
      push(t(`“${stop(title)}” `), i(container));
      const parts = [volume && `vol. ${volume}`, issue && `no. ${issue}`, year, pages && (pages.includes('–') ? `pp. ${pages}` : `p. ${pages}`)].filter(Boolean);
      if (parts.length) push(t(`, ${parts.join(', ')}`));
      push(t('.'));
      if (where) push(t(` ${stop(where)}`));
    } else if (input.type === 'book') {
      push(i(stop(title)), t(' '));
      const parts = [edition && `${edition} ed.`, publisher, year].filter(Boolean);
      if (parts.length) push(t(`${parts.join(', ')}.`));
    } else {
      push(t(`“${stop(title)}” `));
      if (container) push(i(container), t(', '));
      const date = [day, month && mlaMonth(month), year].filter(Boolean).join(' ');
      const parts = [publisher, date].filter(Boolean);
      push(t(parts.join(', ')));
      if (where) push(t(`${parts.length ? ', ' : ''}${where.replace(/^https?:\/\//i, '')}`));
      push(t('.'));
      if (accessed) push(t(` Accessed ${accessDate(accessed, 'mla')}.`));
    }
  } else if (input.style === 'chicago') {
    const heading = input.type === 'book' ? [i(stop(title)), t(' ')] : [t(`“${stop(title)}” `)];
    const yearText = year ? `${year}. ` : 'n.d. ';
    if (who) push(t(`${stop(who)} ${yearText}`), ...heading); else push(...heading, t(yearText));
    if (input.type === 'journal') {
      push(i(container));
      if (volume) push(t(` ${volume}`));
      if (issue) push(t(` (${issue})`));
      if (pages) push(t(`: ${pages}`));
      push(t('.'));
      if (where) push(t(` ${where}.`));
    } else if (input.type === 'book') {
      if (edition) push(t(`${edition} ed. `));
      if (origin) push(t(`${origin}.`));
    } else {
      if (container) push(t(`${stop(container)} `));
      if (month) push(t(`${month}${day ? ` ${day}` : ''}, ${year}. `));
      if (accessed) push(t(`Accessed ${accessDate(accessed, 'chicago')}. `));
      if (where) push(t(`${where}.`));
    }
  } else {
    const date = `(${year || 'no date'})`;
    const heading = input.type === 'journal' ? [t(`‘${title}’${who ? ', ' : ' '}`)] : [i(stop(title)), t(' ')];
    if (who) push(t(`${who} ${date} `), ...heading); else if (input.type === 'journal') push(t(`‘${title}’ ${date} `)); else push(i(stop(title)), t(` ${date} `));
    if (input.type === 'journal') {
      push(i(container));
      if (volume) push(t(`, ${volume}${issue ? `(${issue})` : ''}`));
      if (pages) push(t(`, ${pages.includes('–') ? 'pp.' : 'p.'} ${pages}`));
      push(t('.'));
      if (where) push(t(` ${/doi\.org/i.test(where) ? 'doi:' : 'Available at:'} ${where.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}`));
    } else if (input.type === 'book') {
      if (edition) push(t(`${edition} ed. `));
      if (origin) push(t(`${origin}.`));
    } else {
      if (where) push(t(`Available at: ${where}`));
      if (accessed) push(t(` (Accessed: ${accessDate(accessed, 'harvard')}).`));
    }
  }

  const segments = nonEmpty(out);
  return { segments: segments.length ? segments : [t('')], missing };
}

export const toPlainText = (segments: Segment[]) => segments.map((segment) => segment.text).join('').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const toHtml = (segments: Segment[]) => segments.map((segment) => (segment.italic ? `<i>${escapeHtml(segment.text)}</i>` : escapeHtml(segment.text))).join('').replace(/\s+/g, ' ').trim();
