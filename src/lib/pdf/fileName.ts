/** Helpers for letting a person rename the file they are about to save. */

const UNSAFE = /[\\/:*?"<>|\u0000-\u001f]/g;

/** Splits "report.pdf" into ["report", ".pdf"]. A name without a short extension has an empty extension. */
export function splitExtension(name: string): [string, string] {
  const match = /^(.*?)(\.[A-Za-z0-9]{1,5})$/.exec(name);
  return match ? [match[1]!, match[2]!] : [name, ''];
}

/** A safe file name from what the person typed: no slashes or other characters that files cannot hold, the original extension kept. Returns null when nothing usable is left. */
export function cleanFileName(typed: string, extension: string): string | null {
  const [base] = splitExtension(typed.trim());
  const cleaned = (extension && typed.trim().toLowerCase().endsWith(extension.toLowerCase()) ? base : typed.trim())
    .replace(UNSAFE, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+|[.\s]+$/g, '')
    .slice(0, 120);
  return cleaned ? `${cleaned}${extension}` : null;
}

/** A readable file size: bytes, KB or MB, so a small file never shows as "0.00 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
