/** Wraps bytes from a PDF or image library in a Blob. Use this instead of writing the BlobPart cast by hand. */
export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  return new Blob([bytes as BlobPart], { type });
}

export function pdfBlob(bytes: Uint8Array): Blob {
  return bytesToBlob(bytes, 'application/pdf');
}
