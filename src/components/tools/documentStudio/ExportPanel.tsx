import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, LoaderCircle, LockKeyhole } from 'lucide-react';
import { toFile } from '../../../lib/share/shareFile';
import { ShareFileButton } from '../../common/ShareFileButton';
import type { OutputSequenceItem, StudioSettings } from '../../../lib/documentStudio/types';
import ui from '../../../locales/packs/docstudio.ui.en.json';
import { PAGE_STANDARD_LABELS } from '../../../lib/documentStudio/helpers';

interface ExportPanelProps {
  digitize: boolean;
  downloadName: string;
  downloadUrl: string;
  handleExport: () => Promise<void>;
  isExporting: boolean;
  ocrLanguage: 'eng' | 'hin+eng';
  outputItems: OutputSequenceItem[];
  separate: boolean;
  setDownloadUrl: (url: string) => void;
  setOcrLanguage: (language: 'eng' | 'hin+eng') => void;
  setSeparate: (value: boolean) => void;
  settings: StudioSettings;
  updateSettings: <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;
}

/** PDF properties, page numbers, watermark, protection and the final Create button. */
export const ExportPanel: React.FC<ExportPanelProps> = ({ digitize, downloadName, downloadUrl, handleExport, isExporting, ocrLanguage, outputItems, separate, setDownloadUrl, setOcrLanguage, setSeparate, settings, updateSettings }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{ui.pdfPropertiesDocumentWideOutput}</h2>
          <p className="text-[10px] text-slate-500">{ui.theseSettingsApplyWhenThe}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700"><LockKeyhole className="h-3 w-3" />{ui.localProcessing}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="block text-[10px] font-semibold text-slate-600 sm:col-span-2 xl:col-span-3">
            Download filename
            <div className="mt-1 flex items-center rounded-lg border border-slate-200 px-2.5 text-xs focus-within:border-indigo-400">
              <input value={settings.outputFileName} onChange={(event) => updateSettings('outputFileName', event.target.value)} maxLength={120} className="min-w-0 flex-1 py-2 outline-none" placeholder={ui.masterDocument} />
              <span className="text-slate-400">.pdf</span>
            </div>
            <span className="mt-1 block font-normal text-slate-400">{ui.filenameOnlySeparateFromPdf}</span>
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            PDF title property
            <input value={settings.documentTitle} onChange={(event) => updateSettings('documentTitle', event.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder={ui.masterDocument2} />
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            PDF author property
            <input value={settings.documentAuthor} onChange={(event) => updateSettings('documentAuthor', event.target.value)} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder={ui.authorName} />
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            PDF subject property
            <input value={settings.documentSubject} onChange={(event) => updateSettings('documentSubject', event.target.value)} maxLength={160} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder={ui.documentSubject} />
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            PDF keywords property
            <input value={settings.documentKeywords} onChange={(event) => updateSettings('documentKeywords', event.target.value)} maxLength={240} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder={ui.commaSeparatedKeywords} />
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            Page standardization
            <select value={settings.pageStandard} onChange={(event) => updateSettings('pageStandard', event.target.value as StudioSettings['pageStandard'])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
              {Object.entries(PAGE_STANDARD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            Page numbering
            <select value={settings.numberPosition} onChange={(event) => updateSettings('numberPosition', event.target.value as StudioSettings['numberPosition'])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
              <option value="none">{ui.none}</option>
              <option value="bottom-center">{ui.bottomCenter}</option>
              <option value="bottom-right">{ui.bottomRight}</option>
              <option value="top-right">{ui.topRight}</option>
            </select>
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            Number format
            <input value={settings.numberFormat} onChange={(event) => updateSettings('numberFormat', event.target.value)} disabled={settings.numberPosition === 'none'} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs disabled:bg-slate-100 disabled:text-slate-400" placeholder="Page {page} of {total}" />
            {settings.numberPosition === 'none' && <span className="mt-1 block font-normal text-slate-400">{ui.numberFormatAndCoverSkipping}</span>}
          </label>
          <div className="rounded-lg border border-slate-200 px-3 py-2.5">
            <label className={`flex items-center gap-2 text-xs font-medium ${settings.numberPosition === 'none' ? 'text-slate-400' : 'text-slate-600'}`}>
              <input type="checkbox" checked={settings.skipFirstPage} disabled={settings.numberPosition === 'none'} onChange={(event) => updateSettings('skipFirstPage', event.target.checked)} className="accent-indigo-600" />
              Don’t print a number on the first output page
            </label>
            <p className="mt-1 pl-5 text-[10px] leading-relaxed text-slate-400">{ui.useForACoverPage}</p>
          </div>
          <label className="block text-[10px] font-semibold text-slate-600">
            Document safe margins
            <select value={settings.marginMm} onChange={(event) => updateSettings('marginMm', Number(event.target.value) as StudioSettings['marginMm'])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
              <option value={0}>0 mm</option><option value={10}>10 mm</option><option value={20}>20 mm</option>
            </select>
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            Watermark text
            <input value={settings.watermarkText} onChange={(event) => updateSettings('watermarkText', event.target.value)} maxLength={60} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder={ui.confidential} />
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            Watermark opacity · {settings.watermarkOpacity}%
            <input type="range" min="10" max="80" step="5" value={settings.watermarkOpacity} onChange={(event) => updateSettings('watermarkOpacity', Number(event.target.value))} className="mt-2 w-full accent-indigo-600" />
          </label>
          <label className="block text-[10px] font-semibold text-slate-600">
            Watermark angle · {settings.watermarkAngle}°
            <input type="range" min="-60" max="60" step="5" value={settings.watermarkAngle} onChange={(event) => updateSettings('watermarkAngle', Number(event.target.value))} className="mt-2 w-full accent-indigo-600" />
          </label>
          <label className="block text-[10px] font-semibold text-slate-600 sm:col-span-2 xl:col-span-1">
            Raster image compression
            <select value={settings.compression} onChange={(event) => updateSettings('compression', event.target.value as StudioSettings['compression'])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
              <option value="quality">{ui.maximumQuality}</option>
              <option value="balanced">{ui.balancedWebEmail}</option>
              <option value="target-2mb">{ui.targetSizeUnder2Mb}</option>
              <option value="target-500kb">{ui.targetSizeUnder500Kb}</option>
            </select>
            <span className="mt-1 block font-normal text-slate-400">{ui.onlyRasterInputsAreRecompressed}</span>
          </label>
          {!digitize && <div className="space-y-2 rounded-xl border border-slate-200 p-3 sm:col-span-2 xl:col-span-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={settings.protectOutput} onChange={(event) => updateSettings('protectOutput', event.target.checked)} className="accent-indigo-600" />
              Password-protect the final PDF
            </label>
            {settings.protectOutput && (
              <>
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">{ui.passwordProtectionTurnsEveryPage}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-[10px] font-semibold text-slate-600">
                    User / open password
                    <input type="password" autoComplete="new-password" value={settings.outputUserPassword} onChange={(event) => updateSettings('outputUserPassword', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                    <span className="mt-1 block font-normal text-slate-400">{ui.requiredToOpenThePdf}</span>
                  </label>
                  <label className="text-[10px] font-semibold text-slate-600">
                    Owner password
                    <input type="password" autoComplete="new-password" value={settings.outputOwnerPassword} onChange={(event) => updateSettings('outputOwnerPassword', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                    <span className="mt-1 block font-normal text-slate-400">{ui.controlsRestrictionsBelowIfOmitted}</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] font-medium text-slate-600">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={settings.allowOutputPrinting} onChange={(event) => updateSettings('allowOutputPrinting', event.target.checked)} className="accent-indigo-600" />{ui.allowPrinting}</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={settings.allowOutputCopying} onChange={(event) => updateSettings('allowOutputCopying', event.target.checked)} className="accent-indigo-600" />{ui.allowCopyingText}</label>
                </div>
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800">{ui.passwordProtectionReEncodesPages}</p>
              </>
            )}
          </div>}
        </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        {digitize ? <><label className="text-xs font-semibold text-slate-700">{t('digitize.language')} <select value={ocrLanguage} onChange={(event) => { setOcrLanguage(event.target.value as 'eng' | 'hin+eng'); setDownloadUrl(''); }} className="ml-2 rounded-lg border border-slate-200 p-2"><option value="eng">{t('digitize.languageEnglish')}</option><option value="hin+eng">{t('digitize.languageHindi')}</option></select></label><label className="text-xs font-semibold text-slate-700">{t('digitize.output')} <select value={separate ? 'separate' : 'merged'} onChange={(event) => { setSeparate(event.target.value === 'separate'); setDownloadUrl(''); }} className="ml-2 rounded-lg border border-slate-200 p-2"><option value="merged">{t('digitize.merged')}</option><option value="separate">{t('digitize.separate')}</option></select></label></> : <p className="max-w-xl text-[10px] text-slate-500">{ui.createTheFinishedPdfFrom}</p>}
        <div className="flex flex-wrap gap-2">
          {downloadUrl && <a href={downloadUrl} download={downloadName} className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-800 hover:bg-orange-100"><Download className="h-4 w-4" />{ui.downloadAgain}</a>}
          {downloadUrl && <ShareFileButton className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-4 py-2.5 text-xs font-bold text-orange-800 hover:bg-orange-50" getFile={async () => toFile(await (await fetch(downloadUrl)).blob(), downloadName)} />}
          <button type="button" onClick={() => void handleExport()} disabled={isExporting || outputItems.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {digitize ? (isExporting ? t('digitize.preparing') : t('digitize.create')) : (isExporting ? 'Creating PDF...' : 'Create & download final PDF')}
          </button>
        </div>
      </div>
    </div>
  );
};
