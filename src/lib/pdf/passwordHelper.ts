import { PDFDocument } from 'pdf-lib';

/**
 * Safely loads a PDF document, handling password encryption.
 */
export async function loadPdfDocument(
  fileBuffer: ArrayBuffer,
  password?: string
): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(fileBuffer, {
      ignoreEncryption: !password,
      ...(password ? { password } : {}),
    } as any);
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.includes('encrypted') || message.includes('password') || message.includes('Encrypt')) {
      const error: any = new Error('PASSWORD_REQUIRED');
      error.isPasswordRequired = true;
      throw error;
    }
    throw err;
  }
}
