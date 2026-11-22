import { useState } from 'react';
import { useProtectedPdf } from '../../common/ProtectedPdfGate';
import { countPdfPages } from '../../../lib/pdf/pageCount';

export interface PdfSource { file: File; bytes: ArrayBuffer; name: string; size: number; pages: number | null }

/** Opens one PDF for a tool: asks for the password when needed, reads the bytes and counts the pages. */
export function usePdfSource(onOpened?: () => void) {
  const { prepare, dialog } = useProtectedPdf();
  const [source, setSource] = useState<PdfSource | null>(null);
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState('');

  const open = async (files: File[]) => {
    const chosen = files[0];
    if (!chosen) return;
    setMessage(''); setReading(true);
    try {
      const ready = await prepare(chosen);
      if (!ready) return;
      const bytes = await ready.arrayBuffer();
      const pages = await countPdfPages(ready);
      if (pages === null) { setMessage('Could not open that PDF. The file may be damaged.'); return; }
      setSource({ file: ready, bytes, name: ready.name, size: ready.size, pages });
      onOpened?.();
    } catch { setMessage('Could not open that PDF. The file may be damaged.'); } finally { setReading(false); }
  };
  const clear = () => { setSource(null); setMessage(''); };
  return { source, reading, message, setMessage, open, clear, dialog };
}
