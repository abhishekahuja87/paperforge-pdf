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

export type CaseStyle = 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'pascal' | 'snake' | 'kebab';

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
    default:
      return text;
  }
}
