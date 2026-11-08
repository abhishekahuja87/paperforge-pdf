import React, { useState } from 'react';
import { useDialog } from '../../../lib/useDialog';
import { LoaderCircle, Sparkles, X } from 'lucide-react';
import { generateSamplePdf, type SampleTemplate } from '../../../lib/pdf/generateSample';

interface SamplePdfModalProps {
  onClose: () => void;
  onAdd: (file: File) => Promise<void>;
}

const TEMPLATES: { id: SampleTemplate; label: string }[] = [
  { id: 'invoice', label: 'Invoice / Statement' },
  { id: 'lorem', label: 'Multi-Page Article' },
  { id: 'contract', label: 'Legal Contract / NDA' },
  { id: 'synthetic-pii', label: 'Synthetic PII / DLP' },
  { id: 'mixed-geometry', label: 'Mixed Geometry Stress' },
  { id: 'specsheet', label: 'Technical Spec Sheet' },
  { id: 'minimal', label: 'Minimal Ingest File' },
];

export const SamplePdfModal: React.FC<SamplePdfModalProps> = ({ onClose, onAdd }) => {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [template, setTemplate] = useState<SampleTemplate>('invoice');
  const [pageCount, setPageCount] = useState(3);
  const [title, setTitle] = useState('Sample Invoice');
  const [targetSizeMb, setTargetSizeMb] = useState(0);
  const [includeImages, setIncludeImages] = useState(false);
  const [includeBookmarks, setIncludeBookmarks] = useState(false);
  const [includeFormFields, setIncludeFormFields] = useState(false);
  const [includeLinksAndAnnotations, setIncludeLinksAndAnnotations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const cleanTitle = title.trim() || 'Sample PDF';
      const bytes = await generateSamplePdf({
        pageCount,
        template,
        title: cleanTitle,
        targetSizeMb,
        includeImages,
        includeBookmarks,
        includeFormFields,
        includeLinksAndAnnotations,
        corruptionMode: 'none',
      });
      const safeTitle = cleanTitle.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'sample';
      const fileBytes = new Uint8Array(bytes.byteLength);
      fileBytes.set(bytes);
      const file = new File([fileBytes.buffer], `${safeTitle}-sample.pdf`, { type: 'application/pdf' });
      await onAdd(file);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not generate the sample PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sample-pdf-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="sample-pdf-title" className="text-lg font-bold text-slate-900">Create a sample PDF input</h2>
            <p className="mt-1 text-xs text-slate-500">Generate a valid PDF locally and add it directly to the input deck.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close sample PDF dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Template</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TEMPLATES.map((item) => (
                <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold ${template === item.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Document title
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Page count · {pageCount}
              <input type="range" min="1" max="50" value={pageCount} onChange={(event) => setPageCount(Number(event.target.value))} className="mt-3 w-full accent-indigo-600" />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Optional PDF structures</legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['includeBookmarks', 'Bookmarks tree', includeBookmarks, setIncludeBookmarks],
                ['includeImages', 'Sample graphic', includeImages, setIncludeImages],
                ['includeFormFields', 'Interactive form', includeFormFields, setIncludeFormFields],
                ['includeLinksAndAnnotations', 'Highlights & URLs', includeLinksAndAnnotations, setIncludeLinksAndAnnotations],
              ] as const).map(([id, label, checked, setChecked]) => (
                <label key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs text-slate-700">
                  <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="accent-indigo-600" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Target file size (padded data)</legend>
            <div className="grid grid-cols-4 gap-2">
              {([0, 1, 5, 10] as const).map((size) => (
                <button key={size} type="button" onClick={() => setTargetSizeMb(size)} className={`rounded-lg border px-2 py-2 text-[10px] font-semibold ${targetSizeMb === size ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                  {size === 0 ? 'Standard' : `${size} MB`}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            Corruption/chaos modes are not included here: an intentionally broken PDF may not open as an input document.
          </p>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={isGenerating} onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={isGenerating} onClick={() => void handleGenerate()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Generating and adding…' : 'Generate & add to input'}
          </button>
        </div>
      </div>
    </div>
  );
};
