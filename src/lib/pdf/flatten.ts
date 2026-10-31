import { PDFDocument } from 'pdf-lib';

export interface FlattenResult {
  pdfBytes: Uint8Array;
  fieldCount: number;
}

export async function flattenPdf(fileBuffer: ArrayBuffer): Promise<FlattenResult> {
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  let fieldCount = 0;

  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    fieldCount = fields.length;
    if (fieldCount > 0) {
      form.flatten();
    }
  } catch {
    fieldCount = 0;
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return { pdfBytes, fieldCount };
}