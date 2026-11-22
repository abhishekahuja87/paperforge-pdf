import React, { useState, useEffect } from 'react';
import { PdfFileBar } from '../common/PdfFileBar';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { FileDropZone } from '../common/FileDropZone';
import { 
  
  Trash2, 
  
  AlertCircle, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { getPdfPageCount, parsePageRanges } from '../../lib/pdf/split';
import { deletePdfPages } from '../../lib/pdf/deletePages';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useProtectedPdf } from '../common/ProtectedPdfGate';

export const DeletePagesPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagesInput, setPagesInput] = useState<string>('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    pagesInput,
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      const buffer = await selectedFile.arrayBuffer();
      const count = await getPdfPageCount(buffer);

      setFile(selectedFile);
      setPageCount(count);
      setPagesInput(count > 1 ? `${count}` : ''); // Suggest removing last page by default
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const handleDelete = async () => {
    if (!file) return;

    const indices = parsePageRanges(pagesInput, pageCount);
    if (indices.length === 0) {
      setErrorMessage(`Please enter valid page numbers between 1 and ${pageCount}.`);
      setStatus('error');
      return;
    }

    if (indices.length >= pageCount) {
      setErrorMessage(`Cannot delete all ${pageCount} pages. A PDF must retain at least one page.`);
      setStatus('error');
    }

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const outputBytes = await deletePdfPages({
        fileBuffer: buffer,
        pagesToRemove: pagesInput,
      });

      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const cleanDetails = `del-${indices.map((i) => i + 1).slice(0, 3).join('_')}${indices.length > 3 ? '-more' : ''}`;
      const finalName = generatePdfFilename(file.name, 'deleted-pages', cleanDetails);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during page deletion.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setPageCount(0);
    setPagesInput('');
    setDownloadUrl(null);
    setStatus('idle');
    setErrorMessage('');
    setLastGeneratedKey('');
  };

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      {passwordDialog}
      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          disabled={status === 'loading'}
          readingPdf={status === 'loading'}
          onFiles={(files) => { void prepare(files[0]).then((prepared) => { if (prepared) void handleFile(prepared); }); }}
        />
      )}
      {!file && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{errorMessage}</p>
      )}

      {file && (
        <div className="space-y-5">
          {/* File summary */}
          <PdfFileBar name={file.name} size={file.size} pages={pageCount} onChange={handleReset} />

          {/* Deletion Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="DeletePagesPdf-156">
              Page Numbers to Remove
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input id="DeletePagesPdf-156"
                type="text"
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                placeholder={`e.g. 1, 3, 5-${pageCount}`}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPagesInput('1')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  First Page
                </button>
                <button
                  type="button"
                  onClick={() => setPagesInput(`${pageCount}`)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Last Page
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Enter individual pages (e.g. <code className="text-slate-700">1, 4</code>) or ranges (e.g. <code className="text-slate-700">2-4</code>). You must retain at least one page.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}


          {/* Action Buttons */}
          {downloadUrl && <SaveResult href={downloadUrl} name={downloadName} label="Your PDF without those pages is ready" saveLabel="Save PDF" outdated={isOutOfSync} />}
          <div className="pt-2 flex flex-col gap-3">
            {(!downloadUrl || isOutOfSync) && (
              <button
                onClick={handleDelete}
                disabled={status === 'processing'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-orange-700 hover:bg-orange-800 text-white"
              >
                {status === 'processing' ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : isOutOfSync ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>
                  {status === 'processing'
                    ? 'Removing Pages...'
                    : isOutOfSync
                    ? 'Re-Process with New Settings'
                    : 'Delete Pages'}
                </span>
              </button>
            )}
            {downloadUrl && !isOutOfSync && <StartOverButton onClick={handleReset}>Delete pages from another PDF</StartOverButton>}

          </div>
        </div>
      )}
    </div>
  );
};