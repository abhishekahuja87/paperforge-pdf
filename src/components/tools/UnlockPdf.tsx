import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { unlockPdf } from '../../lib/pdf/unlock';

export const UnlockPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
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
      setDownloadName(`unlocked_${file.name}`);
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
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Unlock PDF</h2>
        <p className="text-slate-500 text-sm mt-1">
          Permanently remove password protection from an encrypted document. 100% processed directly in your browser.
        </p>
      </div>

      {/* Upload Drop Zone matching MergePdf identically */}
      {!file ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/70 transition cursor-pointer">
          <Upload className="w-10 h-10 text-indigo-500 mb-2" />
          <span className="font-semibold text-slate-700">Click to upload or drag & drop</span>
          <span className="text-xs text-slate-400 mt-1">Select password-protected PDF file</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
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

          {/* Password Input Field */}
          {!isUnlocked && (
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                Document Password
              </label>
              <input
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

      {/* Action Buttons */}
      {file && (
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {!downloadUrl ? (
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
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
            <a
              href={downloadUrl}
              download={downloadName || `unlocked_${file.name}`}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Unlocked PDF</span>
            </a>
          )}

          {downloadUrl && (
            <button
              type="button"
              onClick={resetState}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition cursor-pointer"
            >
              Unlock Another
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UnlockPdf;