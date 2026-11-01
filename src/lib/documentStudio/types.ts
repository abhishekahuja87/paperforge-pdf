export type SourceKind = 'pdf' | 'image' | 'docx' | 'custom';
export type ImageFitMode = 'letterbox' | 'fill' | 'original';
export type PageStandard = 'a4' | 'letter' | 'preserve';
export type NumberPosition = 'none' | 'bottom-center' | 'bottom-right' | 'top-right';
export type CompressionMode = 'quality' | 'balanced' | 'target-2mb' | 'target-500kb';

export interface SourceItem {
  id: string;
  fileName: string;
  fileSize: number;
  kind: SourceKind;
  mimeType: string;
  bytes: Uint8Array;
  pdfPassword?: string;
  isEncrypted?: boolean;
}

export interface RedactionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextRegion {
  text: string;
  box: RedactionBox;
}

export interface PageEditorPreview {
  image: string;
  width: number;
  height: number;
  textRegions: TextRegion[];
}

export interface CropBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageCard {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceKind: SourceKind;
  originalPageNumber: number;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface OutputSequenceItem {
  id: string;
  page: PageCard;
  rotation: number;
  crop: CropBounds;
  fitMode: ImageFitMode;
  redactions: RedactionBox[];
  contentsTitle?: string;
}

export interface StudioSettings {
  outputFileName: string;
  documentTitle: string;
  documentAuthor: string;
  documentSubject: string;
  documentKeywords: string;
  pageStandard: PageStandard;
  numberPosition: NumberPosition;
  numberFormat: string;
  skipFirstPage: boolean;
  marginMm: 0 | 10 | 20;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkAngle: number;
  compression: CompressionMode;
  protectOutput: boolean;
  outputUserPassword: string;
  outputOwnerPassword: string;
  allowOutputPrinting: boolean;
  allowOutputCopying: boolean;
}

export interface GeneratedPageOptions {
  type: 'blank' | 'cover' | 'note';
  title: string;
  subtitle: string;
  author: string;
  date: string;
  text: string;
  border: boolean;
}

export interface ExportResult {
  bytes: Uint8Array;
  targetBytes: number | null;
  targetMet: boolean;
}
