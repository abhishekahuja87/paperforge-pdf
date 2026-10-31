import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Download,
  AlertCircle,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { convertPdfToImages } from '../../lib/pdf/pdfToImages';
import type { PageImageResult } from '../../lib/pdf/pdfToImages';

export const PdfToImages: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPages([]);
    setError(null);
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

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const imgs = await convertPdfToImages(buffer, 2.0, 'image/png');
      setPages(imgs);
    } catch (err: any) {
      setError(err?.message || 'Failed to convert PDF pages into images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">PDF to Images</h2>
            <p className="text-sm text-slate-500">
              Extract every page of your PDF as high-resolution PNG images.
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
              <ImageIcon className="w-6 h-6" />
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

            {error && (
              <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!pages.length ? (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Pages...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Convert Pages to PNG</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Converted {pages.length} Pages</span>
                  <button
                    onClick={resetState}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                  >
                    Convert Another File
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
                  {pages.map((p) => (
                    <div key={p.pageNumber} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                      <img src={p.dataUrl} alt={`Page ${p.pageNumber}`} className="w-full h-auto object-contain flex-1 bg-white" />
                      <div className="p-2.5 flex items-center justify-between bg-slate-50 border-t border-slate-100 text-xs">
                        <span className="font-medium text-slate-700">Page {p.pageNumber}</span>
                        <a
                          href={p.dataUrl}
                          download={`${file.name.replace(/\.pdf$/i, '')}_page_${p.pageNumber}.png`}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1"
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
      </div>
    </div>
  );
};

export default PdfToImages;