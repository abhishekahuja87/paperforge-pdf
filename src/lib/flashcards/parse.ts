import { MAX_CARDS, type Card } from './types';

const unescape = (value: string) => value.replace(/\\n/g, '\n').trim();

/** One card per line, front and back split by a tab, " | " or "::". "\n" inside a side makes a line break. */
export function parseCards(text: string): { cards: Card[]; noBack: number; truncated: boolean } {
  const cards: Card[] = [];
  let noBack = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cut = /\t|\s\|\s|\||::/.exec(line);
    if (!cut) { cards.push({ front: unescape(line), back: '' }); noBack += 1; continue; }
    const front = unescape(line.slice(0, cut.index));
    const back = unescape(line.slice(cut.index + cut[0].length));
    if (!front && !back) continue;
    if (!back) noBack += 1;
    cards.push({ front, back });
  }
  return { cards: cards.slice(0, MAX_CARDS), noBack, truncated: cards.length > MAX_CARDS };
}

/** Reads the first two columns of CSV or TSV text. Quotes, doubled quotes and line breaks inside quotes are handled. */
export function parseTable(text: string, hasHeader: boolean): string {
  const first = text.split(/\r?\n/, 1)[0] ?? '';
  const counts: [string, number][] = [['\t', first.split('\t').length], [';', first.split(';').length], [',', first.split(',').length]];
  const delimiter = counts.sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i += 1; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.slice(hasHeader ? 1 : 0).filter((r) => r[0]?.trim() || r[1]?.trim()).map((r) => `${(r[0] ?? '').replace(/\r?\n/g, '\\n')} | ${(r[1] ?? '').replace(/\r?\n/g, '\\n')}`).join('\n');
}
