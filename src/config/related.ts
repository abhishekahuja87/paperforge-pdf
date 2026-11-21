import { COLLECTIONS } from './homeSections';

/** Hand-picked "what people do next" pairs for the busiest tools. Any tool not listed here gets its neighbours from the same home collection. */
const PICKS: Record<string, string[]> = {
  'merge-pdf': ['split-pdf', 'organize-pdf', 'compress-pdf', 'add-page-numbers'],
  'split-pdf': ['merge-pdf', 'delete-pdf-pages', 'organize-pdf', 'compress-pdf'],
  'compress-pdf': ['merge-pdf', 'split-pdf', 'pdf-to-images', 'protect-pdf'],
  'sign-pdf': ['fill-pdf', 'signature-maker', 'compress-pdf', 'unlock-pdf'],
  'fill-pdf': ['sign-pdf', 'document-scanner', 'compress-pdf', 'redact-pdf'],
  'redact-pdf': ['sanitize-pdf', 'compress-pdf', 'screenshot-redactor', 'protect-pdf'],
  'compare-pdf-and-text': ['extract-text', 'digitize-documents', 'inspect-pdf', 'merge-pdf'],
  'document-scanner': ['digitize-documents', 'image-to-pdf', 'compress-pdf', 'sign-pdf'],
  'digitize-documents': ['document-scanner', 'extract-text', 'compare-pdf-and-text', 'compress-pdf'],
  'image-resizer': ['image-compressor', 'passport-photo-sheet-maker', 'photo-name-date-strip', 'image-converter'],
  'image-compressor': ['image-resizer', 'image-converter', 'image-to-pdf', 'remove-photo-location'],
  'image-converter': ['image-resizer', 'image-compressor', 'image-to-pdf', 'pdf-to-images'],
  'passport-photo-sheet-maker': ['image-resizer', 'photo-name-date-strip', 'signature-maker', 'image-to-pdf'],
  'photo-name-date-strip': ['image-resizer', 'passport-photo-sheet-maker', 'signature-maker', 'image-compressor'],
  'remove-photo-location': ['image-compressor', 'screenshot-redactor', 'image-resizer', 'redact-pdf'],
  'screenshot-redactor': ['remove-photo-location', 'redact-pdf', 'image-compressor', 'image-resizer'],
  'image-to-pdf': ['merge-pdf', 'compress-pdf', 'document-scanner', 'image-resizer'],
  'pdf-to-images': ['image-compressor', 'extract-text', 'compress-pdf', 'split-pdf'],
  'qr-code-generator': ['qr-code-scanner', 'wifi-qr-code-generator', 'whatsapp-link-generator', 'upi-payment-qr-stand-printable'],
  'qr-code-scanner': ['qr-code-generator', 'wifi-qr-code-generator', 'whatsapp-link-generator', 'barcode-generator'],
  'whatsapp-link-generator': ['qr-code-generator', 'qr-code-scanner', 'visiting-card-maker', 'vcard-qr-code-generator'],
  'barcode-generator': ['qr-code-generator', 'qr-code-scanner', 'price-tag-maker', 'storage-box-and-file-label-printable'],
  'unlock-pdf': ['protect-pdf', 'compress-pdf', 'merge-pdf', 'sanitize-pdf'],
  'protect-pdf': ['unlock-pdf', 'sanitize-pdf', 'redact-pdf', 'compress-pdf'],
};

/** Up to `limit` other tool ids worth opening after this one. Only ids in `exists` are returned. */
export function relatedToolIds(id: string, exists: (id: string) => boolean, limit = 4): string[] {
  const out: string[] = [];
  const add = (other: string) => { if (other !== id && exists(other) && !out.includes(other)) out.push(other); };
  for (const other of PICKS[id] ?? []) add(other);
  if (out.length < limit) {
    const home = COLLECTIONS.find((collection) => collection.tools.includes(id));
    if (home) {
      const at = home.tools.indexOf(id);
      for (let step = 1; step < home.tools.length && out.length < limit; step += 1) {
        const next = home.tools[(at + step) % home.tools.length];
        if (next) add(next);
      }
    }
  }
  return out.slice(0, limit);
}
