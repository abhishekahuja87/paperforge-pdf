import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { generatePdfFilename } from '../../lib/pdf/naming';
import {
  Download,
  AlertCircle,
  FileText,
  RefreshCw,
  ShieldCheck,
  Printer,
  Copy,
} from 'lucide-react';
import { protectPdf } from '../../lib/pdf/protect';

export const ProtectPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [userPassword, setUserPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setPageCount(null);
    setUserPassword('');
    setOwnerPassword('');
    setAllowPrinting(true);
    setAllowCopying(false);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    resetState();
    setFile(selectedFile);

    // Read buffer to inspect page count or detect existing password
    try {
      const buffer = await selectedFile.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      try {
        const loaded = await PDFDocument.load(buffer, { ignoreEncryption: true });
        setPageCount(loaded.getPageCount());
      } catch {
        setPageCount(null);
      }
    } catch {
      setPageCount(null);
    }
  };

  const handleProtect = async () => {
    if (!file) return;

    if (!userPassword.trim() && !ownerPassword.trim()) {
      setError('Please provide at least a Document Open password or an Owner password.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const protectedBytes = await protectPdf({
        fileBuffer: buffer,
        userPassword: userPassword,
        ownerPassword: ownerPassword,
        permissions: {
          printing: allowPrinting,
          copying: allowCopying,
        },
      });

      const blob = new Blob([protectedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('already password-protected')) {
        setError('This PDF is already password-protected. Remove its password with the Unlock PDF tool first, then protect it again.');
      } else {
        setError(msg || 'Failed to encrypt document.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto w-full space-y-4">
      <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
        {!file && error && <p role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">{error}</p>}

        {/* Upload Drop Zone matching MergePdf identically */}
        {!file ? (
          <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={(files) => { void handleFileSelect(files[0]); }}
        />
        ) : (
          <div className="space-y-5">
            {/* File Info Card */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {pageCount ? `Total pages: ${pageCount} • ` : ''}
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetState}
                className="text-xs text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded transition cursor-pointer"
              >
                Change
              </button>
            </div>

            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">To add the password, each page is turned into an image. The protected file looks the same, but its text cannot be selected or searched and links and form fields are lost. Keep your original.</p>

            {/* Security Options */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1" htmlFor="ProtectPdf-148">
                  Document Open Password (User Password)
                </label>
                <input id="ProtectPdf-148"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Password required to view the PDF..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1" htmlFor="ProtectPdf-161">
                  Owner Password (Optional)
                </label>
                <input id="ProtectPdf-161"
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Password required to edit permissions..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 px-1">
                  Allowed Permissions
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={allowPrinting}
                      onChange={(e) => setAllowPrinting(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex items-center space-x-2 text-sm text-slate-700">
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>Allow Printing</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={allowCopying}
                      onChange={(e) => setAllowCopying(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex items-center space-x-2 text-sm text-slate-700">
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Allow Copying</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
              {!downloadUrl ? (
                <button
                  type="button"
                  onClick={handleProtect}
                  disabled={isProcessing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Encrypting Document...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Protect PDF with Password</span>
                    </>
                  )}
                </button>
              ) : (
                <a
                  href={downloadUrl}
                  download={generatePdfFilename(file.name, 'protected')}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Protected PDF</span>
                </a>
              )}

              {downloadUrl && (
                <button
                  type="button"
                  onClick={resetState}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition cursor-pointer"
                >
                  Protect Another
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProtectPdf;