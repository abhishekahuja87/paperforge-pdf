import React, { useState, useEffect } from 'react';
import { ColorField } from '../common/ColorPicker';
import { PdfFileBar } from '../common/PdfFileBar';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { FileDropZone } from '../common/FileDropZone';
import { 
  
  Stamp, 
  
  AlertCircle, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';
import { getPdfPageCount } from '../../lib/pdf/split';
import { 
  addWatermarkToPdf, 
  type WatermarkFont 
} from '../../lib/pdf/watermark';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useProtectedPdf } from '../common/ProtectedPdfGate';
import ui from '../../locales/packs/watermark.ui.en.json';

export const WatermarkPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // Settings
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(48);
  const [rotationAngle, setRotationAngle] = useState<number>(45);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [colorHex, setColorHex] = useState<string>('#ef4444');
  const [fontChoice, setFontChoice] = useState<WatermarkFont>('helvetica-bold');
  const [scope, setScope] = useState<'all' | 'odd' | 'even' | 'custom'>('all');
  const [rangeString, setRangeString] = useState<string>('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    text: text.trim(),
    fontSize,
    rotationAngle,
    opacity,
    colorHex,
    fontChoice,
    scope,
    rangeString: rangeString.trim(),
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

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
      const count = await getPdfPageCount(buffer);

      setFile(selectedFile);
      setPageCount(count);
      setRangeString(`1-${count}`);
      setDownloadUrl(null);
      setDownloadName('');
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const handleApply = async () => {
    if (!file) return;
    if (!text.trim()) {
      setErrorMessage('Please enter watermark text.');
      setStatus('error');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const outputBytes = await addWatermarkToPdf({
        fileBuffer: buffer,
        text: text.trim(),
        fontSize,
        rotationAngle,
        opacity,
        colorHex,
            fontChoice,
        scope,
        rangeString,
      });

      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const cleanText = text.trim().slice(0, 10).replace(/[^a-zA-Z0-9]/g, '_');
      const finalName = generatePdfFilename(file.name, 'watermarked', `${cleanText}_${rotationAngle}deg`);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during watermarking.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setPageCount(0);
    setDownloadUrl(null);
    setDownloadName('');
    setStatus('idle');
    setErrorMessage('');
    setLastGeneratedKey('');
  };

  const presets = [
    { label: 'Confidential (Red)', text: 'CONFIDENTIAL', color: '#ef4444', angle: 45 },
    { label: 'Draft (Amber)', text: 'DRAFT', color: '#f59e0b', angle: 45 },
    { label: 'Sample (Slate)', text: 'SAMPLE', color: '#64748b', angle: 45 },
    { label: 'Do Not Copy', text: 'DO NOT COPY', color: '#dc2626', angle: -45 },
  ];

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      {passwordDialog}
      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          disabled={status === 'loading'}
          readingPdf={status === 'loading'}
          onFiles={(files) => { void prepare(files[0]).then((prepared) => { if (prepared) void handleFile(prepared); }); }}
        />
      )}
      {!file && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{errorMessage}</p>
      )}

      {file && (
        <div className="space-y-5">
          {/* File Card */}
          <PdfFileBar name={file.name} size={file.size} pages={pageCount} onChange={handleReset} />

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">{ui.quickPresets}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((preset) => {
                const on = text === preset.text && colorHex === preset.color && rotationAngle === preset.angle;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setText(preset.text);
                      setColorHex(preset.color);
                      setRotationAngle(preset.angle);
                    }}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer text-xs ${on ? 'border-indigo-600 bg-white ring-1 ring-indigo-600' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <span className="font-semibold block text-slate-800">{preset.label}</span>
                    <span className="text-[10px] text-slate-500">{preset.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watermark Text & Custom Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="WatermarkPdf-204">{ui.watermarkText}</label>
              <input id="WatermarkPdf-204"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={ui.eGConfidentialDraftDo}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="WatermarkPdf-215">{ui.color}</label>
              <div className="flex items-center space-x-2">
                <ColorField value={colorHex} onChange={setColorHex} label="Watermark colour" className="w-9 h-9" />
                <input aria-label={ui.watermarkColourAsAHex}
                  type="text"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg uppercase bg-white"
                />
              </div>
            </div>
          </div>

          {/* Sliders: Size, Rotation, Opacity */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>{ui.fontSize}</span>
                  <span className="text-indigo-600 font-bold">{fontSize}pt</span>
                </div>
                <input aria-label={ui.watermarkFontSize}
                  type="range"
                  min={18}
                  max={96}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>{ui.rotation}</span>
                  <span className="text-indigo-600 font-bold">{rotationAngle}°</span>
                </div>
                <input aria-label={ui.watermarkRotationAngle}
                  type="range"
                  min={-90}
                  max={90}
                  step={5}
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>{ui.transparencyOpacity}</span>
                  <span className="text-indigo-600 font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input aria-label={ui.watermarkOpacity}
                  type="range"
                  min={5}
                  max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(e) => setOpacity(parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200/60">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700" htmlFor="WatermarkPdf-284">{ui.typographyFont}</label>
                <select id="WatermarkPdf-284"
                  value={fontChoice}
                  onChange={(e) => setFontChoice(e.target.value as WatermarkFont)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="helvetica-bold">{ui.helveticaBold}</option>
                  <option value="helvetica">{ui.standardHelvetica}</option>
                  <option value="courier">{ui.courierMonospace}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700" htmlFor="WatermarkPdf-297">{ui.applyTo}</label>
                <select id="WatermarkPdf-297"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">{ui.allPages}</option>
                  <option value="odd">{ui.oddPagesOnly13}</option>
                  <option value="even">{ui.evenPagesOnly24}</option>
                  <option value="custom">{ui.customPageRange}</option>
                </select>
              </div>
            </div>

            {scope === 'custom' && (
              <div className="pt-1">
                <input aria-label={ui.customPageRangesToWatermark}
                  type="text"
                  value={rangeString}
                  onChange={(e) => setRangeString(e.target.value)}
                  placeholder={`e.g. 1-2, 4, 6-${pageCount}`}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">{ui.separatePagesWithCommasOr}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}


          {/* Action Buttons */}
          {downloadUrl && <SaveResult href={downloadUrl} name={downloadName} label="Your watermarked PDF is ready" saveLabel="Save PDF" outdated={isOutOfSync} />}
          <div className="pt-2 flex flex-col gap-3">
            {(!downloadUrl || isOutOfSync) && (
              <button
                onClick={handleApply}
                disabled={status === 'processing'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-orange-700 hover:bg-orange-800 text-white"
              >
                {status === 'processing' ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : isOutOfSync ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Stamp className="w-4 h-4" />
                )}
                <span>
                  {status === 'processing'
                    ? 'Applying Watermark...'
                    : isOutOfSync
                    ? 'Re-Apply with New Settings'
                    : 'Add Watermark'}
                </span>
              </button>
            )}
            {downloadUrl && !isOutOfSync && <StartOverButton onClick={handleReset}>{ui.watermarkAnotherPdf}</StartOverButton>}

          </div>
        </div>
      )}
    </div>
  );
};