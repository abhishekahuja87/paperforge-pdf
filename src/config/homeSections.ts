import type { ToolIconName } from './tools';

/**
 * What the home page shows, in order. Only tool ids and layout numbers live here; the words are in en.json
 * (`homeSections`, `homeCollections`) and each tool's own title comes from its catalogue entry.
 *
 * Every available tool should appear in exactly one COLLECTION (or be a workspace). A tool that is in none still
 * shows up, under "More tools", so a newly added tool is never hidden by accident.
 */

/** "Most used" tiles. Reorder with real traffic (Search Console or Analytics) when you have it. */
export const MOST_USED = [
  'merge-pdf', 'compress-pdf', 'split-pdf', 'image-compressor', 'image-to-pdf', 'passport-photo-resizer',
  'income-tax-calculator', 'emi-calculator', 'sip-calculator', 'age-calculator', 'qr-code-generator', 'resume-builder',
];

/** Recently added tools. They get a small "New" tag on their tile in the topic lists. Drop the oldest when a new tool ships. */
export const NEW_TOOLS = [
  'rent-receipt-generator', 'price-tag-maker', 'bulk-qr-code-generator', 'offer-poster-maker', 'screenshot-redactor', 'sports-court-size-guide', 'exercise-library', 'solar-system-explorer',
];

/** Studio-style tools shown as a slim row. */
export const WORKSPACES = ['master-document-studio', 'digitize-documents', 'pos-invoice-studio', 'display-studio'];

/** How many tools each topic shows on a phone before "Show more". Larger screens show every tool. */
export const COLLECTION_PREVIEW = 6;

/** Image tools named like resize-image-to-20kb are shown as small chips instead of cards. */
export const SIZE_PRESET_PATTERN = /^resize-image-to-(\d+)kb$/;

export interface CollectionSpec {
  id: string;
  icon: ToolIconName;
  tools: string[];
}

export const COLLECTIONS: CollectionSpec[] = [
  { id: 'pdf', icon: 'file-text', tools: [
    'merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'delete-pdf-pages', 'organize-pdf', 'image-to-pdf', 'pdf-to-images', 'extract-text', 'add-page-numbers',
    'watermark-pdf', 'crop-pdf', 'protect-pdf', 'unlock-pdf', 'sanitize-pdf', 'flatten-pdf', 'n-up-pdf', 'inspect-pdf', 'generate-sample-pdf',
  ] },
  { id: 'images', icon: 'image', tools: [
    'image-compressor', 'image-converter', 'image-resizer', 'passport-photo-resizer', 'signature-resizer', 'exam-photo-resizer', 'screenshot-redactor',
    'resize-image-to-20kb', 'resize-image-to-30kb', 'resize-image-to-50kb', 'resize-image-to-100kb', 'resize-image-to-200kb',
  ] },
  { id: 'money', icon: 'calculator', tools: [
    'income-tax-calculator', 'salary-calculator', 'emi-calculator', 'sip-calculator', 'gst-calculator', 'hra-calculator', 'fd-calculator', 'ppf-calculator', 'rd-calculator',
    'rent-receipt-generator', 'lumpsum-calculator', 'cagr-calculator', 'simple-compound-interest-calculator', 'inflation-calculator', 'gratuity-calculator', 'epf-calculator',
  ] },
  { id: 'everyday', icon: 'hash', tools: [
    'age-calculator', 'date-difference-calculator', 'percentage-calculator', 'discount-calculator', 'unit-converter', 'bmi-calculator', 'bill-splitter', 'time-zone-converter', 'number-to-words', 'sports-court-size-guide', 'exercise-library', 'solar-system-explorer',
  ] },
  { id: 'printables', icon: 'layers', tools: [
    'printable-paper-maker', 'dot-grid-paper-generator', 'graph-paper-generator', 'printable-planner-maker', 'printable-calendar-maker', 'daily-planner-printable',
    'printable-flashcard-maker', 'double-sided-flashcards-printable', 'cornell-notes-template', 'hexagon-graph-paper-generator', 'calligraphy-practice-sheet-generator', 'cross-stitch-pattern-grid-generator',
  ] },
  { id: 'work', icon: 'receipt', tools: [
    'offer-poster-maker', 'price-tag-maker', 'resume-builder', 'notice-period-calculator', 'upload-file-checker', 'freelance-rate-calculator', 'quotation-generator', 'margin-markup-calculator', 'gst-invoice-generator',
  ] },
  { id: 'study', icon: 'type', tools: [
    'gpa-cgpa-calculator', 'final-grade-calculator', 'citation-generator', 'study-planner', 'word-counter', 'case-converter',
  ] },
  { id: 'sharing', icon: 'grid', tools: [
    'qr-code-generator', 'bulk-qr-code-generator', 'wifi-qr-code-generator', 'vcard-qr-code-generator', 'vcard-to-csv-converter',
  ] },
  { id: 'dev', icon: 'file-code', tools: [
    'json-formatter', 'base64-tool', 'url-encoder-decoder', 'timestamp-converter', 'uuid-generator', 'color-converter', 'password-generator', 'lorem-ipsum-generator',
  ] },
];
