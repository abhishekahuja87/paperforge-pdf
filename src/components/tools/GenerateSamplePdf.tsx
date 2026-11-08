import React, { useState } from 'react';
import { 
  FilePlus, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw 
} from 'lucide-react';
import { 
  generateSamplePdf, 
  type SampleTemplate, 
  type CorruptionMode 
} from '../../lib/pdf/generateSample';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useTranslation } from 'react-i18next';

export const GenerateSamplePdf: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [pageCount, setPageCount] = useState<number>(3);
  const [template, setTemplate] = useState<SampleTemplate>('invoice');
  const [customTitle, setCustomTitle] = useState<string>('Sample Invoice');
  const [targetSizeMb, setTargetSizeMb] = useState<number>(0);

  // Advanced PDF Structure Toggles
  const [includeImages, setIncludeImages] = useState<boolean>(false);
  const [includeBookmarks, setIncludeBookmarks] = useState<boolean>(false);
  const [includeFormFields, setIncludeFormFields] = useState<boolean>(false);
  const [includeLinksAndAnnotations, setIncludeLinksAndAnnotations] = useState<boolean>(false);
  const [corruptionMode, setCorruptionMode] = useState<CorruptionMode>('none');

  // UI state
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  
  // Track generated state to give clear feedback when settings change
  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    pageCount,
    template,
    customTitle,
    targetSizeMb,
    includeImages,
    includeBookmarks,
    includeFormFields,
    includeLinksAndAnnotations,
    corruptionMode,
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

  const handleTemplateChange = (newTemplate: SampleTemplate) => {
    setTemplate(newTemplate);
    if (newTemplate === 'invoice') {
      setCustomTitle('Sample Invoice');
      setIncludeImages(false);
      setIncludeFormFields(false);
    } else if (newTemplate === 'contract') {
      setCustomTitle('Mutual NDA Agreement');
      setIncludeImages(false);
      setIncludeFormFields(true);
    } else if (newTemplate === 'synthetic-pii') {
      setCustomTitle('Synthetic PII Audit Sample');
      setIncludeImages(false);
    } else if (newTemplate === 'specsheet') {
      setCustomTitle('Component Specifications');
      setIncludeImages(false);
    } else if (newTemplate === 'mixed-geometry') {
      setCustomTitle('Mixed Geometry Stress Test');
      setPageCount(4);
    } else {
      setCustomTitle('Sample Document');
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);

      const titleToUse = customTitle.trim() || 'Sample PDF';
      const pdfBytes = await generateSamplePdf({
        pageCount,
        template,
        title: titleToUse,
        targetSizeMb,
        includeImages,
        includeBookmarks,
        includeFormFields,
        includeLinksAndAnnotations,
        corruptionMode,
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const details = `${template}_${pageCount}p${corruptionMode !== 'none' ? `_${corruptionMode}` : ''}`;
      const finalName = generatePdfFilename(titleToUse, 'sample', details);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
    } catch (err) {
      console.error('Failed to generate sample PDF:', err);
      setGenerationError('The sample PDF could not be generated. Try fewer pages or turn off some options.');
    } finally {
      setIsGenerating(false);
    }
  };

  const templateIds: SampleTemplate[] = [
    'invoice', 'lorem', 'contract', 'synthetic-pii', 'mixed-geometry', 'specsheet', 'minimal',
  ];
  const templates = templateIds.map((id) => ({
    id,
    label: t(`sampleControls.templates.${id}.0`),
    desc: t(`sampleControls.templates.${id}.1`),
  }));

  return (
    <div lang={i18n.language} className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      
      {/* 1. Template Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          {t('sampleControls.choose')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleTemplateChange(tmpl.id)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                template === tmpl.id
                  ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-semibold">{tmpl.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{tmpl.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Basic Configuration */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="GenerateSamplePdf-160">
          {t('sampleControls.details')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">{t('sampleControls.title')}</span>
            <input id="GenerateSamplePdf-160"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              placeholder={t('sampleControls.titlePlaceholder')}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">{t('sampleControls.totalPages')}</span>
              <span className="text-indigo-600 font-bold">{t('sampleControls.pages', { count: pageCount })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <input aria-label="Number of pages"
                type="range"
                min={1}
                max={50}
                value={pageCount}
                onChange={(e) => setPageCount(parseInt(e.target.value, 10))}
                className="flex-1 accent-indigo-600 cursor-pointer"
              />
              <div className="flex gap-1">
                {[1, 3, 5, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPageCount(count)}
                    className={`px-2 py-0.5 text-[10px] rounded font-semibold border transition cursor-pointer ${
                      pageCount === count
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {count}p
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Advanced Toggle */}
      <div className="pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
        >
          <span>{t('sampleControls.advanced')}</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
            {/* Feature checkboxes */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">{t('sampleControls.structures')}</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <label className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBookmarks}
                    onChange={(e) => setIncludeBookmarks(e.target.checked)}
                    className="rounded text-indigo-600 w-3.5 h-3.5 accent-indigo-600"
                  />
                  <span className="text-[11px] text-slate-700 font-medium">{t('sampleControls.bookmarks')}</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="rounded text-indigo-600 w-3.5 h-3.5 accent-indigo-600"
                  />
                  <span className="text-[11px] text-slate-700 font-medium">{t('sampleControls.graphic')}</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFormFields}
                    onChange={(e) => setIncludeFormFields(e.target.checked)}
                    className="rounded text-indigo-600 w-3.5 h-3.5 accent-indigo-600"
                  />
                  <span className="text-[11px] text-slate-700 font-medium">{t('sampleControls.form')}</span>
                </label>

                <label className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLinksAndAnnotations}
                    onChange={(e) => setIncludeLinksAndAnnotations(e.target.checked)}
                    className="rounded text-indigo-600 w-3.5 h-3.5 accent-indigo-600"
                  />
                  <span className="text-[11px] text-slate-700 font-medium">{t('sampleControls.links')}</span>
                </label>
              </div>
            </div>

            {/* Target Size Selection */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">{t('sampleControls.target')}</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { mb: 0, label: t('sampleControls.standard') },
                  { mb: 1, label: '1 MB' },
                  { mb: 5, label: '5 MB' },
                  { mb: 10, label: '10 MB' },
                ].map((sizeOpt) => (
                  <button
                    key={sizeOpt.mb}
                    type="button"
                    onClick={() => setTargetSizeMb(sizeOpt.mb)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer text-[10px] ${
                      targetSizeMb === sizeOpt.mb
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {sizeOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QA Chaos Corruption */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-slate-700">{t('sampleControls.chaos')}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: t('sampleControls.valid') },
                  { id: 'truncated-eof', label: t('sampleControls.truncated') },
                  { id: 'broken-header', label: t('sampleControls.header') },
                  { id: 'scrambled-xref', label: t('sampleControls.xref') },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCorruptionMode(opt.id as CorruptionMode)}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      corruptionMode === opt.id
                        ? opt.id === 'none'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600'
                          : 'border-amber-600 bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback banner if settings were changed after generating */}
      {isOutOfSync && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
          <span>{t('sampleControls.changed')}</span>
          <span className="font-semibold text-amber-900 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> {t('sampleControls.unsaved')}
          </span>
        </div>
      )}

      {generationError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">{generationError}</p>}

      {/* 4. Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isGenerating ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : isOutOfSync ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <FilePlus className="w-4 h-4" />
          )}
          <span>{t(isGenerating ? 'sampleControls.generating' : isOutOfSync ? 'sampleControls.regenerate' : 'sampleControls.generate')}</span>
        </button>

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName || 'sample_document.pdf'}
            className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
              isOutOfSync
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-75'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>
              {isOutOfSync
                ? t('sampleControls.outdated')
                : t('sampleControls.download', { title: customTitle, pages: pageCount })}
            </span>
          </a>
        )}
      </div>
    </div>
  );
};