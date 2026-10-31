import React, { useState, useRef } from 'react';
import {
  Layers,
  Download,
  AlertCircle,
  FileCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { flattenPdf } from '../../lib/pdf/flatten';

export const FlattenPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [flattenedCount, setFlattenedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setFlattenedCount(null);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    resetState();
    setFile(selectedFile);
  };

  const handleFlatten = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const { pdfBytes, fieldCount } = await flattenPdf(buffer);

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setFlattenedCount(fieldCount);
    } catch (err: any) {
      setError(err?.message || 'Failed to flatten PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Flatten PDF</h2>
            <p className="text-sm text-slate-500">
              Lock form fields and annotations permanently into the document to prevent future editing.
            </p>
          </div>
        </div>

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
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Click to upload or drag & drop</p>
              <p className="text-xs text-slate-400 mt-1">Single PDF file up to 100MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
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

            {flattenedCount !== null && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {flattenedCount > 0
                    ? `Successfully flattened ${flattenedCount} interactive form field${flattenedCount === 1 ? '' : 's'}.`
                    : 'No fillable fields detected. Document structure sanitized and locked.'}
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {!downloadUrl ? (
                <button
                  onClick={handleFlatten}
                  disabled={isProcessing}
                  className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Flattening Document...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Flatten PDF</span>
                    </>
                  )}
                </button>
              ) : (
                <a
                  href={downloadUrl}
                  download={`flattened_${file.name}`}
                  className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Flattened PDF</span>
                </a>
              )}

              {downloadUrl && (
                <button
                  onClick={resetState}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Flatten Another
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlattenPdf;