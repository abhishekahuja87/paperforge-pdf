import React, { useState } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { 
  FileText, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  Terminal,
  FileCode2
} from 'lucide-react';
import { inspectPdf, type PdfInspectionReport } from '../../lib/pdf/inspect';
import { useTranslation } from 'react-i18next';

export const InspectPdf: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<PdfInspectionReport | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      const buffer = await selectedFile.arrayBuffer();
      const inspectionData = await inspectPdf(buffer);

      setFile(selectedFile);
      setReport(inspectionData);
      setStatus('done');
    } catch {
      setErrorMessage('Failed to parse PDF structures. File may be encrypted or corrupted.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setReport(null);
    setStatus('idle');
    setErrorMessage('');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      

      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          disabled={status === 'loading'}
          readingPdf={status === 'loading'}
          onFiles={(files) => { void handleFile(files[0]); }}
        />
      )}

      <details lang={i18n.language} className="rounded-xl border border-stone-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-stone-700">{t('toolInfo.more')}</summary>
        <div className="mt-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-600" />
              {t('toolInfo.inspect.0')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-600" /> {t('toolInfo.inspect.1')}
                </span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('toolInfo.inspect.2')}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t('toolInfo.inspect.3')}
                </span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('toolInfo.inspect.4')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </details>

      {file && report && (
        <div className="space-y-5">
          {/* File Header */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  Size: <strong className="text-slate-700">{formatBytes(report.fileSize)}</strong> &bull; Spec: <strong className="text-indigo-600">{report.pdfHeaderVersion}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              title="Inspect another file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Pages</span>
              <strong className="text-base text-slate-800 font-mono">{report.pageCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Encrypted</span>
              <strong className={`text-base font-mono ${report.isEncrypted ? 'text-amber-600' : 'text-emerald-600'}`}>
                {report.isEncrypted ? 'Yes' : 'No'}
              </strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">XMP Stream</span>
              <strong className={`text-base font-mono ${report.hasXmpMetadata ? 'text-indigo-600' : 'text-slate-400'}`}>
                {report.hasXmpMetadata ? 'Present' : 'None'}
              </strong>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Scripts / Hooks</span>
              <strong className={`text-base font-mono ${report.hasJavaScript ? 'text-red-600' : 'text-emerald-600'}`}>
                {report.hasJavaScript ? 'Detected' : 'Clean'}
              </strong>
            </div>
          </div>

          {/* Document Info Dictionary */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Standard Info Dictionary</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-white rounded-lg border border-slate-200/60 truncate">
                <span className="text-slate-400 block text-[10px]">Title:</span>
                <span className="text-slate-800">{report.metadata.title || '<empty>'}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/60 truncate">
                <span className="text-slate-400 block text-[10px]">Author:</span>
                <span className="text-slate-800">{report.metadata.author || '<empty>'}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/60 truncate">
                <span className="text-slate-400 block text-[10px]">Creator Tool:</span>
                <span className="text-slate-800">{report.metadata.creator || '<empty>'}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/60 truncate">
                <span className="text-slate-400 block text-[10px]">Producer Library:</span>
                <span className="text-slate-800">{report.metadata.producer || '<empty>'}</span>
              </div>
            </div>
          </div>

          {/* Geometry Analysis Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Page Geometry & Bounding Boxes</span>
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Page</th>
                    <th className="p-2.5">Dimensions (pt)</th>
                    <th className="p-2.5">Aspect Ratio</th>
                    <th className="p-2.5">Rotation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px] bg-white">
                  {report.pages.map((p) => (
                    <tr key={p.pageNumber} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-700">#{p.pageNumber}</td>
                      <td className="p-2.5 text-slate-600">{p.width} &times; {p.height}</td>
                      <td className="p-2.5 text-slate-500">{p.aspectRatio}</td>
                      <td className="p-2.5 text-slate-500">{p.rotation}&deg;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};