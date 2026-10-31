import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { convertPdfToImages } from '../../lib/pdf/pdfToImages';
import type { PageImageResult } from '../../lib/pdf/pdfToImages';

export const PdfToImages: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setPages([]);
    setError(null);
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

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);

      const buffer = await file.arrayBuffer();
      const imgs = await convertPdfToImages(buffer, 2.0, 'image/png');
      setPages(imgs);
    } catch {
      setError('Failed to convert PDF pages into images. Please verify the document is not corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">PDF to Images</h2>
        <p className="text-slate-500 text-sm mt-1">
          Extract every page of your PDF as high-resolution PNG images. 100% processed directly in your browser.
        </p>
      </div>

      {!file ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/70 transition cursor-pointer">
          <Upload className="w-10 h-10 text-indigo-500 mb-2" />
          <span className="font-semibold text-slate-700">Click to upload or drag & drop</span>
          <span className="text-xs text-slate-400 mt-1">Select single PDF file up to 100MB</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-5">
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

          {!pages.length && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Rendering Pages...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    <span>Convert Pages to PNG</span>
                  </>
                )}
              </button>
            </div>
          )}

          {pages.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Converted {pages.length} Pages</span>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  Convert Another File
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
                {pages.map((p) => (
                  <div
                    key={p.pageNumber}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col"
                  >
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="w-full h-auto object-contain flex-1 bg-white"
                    />
                    <div className="p-2.5 flex items-center justify-between bg-slate-50 border-t border-slate-100 text-xs">
                      <span className="font-medium text-slate-700">Page {p.pageNumber}</span>
                      <a
                        href={p.dataUrl}
                        download={`${file.name.replace(/\.pdf$/i, '')}_page_${p.pageNumber}.png`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PdfToImages;