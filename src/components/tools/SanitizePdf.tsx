import React, { useState } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { 
  FileText, 
  ShieldCheck, 
  Download, 
  X, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  CheckCircle2,
  Lock,
  EyeOff,
  Briefcase,
  Scale
} from 'lucide-react';
import { sanitizePdf, type SanitizeResult } from '../../lib/pdf/sanitize';
import { getPdfPageCount } from '../../lib/pdf/split';
import { generatePdfFilename } from '../../lib/pdf/naming';

export const SanitizePdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // Sanitization Options
  const [stripDocumentInfo, setStripDocumentInfo] = useState<boolean>(true);
  const [stripXmpMetadata, setStripXmpMetadata] = useState<boolean>(true);
  const [stripPieceInfo, setStripPieceInfo] = useState<boolean>(true);
  const [stripThumbnails, setStripThumbnails] = useState<boolean>(true);
  const [stripFormScripts, setStripFormScripts] = useState<boolean>(true);
  const [stripEmbeddedFiles, setStripEmbeddedFiles] = useState<boolean>(true);

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [result, setResult] = useState<SanitizeResult | null>(null);

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    stripDocumentInfo,
    stripXmpMetadata,
    stripPieceInfo,
    stripThumbnails,
    stripFormScripts,
    stripEmbeddedFiles,
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
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
      setResult(null);
      setDownloadUrl(null);
      setDownloadName('');
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const handleSanitize = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const sanitizeResult = await sanitizePdf({
        fileBuffer: buffer,
        stripDocumentInfo,
        stripXmpMetadata,
        stripPieceInfo,
        stripThumbnails,
        stripFormScripts,
        stripEmbeddedFiles,
      });

      const blob = new Blob([sanitizeResult.pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const finalName = generatePdfFilename(file.name, 'sanitized', 'cleaned');

      setDownloadUrl(url);
      setDownloadName(finalName);
      setResult(sanitizeResult);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during document sanitization.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setPageCount(0);
    setResult(null);
    setDownloadUrl(null);
    setDownloadName('');
    setStatus('idle');
    setErrorMessage('');
    setLastGeneratedKey('');
  };

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      

      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          disabled={status === 'loading'}
          readingPdf={status === 'loading'}
          onFiles={(files) => { void handleFile(files[0]); }}
        />
      )}
      {!file && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{errorMessage}</p>
      )}

      <details className="rounded-xl border border-stone-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-stone-700">More about this tool</summary>
        <div className="mt-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Why Sanitize Before Sharing?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" /> Legal & Court Filings
                </span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Strips internal local computer usernames, network file paths, and unredacted thumbnail previews.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" /> Bids & RFP Proposals
                </span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Removes document revision history, internal template names, and previous client traces.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <EyeOff className="w-3.5 h-3.5 text-emerald-600" /> Source Privacy
                </span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Removes embedded printer tracking IDs, camera EXIF, and auto-executing script hooks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </details>

      {file && (
        <div className="space-y-5">
          {/* File Card */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  Total pages: <strong className="text-slate-700">{pageCount}</strong> &bull; {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sanitization Options Checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Select Metadata & Artifacts to Purge</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={stripDocumentInfo}
                  onChange={(e) => setStripDocumentInfo(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Document Info Fields</span>
                  <p className="text-[11px] text-slate-400">Purges Author, Title, Subject, Keywords, Creator tool, and Producer library.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={stripXmpMetadata}
                  onChange={(e) => setStripXmpMetadata(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">XMP Stream & Revision History</span>
                  <p className="text-[11px] text-slate-400">Purges raw XML streams containing edit history, revision IDs, and timestamps.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={stripPieceInfo}
                  onChange={(e) => setStripPieceInfo(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Application Fingerprints (PieceInfo)</span>
                  <p className="text-[11px] text-slate-400">Removes hidden Illustrator, InDesign, Word, and Acrobat workspace states.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={stripThumbnails}
                  onChange={(e) => setStripThumbnails(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Embedded Page Thumbnails</span>
                  <p className="text-[11px] text-slate-400">Deletes embedded thumbnail streams that may retain unredacted previews.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={stripFormScripts}
                  onChange={(e) => setStripFormScripts(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">JavaScript & Auto-Actions</span>
                  <p className="text-[11px] text-slate-400">Neutralizes document JavaScript, OpenAction hooks, and button scripts.</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={stripEmbeddedFiles}
                  onChange={(e) => setStripEmbeddedFiles(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 accent-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Embedded File Attachments</span>
                  <p className="text-[11px] text-slate-400">Strips invisible files and packages bundled inside the PDF structure.</p>
                </div>
              </label>

            </div>
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sanitization Complete
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Purged & Safe
                </span>
              </div>
              <div className="pt-1 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-900 block">Purged Security Artifacts:</span>
                <ul className="text-[11px] text-emerald-800 list-disc list-inside space-y-0.5">
                  {result.itemsRemoved.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Out of Sync Warning */}
          {isOutOfSync && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
              <span>Settings changed since last sanitize. Re-apply to refresh your download file.</span>
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Unsaved
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSanitize}
              disabled={status === 'processing'}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {status === 'processing' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isOutOfSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? 'Sanitizing Document...'
                  : isOutOfSync
                  ? 'Re-Sanitize with New Settings'
                  : 'Sanitize PDF & Remove Hidden Data'}
              </span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadName}
                className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
                  isOutOfSync
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-75'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{isOutOfSync ? 'Download Outdated File' : 'Download Sanitized PDF'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};