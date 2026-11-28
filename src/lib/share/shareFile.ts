/**
 * Sharing a finished file through the device's own share sheet (WhatsApp, Gmail, Drive and so on).
 * Nothing is uploaded by this site: the browser hands the file straight to the app the person picks.
 */

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported' | 'failed';

/** True when this browser can open a share sheet with files in it. Most phones can; many desktop browsers cannot. */
export function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
}

/** Wraps a finished Blob as a File with its name, which is what the share sheet needs. */
export function toFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type || 'application/octet-stream' });
}

/** Opens the share sheet for one file. Closing the sheet without choosing an app is not an error. */
export async function shareFile(file: File, title?: string): Promise<ShareOutcome> {
  if (!canShareFiles() || !navigator.canShare({ files: [file] })) return 'unsupported';
  try {
    await navigator.share({ files: [file], title: title ?? file.name });
    return 'shared';
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
