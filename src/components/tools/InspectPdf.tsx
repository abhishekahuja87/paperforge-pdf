import React, { useState } from 'react';
import { UploadNote } from '../common/UploadNote';
import { PdfFileBar } from '../common/PdfFileBar';
import { FileDropZone } from '../common/FileDropZone';
import { 
  
  
  AlertCircle, 
  
  
} from 'lucide-react';
import { inspectPdf, type PdfInspectionReport } from '../../lib/pdf/inspect';

export const InspectPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<PdfInspectionReport | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
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

      {!file && <UploadNote>A quick look at the file's structure and settings, not a full security check.</UploadNote>}


      {file && report && (
        <div className="space-y-5">
          {/* File Header */}
          <PdfFileBar name={file.name} size={report.fileSize} pages={report.pageCount} onChange={handleReset} />

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">PDF Version</span>
              <strong className="text-base text-slate-800 font-mono">{report.pdfHeaderVersion}</strong>
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