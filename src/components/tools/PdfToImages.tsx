import React, { useState } from 'react';
import { usePdfPageCount } from '../../lib/pdf/pageCount';
import { PdfFileBar } from '../common/PdfFileBar';
import { FileDropZone } from '../common/FileDropZone';
import { generateFileName } from '../../lib/pdf/naming';
import {
  Download,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { convertPdfToImages } from '../../lib/pdf/pdfToImages';
import type { PageImageResult } from '../../lib/pdf/pdfToImages';
import { useProtectedPdf } from '../common/ProtectedPdfGate';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { useResultFile } from '../../lib/useResultFile';

export const PdfToImages: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const pageTotal = usePdfPageCount(file);
  const [pages, setPages] = useState<PageImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = useResultFile();

  const resetState = () => {
    saved.clear();
    setFile(null);
    setPages([]);
    setError(null);
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

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);

      const buffer = await file.arrayBuffer();
      const imgs = await convertPdfToImages(buffer, 2.0, 'image/png');
      setPages(imgs);
      // One picture is saved as it is; several are packed into one ZIP so a single Save button covers them all.
      if (imgs.length === 1) {
        saved.set(await (await fetch(imgs[0]!.dataUrl)).blob(), generateFileName('pdf-page', 'png', { base: file.name, details: 'page-1' }));
      } else {
        const zip = new (await import('jszip')).default();
        imgs.forEach((image) => zip.file(`page-${String(image.pageNumber).padStart(3, '0')}.png`, image.dataUrl.split(',')[1] ?? '', { base64: true }));
        saved.set(await zip.generateAsync({ type: 'blob' }), generateFileName('pdf-pages', 'zip', { base: file.name }));
      }
    } catch {
      setError('Failed to convert PDF pages into images. Please verify the document is not corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
      {passwordDialog}

      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={(files) => { void prepare(files[0]).then((prepared) => { if (prepared) void handleFileChange(prepared); }); }}
        />
      ) : (
        <div className="space-y-5">
          <PdfFileBar name={file.name} size={file.size} pages={pageTotal} onChange={resetState} />

          {!pages.length && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleConvert}
                disabled={isProcessing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Rendering Pages...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    <span>Convert pages to PNG</span>
                  </>
                )}
              </button>
            </div>
          )}

          {pages.length > 0 && saved.result && (
            <div className="space-y-3 pt-2">
              <SaveResult
                href={saved.result.url}
                name={saved.result.name}
                label={pages.length === 1 ? 'Your page image is ready' : `Your ${pages.length} page images are ready (ZIP)`}
                saveLabel={pages.length === 1 ? 'Save image' : 'Save ZIP'}
              />
              <StartOverButton onClick={resetState}>Convert another PDF</StartOverButton>
            </div>
          )}

          {pages.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-stone-600">Or save one page at a time</p>

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
                    <div className="flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <span className="font-medium text-slate-700">Page {p.pageNumber}</span>
                      <a
                        href={p.dataUrl}
                        download={generateFileName('pdf-page', 'png', { base: file.name, details: `page-${p.pageNumber}` })}
                        className="text-orange-800 hover:text-orange-900 font-semibold inline-flex items-center space-x-1 cursor-pointer"
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