import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { generatePdfFilename } from '../../lib/pdf/naming';
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { flattenPdf } from '../../lib/pdf/flatten';
import { useProtectedPdf } from '../common/ProtectedPdfGate';

export const FlattenPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');
  const [flattenedCount, setFlattenedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setFlattenedCount(null);
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
      const { pdfBytes, fieldCount } = await flattenPdf(buffer);

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloadName(generatePdfFilename(file.name, 'flattened'));
      setFlattenedCount(fieldCount);
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
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center space-x-3 overflow-hidden">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
              <span className="text-xs text-slate-400 shrink-0">
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>

            <button
              type="button"
              onClick={resetState}
              className="text-xs text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded cursor-pointer transition"
            >
              Change
            </button>
          </div>

          {/* Success Banner */}
          {flattenedCount !== null && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {flattenedCount > 0
                  ? `Successfully flattened ${flattenedCount} interactive form field${flattenedCount === 1 ? '' : 's'}.`
                  : 'Document layers flattened and form fields locked permanently.'}
              </span>
            </div>
          )}
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
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {!downloadUrl ? (
            <button
              type="button"
              onClick={handleFlatten}
              disabled={isProcessing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
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
            <a
              href={downloadUrl}
              download={downloadName || generatePdfFilename(file.name, 'flattened')}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Flattened PDF</span>
            </a>
          )}

          {downloadUrl && (
            <button
              type="button"
              onClick={resetState}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition cursor-pointer"
            >
              Flatten Another
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FlattenPdf;