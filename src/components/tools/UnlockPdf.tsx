import React, { useState, useEffect } from 'react';
import { usePdfPageCount } from '../../lib/pdf/pageCount';
import { PdfFileBar } from '../common/PdfFileBar';
import { FileDropZone } from '../common/FileDropZone';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { unlockPdf } from '../../lib/pdf/unlock';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { UploadNote } from '../common/UploadNote';

export const UnlockPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const pageTotal = usePdfPageCount(file);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const resetState = () => {
    setFile(null);
    setPassword('');
    setError(null);
    setIsUnlocked(false);
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

  const handleUnlock = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);

      const buffer = await file.arrayBuffer();
      const unlockedBytes = await unlockPdf({
        fileBuffer: buffer,
        password: password.trim(),
      });

      const blob = new Blob([unlockedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloadName(generatePdfFilename(file.name, 'unlocked'));
      setIsUnlocked(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('PASSWORD_REQUIRED') || msg.includes('INVALID_PASSWORD')) {
        setError(msg.replace(/^(PASSWORD_REQUIRED|INVALID_PASSWORD):\s*/, ''));
      } else {
        setError('Failed to unlock PDF. Please check the password and try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">

      {/* Upload Drop Zone matching MergePdf identically */}
      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={(files) => { void handleFileChange(files[0]); }}
        />
      ) : (
        <div className="space-y-4">
          {/* Selected File Card */}
          <PdfFileBar name={file.name} size={file.size} pages={pageTotal} onChange={resetState} />

          {/* Password Input Field */}
          {!isUnlocked && (
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider px-1" htmlFor="UnlockPdf-107">
                Document Password
              </label>
              <input id="UnlockPdf-107"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to unlock..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Success Banner */}
          {isUnlocked && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Password removed successfully! You can now download the unlocked document.</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {file && <div className="mt-4"><UploadNote tone="warning">The unlocked copy is rebuilt from page images, so its text can no longer be selected or searched and links and form fields are lost.</UploadNote></div>}

      {/* Action Buttons */}
      {file && (
        <div className="mt-8 flex flex-col gap-3 items-stretch">
          {!downloadUrl ? (
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isProcessing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <span>Unlock PDF</span>
              )}
            </button>
          ) : (
            <SaveResult href={downloadUrl} name={downloadName || generatePdfFilename(file.name, 'unlocked')} label="Your unlocked PDF is ready" saveLabel="Save PDF" />
          )}

          {downloadUrl && (
            <StartOverButton onClick={resetState}>Unlock another PDF</StartOverButton>
          )}
        </div>
      )}
    </div>
  );
};

export default UnlockPdf;