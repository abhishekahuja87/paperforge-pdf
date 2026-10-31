import React, { useState } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  FileText,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Printer,
  Copy,
} from 'lucide-react';
import { protectPdf } from '../../lib/pdf/protect';

export const ProtectPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [requiresCurrentPassword, setRequiresCurrentPassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setPageCount(null);
    setRequiresCurrentPassword(false);
    setCurrentPassword('');
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
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

    if (!userPassword && !ownerPassword) {
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
      setRequiresCurrentPassword(false);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('PASSWORD_REQUIRED') || msg.includes('INVALID_PASSWORD')) {
        setRequiresCurrentPassword(true);
        setError(msg.replace(/^(PASSWORD_REQUIRED|INVALID_PASSWORD):\s*/, ''));
      } else {
        setError(msg || 'Failed to encrypt document.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Protect PDF with Password</h2>
          <p className="text-slate-500 text-sm mt-1">
            Encrypt your document locally in your browser. Zero bytes leave your machine.
          </p>
        </div>

        {/* Upload Drop Zone matching MergePdf identically */}
        {!file ? (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/70 transition cursor-pointer">
            <Upload className="w-10 h-10 text-indigo-500 mb-2" />
            <span className="font-semibold text-slate-700">Click to upload or drag & drop</span>
            <span className="text-xs text-slate-400 mt-1">Single PDF file up to 100MB</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
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

            {/* Existing Password Warning Input */}
            {requiresCurrentPassword && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 font-medium text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>This PDF is already password-protected</span>
                </div>
                <p className="text-xs text-amber-700">
                  Enter its current password below to unlock and apply your new security settings:
                </p>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Security Options */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                  Document Open Password (User Password)
                </label>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Password required to view the PDF..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                  Owner Password (Optional)
                </label>
                <input
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
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
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
                  download={`protected_${file.name}`}
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