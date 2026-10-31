import { PDFDocument } from 'pdf-lib';

export interface ProtectPdfOptions {
  fileBuffer: ArrayBuffer;
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: 'highResolution' | 'lowResolution';
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
    fillingForms?: boolean;
    contentAccessibility?: boolean;
    documentAssembly?: boolean;
  };
}

export async function protectPdf(options: ProtectPdfOptions): Promise<Uint8Array> {
  const { fileBuffer, userPassword = '', ownerPassword = '', permissions } = options;

  if (!userPassword && !ownerPassword) {
    throw new Error('Please set at least a user password (to open) or an owner password (to restrict).');
  }

  const pdfDoc = await PDFDocument.load(fileBuffer);

  // Encrypt in-browser memory
  await pdfDoc.encrypt({
    userPassword: userPassword || undefined,
    ownerPassword: ownerPassword || userPassword || undefined,
    permissions: permissions || {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  return await pdfDoc.save();
}