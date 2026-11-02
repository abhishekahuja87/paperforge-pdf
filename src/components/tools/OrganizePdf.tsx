import React, { useState } from 'react';
import {
  Upload,
  RotateCw,
  Trash2,
  Download,
  AlertCircle,
  FileText,
  Loader2,
  MoveLeft,
  MoveRight,
} from 'lucide-react';
import { loadPdfThumbnails, exportOrganizedPdf } from '../../lib/pdf/organize';
import type { PageThumbnailItem } from '../../lib/pdf/organize';

export const OrganizePdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  const resetState = () => {
    setFile(null);
    setPages([]);
    setIsLoading(false);
    setIsExporting(false);
    setError(null);
    setFileBuffer(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    resetState();
    setFile(selected);
    setIsLoading(true);

    try {
      const buffer = await selected.arrayBuffer();
      setFileBuffer(buffer);
      const loadedPages = await loadPdfThumbnails(buffer);
      setPages(loadedPages);
    } catch {
      setError('Failed to render PDF pages. The file may be password-protected or corrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPages(updated);
  };

  const rotatePage = (index: number) => {
    const updated = [...pages];
    updated[index] = {
      ...updated[index],
      rotation: (updated[index].rotation + 90) % 360,
    };
    setPages(updated);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      setError('A document must have at least one page.');
      return;
    }
    setError(null);
    setPages(pages.filter((_, idx) => idx !== index));
  };

  const handleExport = async () => {
    if (!fileBuffer || pages.length === 0) return;

    setIsExporting(true);
    setError(null);

    try {
      const bytes = await exportOrganizedPdf(fileBuffer, pages);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch {
      setError('Failed to export organized PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Organize PDF Pages</h2>
        <p className="text-slate-500 text-sm mt-1">
          Reorder, rotate, or delete PDF pages in your browser. The selected file is not uploaded to MyDailyUtils for processing.
        </p>
      </div>

      {/* Upload Drop Zone matching MergePdf identically */}
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
          {/* Selected File Card */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center space-x-3 overflow-hidden">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
              <span className="text-xs text-slate-400 shrink-0">
                ({pages.length} pages remaining)
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

          {/* Loading Previews Spinner */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Generating page previews in memory...</span>
            </div>
          )}

          {/* Interactive Thumbnails Grid */}
          {!isLoading && pages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-2">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  className="group relative bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl p-2.5 flex flex-col space-y-2 transition-all shadow-sm"
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center">
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${idx + 1}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain transition-transform duration-200"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/70 text-white rounded text-[10px] font-semibold">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Ordering & Rotation Toolbar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        title="Move Left"
                        disabled={idx === 0}
                        onClick={() => movePage(idx, 'left')}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <MoveLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Move Right"
                        disabled={idx === pages.length - 1}
                        onClick={() => movePage(idx, 'right')}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <MoveRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex space-x-1">
                      <button
                        type="button"
                        title="Rotate 90°"
                        onClick={() => rotatePage(idx)}
                        className="p-1 rounded hover:bg-slate-200 text-indigo-600 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete Page"
                        onClick={() => deletePage(idx)}
                        className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {!isLoading && pages.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              {!downloadUrl ? (
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving Document...</span>
                    </>
                  ) : (
                    <span>Save and Download PDF</span>
                  )}
                </button>
              ) : (
                <a
                  href={downloadUrl}
                  download={`organized_${file.name}`}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Organized PDF</span>
                </a>
              )}

              {downloadUrl && (
                <button
                  type="button"
                  onClick={resetState}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition cursor-pointer"
                >
                  Organize Another
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizePdf;