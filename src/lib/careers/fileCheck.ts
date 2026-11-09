export interface FileInfo {
  name: string;
  size: number;
  /** Lower-case extension without the dot. */
  extension: string;
  kind: 'pdf' | 'image' | 'other';
  pages?: number;
  encrypted?: boolean;
  /** Characters of selectable text found on the first pages of a PDF. */
  textChars?: number;
  width?: number;
  height?: number;
}

export interface FileLimits {
  maxBytes: number;
  /** '' accepts any type; otherwise a comma list such as 'pdf,jpg,png'. */
  formats: string;
  maxPages: number;
  cleanName: boolean;
}

export type CheckLevel = 'pass' | 'warn' | 'fail';
export interface FileCheck { level: CheckLevel; label: string; detail: string; action?: 'compress-pdf' | 'unlock-pdf' | 'split-pdf' | 'image-resizer' | 'digitize-documents' }

export const kindOf = (extension: string, mime: string): FileInfo['kind'] => {
  if (extension === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) || mime.startsWith('image/')) return 'image';
  return 'other';
};

export const extensionOf = (name: string): string => {
  const index = name.lastIndexOf('.');
  return index > 0 && index < name.length - 1 ? name.slice(index + 1).toLowerCase() : '';
};

/** A safe version of a file name for upload forms: no spaces or symbols, standard characters only. */
export function cleanFileName(name: string): string {
  const extension = extensionOf(name);
  const stem = extension ? name.slice(0, name.length - extension.length - 1) : name;
  const ascii = stem.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  return `${ascii || 'document'}${extension ? `.${extension}` : ''}`;
}

export const formatSize = (bytes: number): string => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const sameFormat = (extension: string, wanted: string) => {
  const list = wanted.split(',').map((item) => item.trim().toLowerCase().replace(/^\./, '')).filter(Boolean);
  if (list.length === 0) return true;
  const normal = (value: string) => (value === 'jpeg' ? 'jpg' : value);
  return list.map(normal).includes(normal(extension));
};

/** Checks one file against what the upload form asks for. Each result says what was found and what to do next. */
export function evaluateFile(file: FileInfo, limits: FileLimits): FileCheck[] {
  const checks: FileCheck[] = [];

  if (limits.maxBytes > 0) {
    if (file.size <= limits.maxBytes) checks.push({ level: 'pass', label: 'File size', detail: `${formatSize(file.size)} is within the ${formatSize(limits.maxBytes)} limit.` });
    else {
      const over = Math.round((file.size / limits.maxBytes - 1) * 100);
      checks.push({
        level: 'fail', label: 'File size', detail: `${formatSize(file.size)} is ${over}% over the ${formatSize(limits.maxBytes)} limit.`,
        action: file.kind === 'pdf' ? 'compress-pdf' : file.kind === 'image' ? 'image-resizer' : undefined,
      });
    }
  } else checks.push({ level: 'pass', label: 'File size', detail: `${formatSize(file.size)}. No limit entered.` });

  if (limits.formats.trim()) {
    if (sameFormat(file.extension, limits.formats)) checks.push({ level: 'pass', label: 'File type', detail: `.${file.extension || 'unknown'} is accepted.` });
    else checks.push({ level: 'fail', label: 'File type', detail: `.${file.extension || 'unknown'} is not in the accepted list (${limits.formats.toUpperCase()}). Convert it first.` });
  }

  if (file.kind === 'pdf') {
    if (file.encrypted) {
      checks.push({ level: 'fail', label: 'Password', detail: 'This PDF is password-protected. Most upload forms and recruiters cannot open protected files.', action: 'unlock-pdf' });
    } else {
      if (limits.maxPages > 0 && file.pages !== undefined) {
        if (file.pages <= limits.maxPages) checks.push({ level: 'pass', label: 'Pages', detail: `${file.pages} page${file.pages === 1 ? '' : 's'}, within the ${limits.maxPages}-page limit.` });
        else checks.push({ level: 'fail', label: 'Pages', detail: `${file.pages} pages is over the ${limits.maxPages}-page limit.`, action: 'split-pdf' });
      } else if (file.pages !== undefined) checks.push({ level: 'pass', label: 'Pages', detail: `${file.pages} page${file.pages === 1 ? '' : 's'}.` });
      if (file.textChars !== undefined) {
        if (file.textChars < 20) checks.push({ level: 'warn', label: 'Searchable text', detail: 'No selectable text found. This looks like a scan or photo, so it cannot be searched or copied. That is fine for most forms, but recruiters\' systems read text.', action: 'digitize-documents' });
        else checks.push({ level: 'pass', label: 'Searchable text', detail: 'The PDF has selectable text.' });
      }
    }
  }

  if (file.kind === 'image' && file.width && file.height) {
    checks.push({ level: 'pass', label: 'Dimensions', detail: `${file.width} × ${file.height} pixels.` });
  }

  if (limits.cleanName) {
    const problems: string[] = [];
    if (/\s/.test(file.name)) problems.push('spaces');
    if (/[^A-Za-z0-9._-]/.test(file.name.replace(/\s/g, ''))) problems.push('special characters');
    if ((file.name.match(/\./g) ?? []).length > 1) problems.push('more than one dot');
    if (file.name.length > 50) problems.push('a long name');
    if (problems.length === 0) checks.push({ level: 'pass', label: 'File name', detail: 'The name is simple and safe.' });
    else checks.push({ level: 'warn', label: 'File name', detail: `The name has ${problems.join(', ')}; some portals reject these. Suggested: ${cleanFileName(file.name)}` });
  }

  return checks;
}

export const worstLevel = (checks: FileCheck[]): CheckLevel => (checks.some((item) => item.level === 'fail') ? 'fail' : checks.some((item) => item.level === 'warn') ? 'warn' : 'pass');
