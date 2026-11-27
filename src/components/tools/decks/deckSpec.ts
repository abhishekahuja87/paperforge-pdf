/** What a PowerPoint maker page needs. One generic page (DeckMaker.tsx) reads this, so each tool is a short description. */
export interface DeckStarter { label: string; hint: string; title: string; subtitle: string; closing: string; contact: string; outline: string }
export interface DeckSpec {
  /** Start of the file name. */
  id: string;
  starters: Record<string, DeckStarter>;
  agenda: boolean;
  answers: 'each' | 'end' | 'none';
  /** Quiz tools show the question syntax in the help. */
  quiz?: boolean;
}
