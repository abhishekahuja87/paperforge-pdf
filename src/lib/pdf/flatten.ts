import { PDFDocument } from 'pdf-lib';

export interface FlattenResult {
  pdfBytes: Uint8Array;
  fieldCount: number;
}

export async function flattenPdf(fileBuffer: ArrayBuffer): Promise<FlattenResult> {
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  if (pdfDoc.isEncrypted) {
    throw new Error('This PDF is password-protected. Remove the password with the Unlock PDF tool first.');
  }
  let fieldCount = 0;

  let fields: unknown[] = [];
  try {
    fields = pdfDoc.getForm().getFields();
  } catch {
    fields = [];
  }
  fieldCount = fields.length;
  if (fieldCount > 0) {
    // Let a failure surface: returning an unflattened file as if it were flattened would mislead.
    pdfDoc.getForm().flatten();
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return { pdfBytes, fieldCount };
}