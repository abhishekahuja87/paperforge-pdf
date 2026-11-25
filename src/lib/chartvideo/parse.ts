/**
 * Reads the lines of a chart video. A line is one step: "Label: 40", with a note after a bar, or "2021: A=10, B=20" for the race chart.
 * No drawing happens here. Problems are collected with their line number.
 */

export type ChartType = 'bar' | 'hbar' | 'line' | 'pie' | 'donut' | 'race';

export interface DataStep { kind: 'data'; label: string; /** One value for most charts, one for each series in a race. */ values: number[]; note: string; line: number }
export interface PauseStep { kind: 'pause'; seconds: number; line: number }
export type ChartStep = DataStep | PauseStep;

export interface ParseIssue { line: number; message: string }
export interface ChartDeck { title: string; /** Text for the card at the end, from an end: line. */ endText: string; /** Names of the series (a single empty name for a plain chart). */ series: string[]; steps: ChartStep[]; issues: ParseIssue[] }

export const LIMITS = { steps: 50, series: 12, slices: 12, note: 80, label: 30, title: 60 };

/** Reads 40, 1,20,000, a currency sign in front, a percent sign after or $1,200.50 as a number. Returns null when it is not a plain positive number. */
export function readNumber(text: string): number | null {
  const cleaned = text.trim().replace(/^[₹$€£¥]\s*/, '').replace(/\s*%$/, '').replace(/,/g, '').replace(/\s+/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function parseChart(source: string, type: ChartType): ChartDeck {
  const deck: ChartDeck = { title: '', endText: '', series: [''], steps: [], issues: [] };
  const issue = (line: number, message: string) => { if (deck.issues.length < 20) deck.issues.push({ line, message }); };
  const names: string[] = []; let mode: 'plain' | 'series' | null = null;

  source.replace(/\r/g, '').split('\n').forEach((raw, index) => {
    const line = index + 1; const text = raw.trim();
    if (!text || text.startsWith('#')) return;
    let m: RegExpMatchArray | null;
    if ((m = text.match(/^title\s*:\s*(.*)$/i))) { deck.title = m[1]!.trim().slice(0, LIMITS.title); return; }
    if ((m = text.match(/^end\s*:\s*(.*)$/i))) { deck.endText = m[1]!.trim().slice(0, LIMITS.note); return; }
    if ((m = text.match(/^pause(?:\s+(\d+(?:\.\d+)?))?$/i))) { deck.steps.push({ kind: 'pause', seconds: Math.min(10, Math.max(0.5, m[1] ? Number(m[1]) : 2)), line }); return; }
    const colon = text.indexOf(':');
    if (colon < 1) { issue(line, `I could not read this line: "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}". Write it like Jan: 40, or start it with title:, end: or pause.`); return; }
    if (deck.steps.filter((step) => step.kind === 'data').length >= LIMITS.steps) { issue(line, `Too many steps. The most is ${LIMITS.steps}.`); return; }
    const label = text.slice(0, colon).trim().slice(0, LIMITS.label);
    const bar = text.slice(colon + 1).indexOf('|');
    const rest = bar >= 0 ? text.slice(colon + 1, colon + 1 + bar) : text.slice(colon + 1);
    const note = bar >= 0 ? text.slice(colon + 2 + bar).trim().slice(0, LIMITS.note) : '';
    const isSeries = rest.includes('=');
    if (mode && mode !== (isSeries ? 'series' : 'plain')) { issue(line, isSeries ? 'This line has Name=value, but the lines above have one number. Use one style in a chart.' : 'This line has one number, but the lines above have Name=value. Use one style in a chart.'); return; }
    mode = isSeries ? 'series' : 'plain';
    if (!isSeries) {
      const value = readNumber(rest);
      if (value === null) { issue(line, `"${rest.trim().slice(0, 20)}" is not a number I can draw. Use a positive number such as 40 or 1,20,000.`); return; }
      deck.steps.push({ kind: 'data', label, values: [value], note, line }); return;
    }
    const pairs = rest.split(',').map((part) => part.trim()).filter(Boolean);
    const found = new Map<string, number>();
    for (const pair of pairs) {
      const eq = pair.indexOf('='); const name = pair.slice(0, eq).trim().slice(0, LIMITS.label); const value = readNumber(pair.slice(eq + 1));
      if (!name || value === null) { issue(line, `"${pair.slice(0, 24)}" should look like Name=40 with a positive number.`); continue; }
      if (!names.includes(name)) { if (names.length >= LIMITS.series) { issue(line, `A race can have ${LIMITS.series} names at most.`); continue; } names.push(name); }
      found.set(name, value);
    }
    if (found.size === 0) return;
    deck.steps.push({ kind: 'data', label, values: names.map((name) => found.get(name) ?? Number.NaN), note, line });
  });

  if (mode === 'series') {
    deck.series = names;
    // Fill the gaps: a name missing from a line keeps its last value, or starts at 0.
    const last = names.map(() => 0);
    for (const step of deck.steps) if (step.kind === 'data') { while (step.values.length < names.length) step.values.push(Number.NaN); step.values = step.values.map((value, k) => { if (Number.isNaN(value)) return last[k]!; last[k] = value; return value; }); }
    if (type !== 'race') issue(1, 'Name=value lines are for the Race chart. Choose Race as the chart type, or write one number on each line, like Jan: 40.');
  } else if (type === 'race' && deck.steps.length > 0) {
    issue(1, 'The Race chart needs lines such as 2021: Ravi=10, Meena=20, so each line is one moment. Open the Race example to see it.');
  }
  const data = deck.steps.filter((step) => step.kind === 'data').length;
  if ((type === 'pie' || type === 'donut') && data > LIMITS.slices) issue(1, `A pie or donut can have ${LIMITS.slices} slices at most. Use a bar chart for more.`);
  if (data === 0 && deck.issues.length === 0) issue(1, 'Write a first line, for example: Jan: 40');
  return deck;
}
