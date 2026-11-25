/**
 * Reads sequence diagram text (the WebSequenceDiagrams style: "A->B: text") into a list of items and a list of participants.
 * No drawing happens here. Problems are collected with their line number instead of stopping, so the person can fix them one by one.
 */

export type ParticipantType = 'box' | 'actor' | 'database' | 'cloud' | 'queue' | 'collections';
export const PARTICIPANT_TYPES: ParticipantType[] = ['box', 'actor', 'database', 'cloud', 'queue', 'collections'];

export interface Participant { id: string; label: string; type: ParticipantType; /** Item index that creates it (A->*B), or -1 when it exists from the start. */ createdAt: number }

export type GroupKind = 'alt' | 'opt' | 'loop' | 'par' | 'seq' | 'break' | 'group';
export const GROUP_KINDS: GroupKind[] = ['alt', 'opt', 'loop', 'par', 'seq', 'break', 'group'];

interface Base { /** 1-based line in the text. */ line: number }
export interface MessageItem extends Base {
  kind: 'message'; from: string | null; to: string | null; dashed: boolean; open: boolean; delay: number; text: string;
  /** '+' starts a bar on the receiver, '-' ends the sender's bar, '*' creates the receiver, '*+' both. */
  mark: '' | '+' | '-' | '*' | '*+';
}
export interface NoteItem extends Base { kind: 'note'; side: 'left' | 'right' | 'over'; a: string; b: string | null; text: string }
export interface StateItem extends Base { kind: 'state'; a: string; b: string | null; text: string }
export interface GroupStartItem extends Base { kind: 'groupStart'; group: GroupKind; text: string }
export interface GroupElseItem extends Base { kind: 'groupElse'; text: string }
export interface GroupEndItem extends Base { kind: 'groupEnd' }
export interface BarItem extends Base { kind: 'activate' | 'deactivate' | 'destroy'; who: string }
export interface DividerItem extends Base { kind: 'divider'; text: string }
export interface DelayItem extends Base { kind: 'delay'; text: string }
export interface PauseItem extends Base { kind: 'pause'; seconds: number }
export type Item = MessageItem | NoteItem | StateItem | GroupStartItem | GroupElseItem | GroupEndItem | BarItem | DividerItem | DelayItem | PauseItem;

export interface ParseIssue { line: number; message: string }
export interface Diagram { title: string; participants: Participant[]; items: Item[]; /** Number the messages from this value, or 0 for no numbers. */ numberFrom: number; issues: ParseIssue[] }

export const LIMITS = { participants: 10, items: 60, text: 120 };

const clean = (text: string) => text.replace(/\\n/g, '\n').trim();
const unquote = (name: string) => { const t = name.trim(); return t.length >= 2 && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t; };

/** A participant name: quoted text, or letters, digits and the usual marks without spaces around an arrow. */
const NAME = '(?:"[^"]+"|[^\\s\\-:,\\[\\]<>*+()][^\\-:,\\[\\]<>*+()]*?)';
const ARROW = '(--?>>?)';
const MESSAGE = new RegExp(`^(\\[|${NAME})\\s*${ARROW}\\s*(?:\\((\\d+(?:\\.\\d+)?)\\))?\\s*(\\*\\+|\\*|\\+|-)?\\s*(\\]|${NAME})\\s*(?::(.*))?$`);

