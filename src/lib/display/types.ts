export type DisplaySourceKind = 'pdf' | 'docx' | 'image';

export interface DisplaySlide {
  id: string;
  title: string;
  sourceName: string;
  sourceKind: DisplaySourceKind;
  pageNumber: number;
  imageDataUrl: string;
  durationSeconds: number | null;
  caption: string;
  included: boolean;
}
