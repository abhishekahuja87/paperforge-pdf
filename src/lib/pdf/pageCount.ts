import { useEffect, useState } from 'react';

/** Number of pages in a PDF, or null when it cannot be read (for example a password-protected file). */
export async function countPdfPages(file: File): Promise<number | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
    return doc.getPageCount();
  } catch {
    return null;
  }
}

/** The page count of the chosen file, filled in a moment after it is chosen. */
export function usePdfPageCount(file: File | null): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(null);
    if (!file) return undefined;
    let current = true;
    void countPdfPages(file).then((value) => { if (current) setCount(value); });
    return () => { current = false; };
  }, [file]);
  return count;
}
