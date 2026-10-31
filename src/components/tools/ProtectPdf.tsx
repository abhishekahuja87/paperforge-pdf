import React, { useState, useRef } from 'react';
import {
  Lock,
  Download,
  AlertCircle,
  FileCheck,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Pre-check with pdf-lib / basic read to count pages or check lock
      const { PDFDocument } = await import('pdf-lib');
      try {
        const loaded = await PDFDocument.load(buffer, { ignoreEncryption: true });
        setPageCount(loaded.getPageCount());
      } catch {
        // If it fails to parse headers or is tightly encrypted, fallback
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
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Protect PDF with Password</h2>
            <p className="text-sm text-slate-500">
              Encrypt your document locally in your browser. Zero bytes leave your machine.
            </p>
          </div>
        </div>

        {/* File Picker */}
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 transition-colors p-8 rounded-xl text-center cursor-pointer space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,application/pdf"
              className="hidden"
            />
            <div className="inline-flex p-3 bg-white rounded-full shadow-sm text-indigo-600">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Click to upload or drag & drop</p>
              <p className="text-xs text-slate-400 mt-1">Single PDF file up to 100MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* File Info Card */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {pageCount ? `Total pages: ${pageCount} • ` : ''}
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
              <button
                onClick={resetState}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1 rounded transition-colors"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Allowed Permissions
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={allowPrinting}
                      onChange={(e) => setAllowPrinting(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
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
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
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
              <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {!downloadUrl ? (
                <button
                  onClick={handleProtect}
                  disabled={isProcessing}
                  className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Encrypting Document...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Protect PDF with Password</span>
                    </>
                  )}
                </button>
              ) : (
                <a
                  href={downloadUrl}
                  download={`protected_${file.name}`}
                  className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Protected PDF</span>
                </a>
              )}

              {downloadUrl && (
                <button
                  onClick={resetState}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
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