/**
 * The "free, no limits, nothing uploaded" promise, in one place. Only tools whose files are handled without any cap set by this site
 * may carry the badge. Tools with a built-in cap (the document scanner and Digitize Documents limit picture size, for example) are left out.
 */
export const PROMISE = {
  badge: 'Free · No limits · Nothing uploaded',
  short: 'No daily limit, no file-count limit, no sign-up, no watermark, and your file never leaves your device.',
  note: 'Very large files are limited only by your own device’s memory.',
} as const;

export const NO_LIMIT_TOOL_IDS: readonly string[] = [
  'merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'delete-pdf-pages', 'organize-pdf', 'image-to-pdf', 'pdf-to-images', 'extract-text',
  'add-page-numbers', 'watermark-pdf', 'crop-pdf', 'protect-pdf', 'unlock-pdf', 'sanitize-pdf', 'flatten-pdf', 'n-up-pdf', 'inspect-pdf', 'sign-pdf',
  'fill-pdf', 'make-pdf-fillable', 'smart-split-pdf', 'pdf-bates-numbering', 'redact-pdf', 'compare-pdf-and-text',
  'image-compressor', 'image-converter', 'image-resizer', 'bulk-image-tools', 'social-image-resizer', 'gif-maker', 'remove-photo-location',
];

export const hasNoLimitBadge = (id: string): boolean => NO_LIMIT_TOOL_IDS.includes(id);
