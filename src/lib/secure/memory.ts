import { DEFAULT_STYLE, type DocStyle } from './docStyle';

/** What was being written, kept only in this page's memory (never saved to the device) so moving between the document and file pages does not lose it. Gone when the tab is closed or refreshed. The password is never kept. */
export interface Kept { html: string; style: DocStyle; title: string; header: string; footer: string; watermark: string; template: string }

let kept: Kept | null = null;

export const keep = (value: Kept): void => { kept = value; };
export const recall = (): Kept | null => kept;
export const forget = (): void => { kept = null; };
export const startKept = (): Kept => ({ html: '', style: { ...DEFAULT_STYLE }, title: '', header: '', footer: '', watermark: '', template: '' });
