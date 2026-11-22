import React, { useState, useEffect } from 'react';
import { usePdfPageCount } from '../../lib/pdf/pageCount';
import { PdfFileBar } from '../common/PdfFileBar';
import { FileDropZone } from '../common/FileDropZone';
import { generatePdfFilename } from '../../lib/pdf/naming';
import {
  
  Loader2,
  
  AlertCircle,
} from 'lucide-react';
import { flattenPdf } from '../../lib/pdf/flatten';
import { useProtectedPdf } from '../common/ProtectedPdfGate';
import { SaveResult, StartOverButton } from '../common/SaveResult';

export const FlattenPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const pageTotal = usePdfPageCount(file);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setDownloadName('');
    }
  };

  const handleFileChange = (selected: File) => {
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file.');
        return;
      }
      resetState();
      setFile(selected);
    }
  };

  const handleFlatten = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);

      const buffer = await file.arrayBuffer();
      const { pdfBytes } = await flattenPdf(buffer);

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloadName(generatePdfFilename(file.name, 'flattened'));
    } catch (err) {
      setError(err instanceof Error && err.message.includes('password-protected')
        ? err.message
        : 'Failed to flatten PDF document. The file may be damaged, or a form field may contain characters the tool cannot draw.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
      {passwordDialog}

      {/* Standard Upload Drop Zone */}
      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={(files) => { void prepare(files[0]).then((prepared) => { if (prepared) void handleFileChange(prepared); }); }}
        />
      ) : (
        <div className="space-y-4">
          {/* Selected File Card */}
          <PdfFileBar name={file.name} size={file.size} pages={pageTotal} onChange={resetState} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      {file && (
        <div className="mt-8 flex flex-col gap-3 items-stretch">
          {!downloadUrl ? (
            <button
              type="button"
              onClick={handleFlatten}
              disabled={isProcessing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Flattening...</span>
                </>
              ) : (
                <span>Flatten PDF</span>
              )}
            </button>
          ) : (
            <SaveResult href={downloadUrl} name={downloadName || generatePdfFilename(file.name, 'flattened')} label="Your flattened PDF is ready" saveLabel="Save PDF" />
          )}

          {downloadUrl && (
            <StartOverButton onClick={resetState}>Flatten another PDF</StartOverButton>
          )}
        </div>
      )}
    </div>
  );
};

export default FlattenPdf;