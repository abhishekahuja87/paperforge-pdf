/**
 * Turns tool names in plain text into links. Plain data and no React, so the build-time page generator
 * (src/prerender/shellData.ts) can use the same functions to write the plain text of a page.
 *
 * Two ways to link:
 * - A marker written in the text: `{split-pdf}` becomes the tool's short name as a link to the tool. `{guide:slug|label}` links
 *   to a guide and `{page:why-trust-us|label}` to a page of the site (no leading slash), with the label you give. Markers are always linked, wherever they are, so the author decides.
 * - `auto`: the first mention of a tool's short name (for example "Compress PDF") in a block of text is linked. Used for
 *   guides and tool-page answers that were written before markers existed.
 */
import { TOOLS } from '../config/tools';

export interface ToolName { id: string; name: string; path: string }
export type LinkPiece = { text: string; path?: string };

/** "Image Resizer (KB and Pixels)" becomes "Image Resizer"; "EPF Calculator: Provident Fund Balance" becomes "EPF Calculator". */
export const shortToolName = (title: string): string => title.split(/ \(|: /)[0].trim();

let cached: { byId: Map<string, ToolName>; autoNames: ToolName[]; pattern: RegExp | null } | null = null;

const load = () => {
  if (cached) return cached;
  const byId = new Map<string, ToolName>();
  const autoNames: ToolName[] = [];
  const seenNames = new Set<string>();
  for (const tool of TOOLS) {
    if (!tool.isAvailable) continue;
    const entry = { id: tool.id, name: shortToolName(tool.title), path: tool.path };
    byId.set(tool.id, entry);
    // Only names with at least two words, so a word like "Base64" in running text is never linked by accident.
    if (entry.name.length >= 9 && entry.name.includes(' ') && !seenNames.has(entry.name)) {
      seenNames.add(entry.name);
      autoNames.push(entry);
    }
  }
  autoNames.sort((a, b) => b.name.length - a.name.length);
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = autoNames.length > 0 ? new RegExp(`(^|[^A-Za-z0-9])(${autoNames.map((entry) => escape(entry.name)).join('|')})(?![A-Za-z0-9])`, 'g') : null;
  cached = { byId, autoNames, pattern };
  return cached;
};

/** The short name of a tool by id, or undefined when there is no such tool. */
export const toolNameById = (id: string): string | undefined => load().byId.get(id)?.name;

const MARKER = /\{((?:guide|page):[a-z0-9-]+\|[^}]+|[a-z0-9-]+)\}/g;

/** The text with every marker replaced by the tool's short name or the guide's label, for the pre-rendered page. */
export const plainText = (text: string): string => text.replace(MARKER, (match, body: string) => {
  if (body.includes(':')) return body.split('|')[1] ?? '';
  return toolNameById(body) ?? match;
});

/** Every tool id used in markers in this text that is not a real tool; a test or a build check can assert this is empty. */
export const unknownMarkers = (text: string): string[] => {
  const bad: string[] = [];
  for (const match of text.matchAll(MARKER)) {
    const body = match[1];
    if (!body.includes(':') && !toolNameById(body)) bad.push(body);
  }
  return bad;
};

export interface LinkOptions {
  /** Also link the first mention of a tool's short name. */
  auto?: boolean;
  /** Names already linked in this block of text (shared across paragraphs so each tool is linked once). */
  seen?: Set<string>;
  /** Path of the page the text is on, never linked to itself. */
  exclude?: string;
}

const autoLink = (text: string, options: LinkOptions): LinkPiece[] => {
  const { pattern, autoNames } = load();
  if (!pattern || !options.auto) return [{ text }];
  const seen = options.seen ?? new Set<string>();
  const byName = new Map(autoNames.map((entry) => [entry.name, entry]));
  const pieces: LinkPiece[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const entry = byName.get(match[2]);
    if (!entry || entry.path === options.exclude || seen.has(entry.id)) continue;
    seen.add(entry.id);
    const start = (match.index ?? 0) + match[1].length;
    if (start > last) pieces.push({ text: text.slice(last, start) });
    pieces.push({ text: match[2], path: entry.path });
    last = start + match[2].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces.length > 0 ? pieces : [{ text }];
};

export const linkPieces = (text: string, options: LinkOptions = {}): LinkPiece[] => {
  const { byId } = load();
  const pieces: LinkPiece[] = [];
  let last = 0;
  const push = (chunk: string) => { if (chunk) pieces.push(...autoLink(chunk, options)); };
  for (const match of text.matchAll(MARKER)) {
    const start = match.index ?? 0;
    push(text.slice(last, start));
    const body = match[1];
    if (body.includes(':')) {
      const [kind, rest] = body.split(':');
      const [slug, label] = rest.split('|');
      pieces.push({ text: label, path: kind === 'guide' ? `/guides/${slug}` : `/${slug}` });
    } else {
      const tool = byId.get(body);
      if (tool && tool.path !== options.exclude) { pieces.push({ text: tool.name, path: tool.path }); options.seen?.add(tool.id); }
      else pieces.push({ text: tool?.name ?? body });
    }
    last = start + match[0].length;
  }
  push(text.slice(last));
  return pieces;
};