export function parseDiagram(source: string): Diagram {
  const diagram: Diagram = { title: '', participants: [], items: [], numberFrom: 0, issues: [] };
  const byId = new Map<string, Participant>();
  const issue = (line: number, message: string) => { if (diagram.issues.length < 20) diagram.issues.push({ line, message }); };
  const open: { kind: string; line: number }[] = [];
  const lines = source.replace(/\r/g, '').split('\n');

  const add = (id: string, line: number, type?: ParticipantType, label?: string, createdAt = -1): string => {
    const key = unquote(id);
    let found = byId.get(key);
    if (!found) {
      if (diagram.participants.length >= LIMITS.participants) { issue(line, `Too many names. The most is ${LIMITS.participants}.`); return key; }
      found = { id: key, label: label ?? clean(key), type: type ?? 'box', createdAt };
      byId.set(key, found); diagram.participants.push(found);
    } else {
      if (type) found.type = type;
      if (label) found.label = label;
      if (createdAt >= 0 && found.createdAt < 0 && diagram.items.length > 0) found.createdAt = createdAt;
    }
    return key;
  };
  const push = (item: Item) => { if (diagram.items.length >= LIMITS.items) { issue(item.line, `Too many steps. The most is ${LIMITS.items}.`); return; } diagram.items.push(item); };
  const known = (id: string, line: number) => { const key = unquote(id); if (!byId.has(key)) add(key, line); return key; };

  for (let index = 0; index < lines.length; index++) {
    const lineNo = index + 1;
    let raw = lines[index]!;
    // A comment starts with # at the start of a line.
    if (raw.trim().startsWith('#')) continue;
    const text = raw.trim();
    if (!text) continue;
    if (text.length > 240) { issue(lineNo, 'This line is too long.'); continue; }
    let m: RegExpMatchArray | null;

    if ((m = text.match(/^title\s+(.+)$/i))) { diagram.title = clean(m[1]!).slice(0, 80); continue; }
    if ((m = text.match(/^autonumber(?:\s+(off|\d+))?$/i))) { diagram.numberFrom = m[1]?.toLowerCase() === 'off' ? 0 : m[1] ? Math.max(1, Number(m[1])) : 1; continue; }
    if ((m = text.match(/^pause(?:\s+(\d+(?:\.\d+)?))?$/i))) { push({ kind: 'pause', seconds: Math.min(10, Math.max(0.5, m[1] ? Number(m[1]) : 2)), line: lineNo }); continue; }

    if ((m = text.match(/^(participant|actor|database|cloud|queue|collections)(?::(\w+))?\s+(.+)$/i))) {
      const word = m[1]!.toLowerCase();
      const typeWord = (m[2] ?? (word === 'participant' ? 'box' : word)).toLowerCase();
      if (!PARTICIPANT_TYPES.includes(typeWord as ParticipantType)) { issue(lineNo, `Unknown name shape "${typeWord}". Use ${PARTICIPANT_TYPES.join(', ')}.`); continue; }
      const alias = m[3]!.match(/^(.+?)\s+as\s+(.+)$/i);
      if (alias) add(unquote(alias[2]!), lineNo, typeWord as ParticipantType, clean(unquote(alias[1]!)));
      else add(unquote(m[3]!), lineNo, typeWord as ParticipantType, clean(unquote(m[3]!)));
      continue;
    }

    if ((m = text.match(/^(?:activate|deactivate|destroy)\s+(.+)$/i))) {
      const word = text.split(/\s+/)[0]!.toLowerCase() as 'activate' | 'deactivate' | 'destroy';
      push({ kind: word, who: known(m[1]!, lineNo), line: lineNo }); continue;
    }

    if ((m = text.match(/^(note|state)\s+(left of|right of|over)\s+([^:]+?)(?:\s*:\s*(.*))?$/i))) {
      const isNote = m[1]!.toLowerCase() === 'note';
      const side = m[2]!.toLowerCase() === 'left of' ? 'left' : m[2]!.toLowerCase() === 'right of' ? 'right' : 'over';
      const names = m[3]!.split(',').map((name) => name.trim()).filter(Boolean);
      if (names.length === 0 || names.length > 2 || (names.length === 2 && side !== 'over')) { issue(lineNo, 'A note sits beside one name, or over one or two names, like: note over A, B: text'); continue; }
      let body = m[4];
      if (body === undefined) {
        // Several lines, closed by "end note".
        const parts: string[] = []; let closed = false;
        while (index + 1 < lines.length) { index++; const next = lines[index]!.trim(); if (/^end\s*note$/i.test(next)) { closed = true; break; } parts.push(next); }
        if (!closed) issue(lineNo, 'This note has no "end note" line.');
        body = parts.join('\n');
      }
      const a = known(names[0]!, lineNo), b = names[1] ? known(names[1], lineNo) : null;
      const value = clean(body).slice(0, LIMITS.text * 2);
      if (isNote) push({ kind: 'note', side, a, b, text: value, line: lineNo });
      else push({ kind: 'state', a, b, text: value, line: lineNo });
      continue;
    }

    if ((m = text.match(/^(alt|opt|loop|par|seq|break|group)\b\s*(.*)$/i))) {
      const group = m[1]!.toLowerCase() as GroupKind;
      push({ kind: 'groupStart', group, text: clean(m[2]!).slice(0, 60), line: lineNo }); open.push({ kind: group, line: lineNo }); continue;
    }
    if ((m = text.match(/^else\b\s*(.*)$/i))) {
      if (!open.length) { issue(lineNo, '"else" needs an "alt" or "opt" above it.'); continue; }
      push({ kind: 'groupElse', text: clean(m[1]!).slice(0, 60), line: lineNo }); continue;
    }
    if (/^end$/i.test(text)) {
      if (!open.length) { issue(lineNo, '"end" has no box to close.'); continue; }
      open.pop(); push({ kind: 'groupEnd', line: lineNo }); continue;
    }

    if ((m = text.match(/^==\s*(.*?)\s*==$/))) { push({ kind: 'divider', text: clean(m[1]!).slice(0, 80), line: lineNo }); continue; }
    if ((m = text.match(/^\.\.\.\s*(.*?)\s*(?:\.\.\.)?$/))) { push({ kind: 'delay', text: clean(m[1]!).slice(0, 80), line: lineNo }); continue; }

    if ((m = text.match(MESSAGE))) {
      const [, left, arrow, delay, mark, right, body] = m;
      if (left === '[' && right === ']') { issue(lineNo, 'An arrow needs a name on at least one side.'); continue; }
      const itemIndex = diagram.items.length;
      const from = left === '[' ? null : add(left!, lineNo);
      const create = mark === '*' || mark === '*+';
      const to = right === ']' ? null : add(right!, lineNo, undefined, undefined, create ? itemIndex : -1);
      const label = clean(body ?? '');
      if (label.length > LIMITS.text) issue(lineNo, `The text on an arrow can be ${LIMITS.text} letters at most.`);
      push({ kind: 'message', from, to, dashed: arrow!.startsWith('--'), open: arrow!.endsWith('>>'), delay: delay ? Math.min(8, Number(delay)) : 0, text: label.slice(0, LIMITS.text), mark: (mark ?? '') as MessageItem['mark'], line: lineNo });
      continue;
    }

    issue(lineNo, `I could not read this line: "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}". Try something like: A->B: hello`);
  }

  for (const group of open) issue(group.line, `This "${group.kind}" box is never closed. Add an "end" line.`);
  if (diagram.participants.length === 0 && diagram.issues.length === 0) issue(1, 'Write a first step, for example: Customer->Shop: Place order');
  return diagram;
}
