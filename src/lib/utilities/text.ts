export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingMinutes: number;
  speakingMinutes: number;
}

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed ? (trimmed.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) ?? []).filter((part) => part.trim()).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((part) => part.trim()).length : 0;
  return {
    words,
    characters: Array.from(text).length,
    charactersNoSpaces: Array.from(text.replace(/\s/g, '')).length,
    sentences,
    paragraphs,
    readingMinutes: words / 200,
    speakingMinutes: words / 130,
  };
}

export type CaseStyle = 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'pascal' | 'snake' | 'kebab' | 'toggle' | 'alternating';

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function convertCase(text: string, style: CaseStyle): string {
  switch (style) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.toLowerCase().replace(/(^|[\s(["'-])(\p{L})/gu, (_, lead: string, letter: string) => `${lead}${letter.toUpperCase()}`);
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, lead: string, letter: string) => `${lead}${letter.toUpperCase()}`);
    case 'camel':
    case 'pascal': {
      const words = splitWords(text).map((word) => word.toLowerCase());
      return words.map((word, index) => (index === 0 && style === 'camel' ? word : word.charAt(0).toUpperCase() + word.slice(1))).join('');
    }
    case 'snake':
      return splitWords(text).map((word) => word.toLowerCase()).join('_');
    case 'kebab':
      return splitWords(text).map((word) => word.toLowerCase()).join('-');
    case 'toggle':
      return Array.from(text).map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase())).join('');
    case 'alternating': {
      let index = 0;
      return Array.from(text.toLowerCase()).map((char) => (/\p{L}/u.test(char) ? (index++ % 2 === 0 ? char : char.toUpperCase()) : char)).join('');
    }
    default:
      return text;
  }
}

export type CleanupOp = 'trimSpaces' | 'removeBreaks' | 'sortLines' | 'dedupeLines' | 'reverseLines';

export function cleanupText(text: string, op: CleanupOp): string {
  switch (op) {
    case 'trimSpaces':
      return text.split('\n').map((line) => line.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    case 'removeBreaks':
      return text.replace(/\s*\n\s*/g, ' ').replace(/ {2,}/g, ' ').trim();
    case 'sortLines':
      return text.split('\n').sort((a, b) => a.localeCompare(b)).join('\n');
    case 'dedupeLines': {
      const seen = new Set<string>();
      return text.split('\n').filter((line) => (seen.has(line) ? false : (seen.add(line), true))).join('\n');
    }
    case 'reverseLines':
      return text.split('\n').reverse().join('\n');
    default:
      return text;
  }
}

const STOP_WORDS = new Set('a an and are as at be but by for from has have he her his i in is it its of on or she that the their they this to was we were will with you your not so if then than there what which who'.split(' '));

export interface TextExtras {
  uniqueWords: number;
  averageWordLength: number;
  longestWord: string;
  topWords: { word: string; count: number }[];
}

export function textExtras(text: string): TextExtras {
  const words = (text.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) ?? []).map((word) => word.replace(/^['’]+|['’]+$/g, '')).filter(Boolean);
  const counts = new Map<string, number>();
  for (const word of words) if (!STOP_WORDS.has(word) && word.length > 1) counts.set(word, (counts.get(word) ?? 0) + 1);
  const total = words.reduce((sum, word) => sum + Array.from(word).length, 0);
  return {
    uniqueWords: new Set(words).size,
    averageWordLength: words.length ? total / words.length : 0,
    longestWord: words.reduce((best, word) => (Array.from(word).length > Array.from(best).length ? word : best), ''),
    topWords: [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([word, count]) => ({ word, count })),
  };
}
