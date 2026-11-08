import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FilePlus2,
  LoaderCircle,
  LockKeyhole,
  Move,
  Pin,
  Plus,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  createCustomPage,
  createSource,
  DEFAULT_STUDIO_SETTINGS,
  exportMasterPdf,
} from '../../lib/documentStudio/studio';
import type {
  GeneratedPageOptions,
  OutputSequenceItem,
  PageCard,
  SourceItem,
  StudioSettings,
} from '../../lib/documentStudio/types';
import { renderOutputPageImage } from '../../lib/documentStudio/studio';
import { protectPdf } from '../../lib/pdf/protect';
import { ContentsEntryModal, CustomPageModal, PageEditorModal, ProtectedPdfPasswordModal, SourcePagePreviewModal } from './documentStudio/StudioModals';
import { SamplePdfModal } from './documentStudio/SamplePdfModal';
import { FileDropZone } from '../common/FileDropZone';
import { useTranslation } from 'react-i18next';

function createDefaultStudioSettings(): StudioSettings {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
  return {
    ...DEFAULT_STUDIO_SETTINGS,
    outputFileName: `master-document-${timestamp}-${crypto.randomUUID().slice(0, 6)}`,
  };
}

function pdfFileName(value: string): string {
  const safeBase = value.trim()
    .replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .split('')
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return `${safeBase || 'master-document'}.pdf`;
}

function arrayBufferFromBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function parsePageRange(value: string, pageCount: number): { pageNumbers?: number[]; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: 'Enter a page range, such as 1-3, 5.' };
  if (!/^\d+(?:\s*-\s*\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*$/.test(trimmed)) {
    return { error: 'Use page numbers and ranges separated by commas, such as 1-3, 5.' };
  }

  const pageNumbers = new Set<number>();
  for (const part of trimmed.split(',')) {
    const [startText, endText] = part.trim().split(/\s*-\s*/);
    const start = Number(startText);
    const end = endText === undefined ? start : Number(endText);
    if (start < 1 || end < start || end > pageCount) {
      return { error: `Page ranges must be between 1 and ${pageCount}, with the first number no greater than the last.` };
    }
    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) pageNumbers.add(pageNumber);
  }
  return { pageNumbers: [...pageNumbers] };
}

const PAGE_STANDARD_LABELS = {
  a4: 'Force uniform A4',
  letter: 'Force uniform US Letter',
  preserve: 'Preserve mixed sizes',
} as const;

function newOutputItem(page: PageCard): OutputSequenceItem {
  return {
    id: crypto.randomUUID(),
    page,
    rotation: 0,
    crop: { top: 0, right: 0, bottom: 0, left: 0 },
    fitMode: 'letterbox',
    redactions: [],
  };
}

function sourceTypeLabel(kind: SourceItem['kind']): string {
  return kind === 'pdf' ? 'PDF' : kind === 'docx' ? 'DOCX' : kind === 'custom' ? 'CUSTOM' : 'IMAGE';
}

export const MasterDocumentStudio: React.FC<{ digitize?: boolean; onHasSourcesChange?: (hasSources: boolean) => void }> = ({ digitize = false, onHasSourcesChange }) => {
  const { t, i18n } = useTranslation();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [pages, setPages] = useState<PageCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [outputItems, setOutputItems] = useState<OutputSequenceItem[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(() => {
    const defaults = createDefaultStudioSettings();
    return digitize ? { ...defaults, outputFileName: defaults.outputFileName.replace('master-document', 'digitized-documents') } : defaults;
  });
  const [stage, setStage] = useState<'selection' | 'studio'>('selection');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCustomPage, setShowCustomPage] = useState(false);
  const [showSamplePdf, setShowSamplePdf] = useState(false);
  const [pageEditorItemId, setPageEditorItemId] = useState<string | null>(null);
  const [contentsEntryItemId, setContentsEntryItemId] = useState<string | null>(null);
  const [sourcePreviewPageId, setSourcePreviewPageId] = useState<string | null>(null);
  const [protectedPdfFile, setProtectedPdfFile] = useState<File | null>(null);
  const [remainingUploadFiles, setRemainingUploadFiles] = useState<File[]>([]);
  const [protectedPdfError, setProtectedPdfError] = useState('');
  const [isUnlockingPdf, setIsUnlockingPdf] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetItemId, setDropTargetItemId] = useState<string | null>(null);
  const [pageRanges, setPageRanges] = useState<Record<string, string>>({});
  const [pageRangeErrors, setPageRangeErrors] = useState<Record<string, string>>({});
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [separate, setSeparate] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const cancelOcr = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onHasSourcesChange?.(sources.length > 0);
  }, [onHasSourcesChange, sources.length]);
  useEffect(() => () => cancelOcr.current?.abort(), []);
  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const pageMap = useMemo(() => new Map(pages.map((page) => [page.id, page])), [pages]);
  const pageEditorItem = outputItems.find((item) => item.id === pageEditorItemId) ?? null;
  const contentsEntryItem = outputItems.find((item) => item.id === contentsEntryItemId) ?? null;
  const pageEditorSource = pageEditorItem ? sourceMap.get(pageEditorItem.page.sourceId) : undefined;
  const sourcePreviewPage = pages.find((page) => page.id === sourcePreviewPageId) ?? null;
  const sourcePreviewSource = sourcePreviewPage ? sourceMap.get(sourcePreviewPage.sourceId) : undefined;
  const targetDescription = settings.compression === 'target-2mb'
    ? '2 MB'
    : settings.compression === 'target-500kb'
      ? '500 KB'
      : '';

  const updateSettings = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setDownloadUrl('');
  };

  const addFiles = async (files: FileList | File[]) => {
    const accepted = Array.from(files);
    if (accepted.length === 0) return;
    setDownloadUrl('');
    setIsLoading(true);
    setError('');
    setNotice('');
    try {
      for (const [fileIndex, file] of accepted.entries()) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!(digitize ? ['png', 'jpg', 'jpeg', 'webp'] : ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp']).includes(extension ?? '') || (digitize && file.type !== '' && !file.type.startsWith('image/'))) {
          setError(digitize ? t('digitize.invalidFile', { name: file.name }) : `${file.name}: choose a PDF, DOCX, PNG, JPG, JPEG, or WEBP file.`);
          continue;
        }
        try {
          const result = await createSource(file);
          setSources((current) => [...current, result.source]);
          setPages((current) => [...current, ...result.pages]);
        } catch (reason) {
          const message = reason instanceof Error ? reason.message : '';
          if (message === 'PDF_PASSWORD_REQUIRED' || message === 'PDF_PASSWORD_INVALID') {
            setProtectedPdfFile(file);
            setRemainingUploadFiles(accepted.slice(fileIndex + 1));
            setProtectedPdfError(message === 'PDF_PASSWORD_INVALID' ? 'The password was not accepted. Try the PDF open/user password or owner password.' : '');
            break;
          }
          setError(`${file.name}: ${reason instanceof Error ? reason.message : 'Could not read this file.'}`);
        }
      }
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProtectedPdfPassword = async (password: string) => {
    if (!protectedPdfFile) return;
    setIsUnlockingPdf(true);
    setProtectedPdfError('');
    try {
      const result = await createSource(protectedPdfFile, password);
      setSources((current) => [...current, result.source]);
      setPages((current) => [...current, ...result.pages]);
      setProtectedPdfFile(null);
      setNotice(`Password-protected PDF "${protectedPdfFile.name}" was opened locally and added.`);
      const remaining = remainingUploadFiles;
      setRemainingUploadFiles([]);
      if (remaining.length > 0) void addFiles(remaining);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      setProtectedPdfError(message === 'PDF_PASSWORD_INVALID'
        ? 'The password was not accepted. Try the PDF open/user password or owner password.'
        : message === 'PDF_PASSWORD_REQUIRED'
          ? 'This PDF requires a password to open.'
          : reason instanceof Error ? reason.message : 'Could not open this protected PDF.');
    } finally {
      setIsUnlockingPdf(false);
    }
  };

  const cancelProtectedPdf = () => {
    const remaining = remainingUploadFiles;
    setProtectedPdfFile(null);
    setRemainingUploadFiles([]);
    setProtectedPdfError('');
    if (remaining.length > 0) void addFiles(remaining);
  };

  const addGeneratedSample = async (file: File) => {
    setError('');
    setNotice('');
    try {
      const result = await createSource(file);
      setSources((current) => [...current, result.source]);
      setPages((current) => [...current, ...result.pages]);
      setShowSamplePdf(false);
      setNotice('Sample PDF generated locally and added to the input deck.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not add the generated sample PDF.';
      setError(message);
      throw new Error(message);
    }
  };

  const togglePage = (pageId: string) => {
    setDownloadUrl('');
    setSelectedIds((current) => current.includes(pageId)
      ? current.filter((id) => id !== pageId)
      : [...current, pageId]);
    setNotice('');
  };

  const toggleSourcePages = (sourceId: string, shouldSelect: boolean) => {
    setDownloadUrl('');
    const sourcePageIds = pages.filter((page) => page.sourceId === sourceId).map((page) => page.id);
    setSelectedIds((current) => {
      const withoutSourcePages = current.filter((id) => !sourcePageIds.includes(id));
      if (!shouldSelect) return withoutSourcePages;
      return [...withoutSourcePages, ...sourcePageIds];
    });
    setNotice('');
  };

  const applyPageRange = (sourceId: string) => {
    setDownloadUrl('');
    const sourcePages = pages.filter((page) => page.sourceId === sourceId);
    const result = parsePageRange(pageRanges[sourceId] ?? '', sourcePages.length);
    if (!result.pageNumbers) {
      setPageRangeErrors((current) => ({ ...current, [sourceId]: result.error ?? 'Invalid page range.' }));
      return;
    }
    const selectedPageIds = result.pageNumbers
      .map((pageNumber) => sourcePages.find((page) => page.originalPageNumber === pageNumber)?.id)
      .filter((id): id is string => Boolean(id));
    const sourcePageIds = new Set(sourcePages.map((page) => page.id));
    setSelectedIds((current) => [
      ...current.filter((id) => !sourcePageIds.has(id)),
      ...selectedPageIds,
    ]);
    setPageRangeErrors((current) => ({ ...current, [sourceId]: '' }));
    setNotice('');
  };

  const proceedToStudio = () => {
    const selectedPages = selectedIds.map((id) => pageMap.get(id)).filter((page): page is PageCard => Boolean(page));
    if (selectedPages.length === 0) return;
    setOutputItems(selectedPages.map(newOutputItem));
    setDownloadUrl('');
    setStage('studio');
    setError('');
  };

  const updateItems = (ids: string[], update: (item: OutputSequenceItem) => OutputSequenceItem) => {
    setOutputItems((current) => current.map((item) => ids.includes(item.id) ? update(item) : item));
    setDownloadUrl('');
    setNotice('');
  };

  const removeSource = (sourceId: string) => {
    setDownloadUrl('');
    const pageIds = pages.filter((page) => page.sourceId === sourceId).map((page) => page.id);
    setSources((current) => current.filter((source) => source.id !== sourceId));
    setPages((current) => current.filter((page) => page.sourceId !== sourceId));
    setSelectedIds((current) => current.filter((id) => !pageIds.includes(id)));
    setOutputItems((current) => current.filter((item) => item.page.sourceId !== sourceId));
  };

  const addCustomPage = (options: GeneratedPageOptions) => {
    try {
      const result = createCustomPage(options);
      setSources((current) => [...current, result.source]);
      setPages((current) => [...current, result.page]);
      setShowCustomPage(false);
      setNotice('Custom page added to the input deck.');
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create the page.');
    }
  };

  const changeOrder = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= outputItems.length || fromIndex === toIndex || toIndex < 0 || toIndex >= outputItems.length) return;
    const movedItem = outputItems[fromIndex];
    setOutputItems((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
    setDownloadUrl('');
    setNotice(`${movedItem?.page.sourceName ?? 'Page'} moved to output position ${toIndex + 1}.`);
  };

  const removeOutputItem = (itemId: string) => {
    setOutputItems((current) => current.filter((item) => item.id !== itemId));
    setDownloadUrl('');
  };

  const duplicateOutputItem = (itemId: string) => {
    setOutputItems((current) => {
      const index = current.findIndex((item) => item.id === itemId);
      if (index < 0) return current;
      const copy = { ...current[index], id: crypto.randomUUID(), redactions: [...current[index].redactions] };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });
    setDownloadUrl('');
    setPageEditorItemId(null);
    setNotice('Page duplicated in the output sequence.');
  };

  const handleExport = async () => {
    if (settings.protectOutput && !settings.outputUserPassword && !settings.outputOwnerPassword) {
      setError('Enter a user/open password, an owner password, or both to protect the output PDF.');
      return;
    }
    setIsExporting(true);
    setError('');
    setNotice('');
    setDownloadUrl('');
    const controller = new AbortController();
    cancelOcr.current = controller;
    try {
      if (digitize) {
        const { makeSearchable } = await import('../../lib/documentStudio/searchable');
        const groups = separate
          ? [...new Set(outputItems.map((item) => item.page.sourceId))]
            .map((id) => outputItems.filter((item) => item.page.sourceId === id))
          : [outputItems];
        const zip = separate ? new (await import('jszip')).default() : null;
        let output: Uint8Array = new Uint8Array();
        let exceededTarget = false;
        for (const [index, group] of groups.entries()) {
          controller.signal.throwIfAborted();
          const result = await exportMasterPdf(group, sourceMap, settings);
          const searchable = await makeSearchable(result.bytes, (page, total) => {
            setOcrProgress(t('digitize.progress', { document: index + 1, documents: groups.length, page, total }));
          }, controller.signal);
          if (result.targetBytes !== null && searchable.byteLength > result.targetBytes) exceededTarget = true;
          if (zip) zip.file(`${index + 1}-${pdfFileName(group[0].page.sourceName.replace(/\.[^.]+$/, ''))}`, searchable);
          else output = searchable;
        }
        controller.signal.throwIfAborted();
        const filename = separate ? pdfFileName(settings.outputFileName).replace(/\.pdf$/, '.zip') : pdfFileName(settings.outputFileName);
        const blob = zip ? await zip.generateAsync({ type: 'blob' }) : new Blob([arrayBufferFromBytes(output)], { type: 'application/pdf' });
        controller.signal.throwIfAborted();
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadName(filename);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setNotice(`${t('digitize.finished', { name: filename })}${exceededTarget ? ` ${t('digitize.targetExceeded')}` : ''}`);
        return;
      }
      const result = await exportMasterPdf(outputItems, sourceMap, settings);
      const bytes = settings.protectOutput
        ? await protectPdf({
          fileBuffer: arrayBufferFromBytes(result.bytes),
          userPassword: settings.outputUserPassword,
          ownerPassword: settings.outputOwnerPassword,
          metadata: {
            title: settings.documentTitle || 'Master Document',
            author: settings.documentAuthor,
            subject: settings.documentSubject,
            keywords: settings.documentKeywords,
          },
          permissions: {
            printing: settings.allowOutputPrinting,
            copying: settings.allowOutputCopying,
          },
        })
        : result.bytes;
      const filename = pdfFileName(settings.outputFileName);
      const blob = new Blob([arrayBufferFromBytes(bytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(filename);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.click();
      const size = (bytes.byteLength / (1024 * 1024)).toFixed(2);
      const targetMet = result.targetBytes === null || bytes.byteLength <= result.targetBytes;
      setNotice(result.targetBytes === null
        ? `${filename} downloaded${settings.protectOutput ? ' with password protection' : ''} (${size} MB).`
        : targetMet
          ? `${filename} downloaded${settings.protectOutput ? ' with password protection' : ''} (${size} MB), within the ${targetDescription} size goal.`
          : `${filename} downloaded${settings.protectOutput ? ' with password protection' : ''} (${size} MB), above the ${targetDescription} size goal. Size goals are estimates, not guarantees.`);
    } catch (reason) {
      setError(controller.signal.aborted
        ? t('digitize.cancelled')
        : reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'The PDF could not be exported.');
    } finally {
      cancelOcr.current = null;
      setOcrProgress('');
      setIsExporting(false);
    }
  };

  const handleExportPage = async (item: OutputSequenceItem) => {
    const source = sourceMap.get(item.page.sourceId);
    if (!source) throw new Error('The source document for this page is no longer available.');
    const result = await exportMasterPdf([item], new Map([[source.id, source]]), {
      ...DEFAULT_STUDIO_SETTINGS,
      documentTitle: `${source.fileName} - page ${item.page.originalPageNumber}`,
      pageStandard: 'preserve',
      numberPosition: 'none',
    });
    const bytes = digitize
      ? await (await import('../../lib/documentStudio/searchable')).makeSearchable(result.bytes, () => {}, new AbortController().signal)
      : result.bytes;
    const blob = new Blob([arrayBufferFromBytes(bytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const pageIndex = outputItems.findIndex((outputItem) => outputItem.id === item.id);
    const filename = `outputPdfPag${Math.max(1, pageIndex + 1)}.pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`${filename} downloaded.`);
  };

  const handleExportPageImage = async (
    item: OutputSequenceItem,
    format: 'png' | 'jpeg' | 'webp',
  ) => {
    const source = sourceMap.get(item.page.sourceId);
    if (!source) throw new Error('The source document for this page is no longer available.');
    const blob = await renderOutputPageImage(source, item, format);
    const url = URL.createObjectURL(blob);
    const pageIndex = outputItems.findIndex((outputItem) => outputItem.id === item.id);
    const extension = format === 'jpeg' ? 'jpg' : format;
    const filename = `outputPdfPag${Math.max(1, pageIndex + 1)}.${extension}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`${filename} downloaded.`);
  };
  const inputDeck = (
    <div className="min-w-0 space-y-4">
      <div className={`mx-auto w-full rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 ${sources.length > 0 ? '' : 'max-w-3xl'}`}>
        <FileDropZone
          accept={digitize ? '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp' : '.pdf,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp'}
          multiple
          disabled={isLoading}
          label={isLoading ? t('master.reading') : digitize ? t('digitize.choose') : t('master.choose')}
          hint={digitize ? t('digitize.hint') : t('master.hint')}
          labelLanguage={i18n.language}
          onFiles={(files) => { void addFiles(files); }}
        />
        {!digitize && <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setShowCustomPage(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-orange-200 hover:bg-orange-50">
            <FilePlus2 className="h-4 w-4" /> <span lang={i18n.language}>{t('master.custom')}</span>
          </button>
          <button type="button" onClick={() => setShowSamplePdf(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-orange-200 hover:bg-orange-50">
            <Sparkles className="h-4 w-4" /> <span lang={i18n.language}>{t('master.sample')}</span>
          </button>
        </div>}
      </div>

      {sources.length > 0 ? (
        <div className="space-y-5">
          {sources.map((source, sourceIndex) => {
            const sourcePages = pages.filter((page) => page.sourceId === source.id);
            return (
              <section key={source.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                <div className="mb-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Document {sourceIndex + 1}</span>
                    <div className="h-px flex-1 bg-indigo-200" />
                    <div className="min-w-0 text-right">
                      <p className="truncate text-xs font-bold text-slate-700" title={source.fileName}>{source.fileName}</p>
                      <p className="text-[10px] text-slate-400">{sourceTypeLabel(source.kind)} · {sourcePages.length} page{sourcePages.length === 1 ? '' : 's'}{source.isEncrypted ? ' · password-protected' : ''}</p>
                    </div>
                  </div>
                  {sourcePages.length > 0 && (
                    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-2.5">
                      <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={sourcePages.every((page) => selectedIds.includes(page.id))}
                          onChange={(event) => toggleSourcePages(source.id, event.target.checked)}
                          className="accent-indigo-600"
                          aria-label={`Select all pages from ${source.fileName}`}
                        />
                        Select all
                      </label>
                      <label className="min-w-[150px] flex-1 text-[10px] font-semibold text-slate-600">
                        Page range
                        <input
                          value={pageRanges[source.id] ?? ''}
                          onChange={(event) => {
                            setPageRanges((current) => ({ ...current, [source.id]: event.target.value }));
                            setPageRangeErrors((current) => ({ ...current, [source.id]: '' }));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              applyPageRange(source.id);
                            }
                          }}
                          placeholder="e.g. 1-3, 5"
                          aria-label={`Page range for ${source.fileName}`}
                          aria-invalid={Boolean(pageRangeErrors[source.id])}
                          className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-normal"
                        />
                      </label>
                      <button type="button" onClick={() => applyPageRange(source.id)} className="h-9 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Apply range</button>
                      {pageRangeErrors[source.id] && <p role="alert" className="w-full text-[10px] text-red-600">{pageRangeErrors[source.id]}</p>}
                    </div>
                  )}
                </div>
                {sourcePages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                    {sourcePages.map((page) => {
                      const sequenceNumber = selectedIds.indexOf(page.id) + 1;
                      const isSelected = sequenceNumber > 0;
                      return (
                        <article key={page.id} className={`group relative flex min-w-0 flex-col rounded-xl border p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => togglePage(page.id)} className="absolute left-3 top-3 z-10 h-5 w-5 accent-indigo-600" aria-label={`Add ${page.sourceName} page ${page.originalPageNumber} to output`} />
                          <div className="mb-2 flex h-48 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                            <img src={page.thumbnailUrl} alt={`${page.sourceName} page ${page.originalPageNumber}`} loading="lazy" className="max-h-full max-w-full object-contain shadow-sm" />
                          </div>
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="truncate text-[10px] font-semibold text-slate-700">{page.sourceName}</span>
                            <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[9px] text-slate-500">Page {page.originalPageNumber}</span>
                          </div>
                          {isSelected && <span className="mt-2 inline-flex items-center gap-1 self-start rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white"><Check className="h-3 w-3" />Page {sequenceNumber} in Output</span>}
                          <button type="button" onClick={() => setSourcePreviewPageId(page.id)} className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"><ZoomIn className="h-3.5 w-3.5" />Zoom preview</button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">This document could not be separated into pages.</p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">Your uploaded pages will appear here in source order.</div>
      )}
    </div>
  );

  const sourceRail = (
    <aside className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Source overview</h2>
        <p className="mt-1 text-xs text-slate-500">{sources.length} source{sources.length === 1 ? '' : 's'} · {outputItems.length} output pages</p>
      </div>
      <div className="space-y-2">
        {sources.map((source) => {
          const sourcePages = pages.filter((page) => page.sourceId === source.id);
          return (
            <div key={source.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
              <div className="h-11 w-9 shrink-0 overflow-hidden rounded bg-white">
                {sourcePages[0] && <img src={sourcePages[0].thumbnailUrl} alt="" className="h-full w-full object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-slate-700" title={source.fileName}>{source.fileName}</p>
                <p className="text-[10px] text-slate-400">{sourceTypeLabel(source.kind)} · {sourcePages.length} page{sourcePages.length === 1 ? '' : 's'}</p>
              </div>
              <button type="button" onClick={() => removeSource(source.id)} title={`Remove ${source.fileName}`} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
      </div>
      <div className="grid gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Plus className="h-4 w-4" />Add more files</button>
        <button type="button" onClick={() => setStage('selection')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back to selection</button>
      </div>
    </aside>
  );

  return (
    <div className="mx-auto w-full min-w-0 space-y-4">
      <input ref={fileInputRef} type="file" multiple accept={digitize ? '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp' : '.pdf,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp'} onChange={(event) => { if (event.target.files) void addFiles(event.target.files); }} className="hidden" />
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><X className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">{notice}</div>}

      {digitize && isExporting && <div role="status" className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">{ocrProgress || t('digitize.preparing')} <button type="button" onClick={() => cancelOcr.current?.abort()} className="ml-3 font-bold underline">{t('digitize.cancel')}</button></div>}
      <fieldset disabled={digitize && isExporting} className={`min-w-0 ${digitize && isExporting ? 'pointer-events-none opacity-60' : ''}`}>
      {stage === 'selection' ? (
        <div className="space-y-4">
          {sources.length > 0 && <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
              <h2 lang={i18n.language} className="text-lg font-bold text-slate-900">{t('master.choosePages')}</h2>
            </div>
            <p lang={i18n.language} className="pl-8 text-xs text-slate-500">{t('master.choosePagesHint')}</p>
          </div>}
          <div className={sources.length > 0 ? 'grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]' : 'mx-auto max-w-3xl'}>
            <section className="min-w-0">
              {inputDeck}
            </section>
            {sources.length > 0 && <aside className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 lang={i18n.language} className="text-sm font-bold text-slate-900">{t('master.selected')}</h2>
                  <p lang={i18n.language} className="mt-1 text-xs text-slate-500">{t('master.queued', { count: selectedIds.length })}</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">{selectedIds.length}</span>
              </div>
              <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {selectedIds.map((id, index) => {
                  const page = pageMap.get(id);
                  if (!page) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{index + 1}</span>
                      <img src={page.thumbnailUrl} alt="" className="h-12 w-9 rounded bg-white object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold text-slate-700">{page.sourceName}</p>
                        <p className="text-[9px] text-slate-400">Original page {page.originalPageNumber}</p>
                      </div>
                      <button type="button" aria-label={`Remove output page ${index + 1}`} onClick={() => togglePage(id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  );
                })}
                {selectedIds.length === 0 && <div lang={i18n.language} className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400">{t('master.empty')}</div>}
              </div>
              {selectedIds.length > 0 && <button type="button" onClick={proceedToStudio} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
                <span lang={i18n.language}>{t('master.continue')}</span> <ArrowRight className="h-4 w-4" />
              </button>}
            </aside>}
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(230px,260px)_minmax(0,1fr)]">
          {sourceRail}
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
                  <h2 lang={i18n.language} className="text-lg font-bold text-slate-900">{t('master.editor')}</h2>
                </div>
                <p className="pl-8 text-xs text-slate-500">Drag pages to reorder. Pin any page to give it a title in your linked contents.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{outputItems.length} page{outputItems.length === 1 ? '' : 's'} in sequence · {outputItems.filter((item) => item.contentsTitle?.trim()).length} contents entr{outputItems.filter((item) => item.contentsTitle?.trim()).length === 1 ? 'y' : 'ies'}</div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-950">
              <Pin className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-amber-600" />
              <p><span className="font-bold">Create a linked table of contents:</span> Click the pin on each page you want listed, enter its heading, and export. We’ll add a contents page at the beginning with links to those pages. Pages without a heading won’t appear.</p>
            </div>

            {outputItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {outputItems.map((item, index) => {
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', String(index));
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggedItemId(item.id);
                        setDropTargetItemId(null);
                      }}
                      onDragEnter={() => {
                        if (draggedItemId && draggedItemId !== item.id) setDropTargetItemId(item.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        if (draggedItemId !== item.id) setDropTargetItemId(item.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const from = Number(event.dataTransfer.getData('text/plain'));
                        if (Number.isInteger(from)) changeOrder(from, index);
                        setDraggedItemId(null);
                        setDropTargetItemId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDropTargetItemId(null);
                      }}
                      className={`group relative min-w-0 rounded-xl border bg-white p-2.5 shadow-sm transition-all duration-200 ${draggedItemId === item.id ? 'scale-[0.98] border-dashed border-slate-300 opacity-45' : dropTargetItemId === item.id ? 'translate-y-[-3px] border-2 border-indigo-500 bg-indigo-50/60 shadow-lg ring-4 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
                    >
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white">outputPdfPag{index + 1}</span>
                      <div className="mb-2 flex h-56 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-2">
                        <img src={item.page.thumbnailUrl} alt={`${item.page.sourceName}, page ${item.page.originalPageNumber}`} className="max-h-full max-w-full object-contain shadow" />
                      </div>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-semibold text-slate-700" title={item.page.sourceName}>{item.page.sourceName}</span>
                        <span className="shrink-0 text-[9px] text-slate-400">p. {item.page.originalPageNumber}</span>
                      </div>
                      {item.contentsTitle && (
                        <div className="mt-2 truncate rounded-md bg-amber-50 px-2 py-1 text-[9px] font-medium text-amber-800" title={item.contentsTitle}>
                          <Pin className="mr-1 inline h-3 w-3 fill-current" />{item.contentsTitle}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-2">
                        <span className="inline-flex items-center gap-1 text-[9px] text-slate-400"><Move className="h-3 w-3" />Drag to reorder</span>
                        <div className="flex items-center gap-1">
                          <button type="button" aria-label={`${item.contentsTitle ? 'Edit' : 'Add'} table of contents entry for outputPdfPag${index + 1}`} aria-pressed={Boolean(item.contentsTitle)} onClick={() => setContentsEntryItemId(item.id)} className={`rounded-lg p-1.5 ${item.contentsTitle ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'}`} title={item.contentsTitle ? 'Edit contents entry' : 'Add to table of contents'}><Pin className={`h-4 w-4 ${item.contentsTitle ? 'fill-current' : ''}`} /></button>
                          <button type="button" onClick={() => setPageEditorItemId(item.id)} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100">Zoom &amp; edit</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No output pages remain. Return to selection to add pages.</div>
            )}

            <div className="space-y-4 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">PDF properties &amp; document-wide output options</h2>
                  <p className="text-[10px] text-slate-500">These settings apply when the finished PDF is created.</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700"><LockKeyhole className="h-3 w-3" />Local processing</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <label className="block text-[10px] font-semibold text-slate-600 sm:col-span-2 xl:col-span-3">
                    Download filename
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200 px-2.5 text-xs focus-within:border-indigo-400">
                      <input value={settings.outputFileName} onChange={(event) => updateSettings('outputFileName', event.target.value)} maxLength={120} className="min-w-0 flex-1 py-2 outline-none" placeholder="master-document" />
                      <span className="text-slate-400">.pdf</span>
                    </div>
                    <span className="mt-1 block font-normal text-slate-400">Filename only; separate from PDF properties below.</span>
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-600">
                    PDF title property
                    <input value={settings.documentTitle} onChange={(event) => updateSettings('documentTitle', event.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder="Master Document" />
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-600">
                    PDF author property
                    <input value={settings.documentAuthor} onChange={(event) => updateSettings('documentAuthor', event.target.value)} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder="Author name" />
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-600">
                    PDF subject property
                    <input value={settings.documentSubject} onChange={(event) => updateSettings('documentSubject', event.target.value)} maxLength={160} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder="Document subject" />
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-600">
                    PDF keywords property
                    <input value={settings.documentKeywords} onChange={(event) => updateSettings('documentKeywords', event.target.value)} maxLength={240} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder="Comma-separated keywords" />
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
                      <option value="none">None</option>
                      <option value="bottom-center">Bottom-center</option>
                      <option value="bottom-right">Bottom-right</option>
                      <option value="top-right">Top-right</option>
                    </select>
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-600">
                    Number format
                    <input value={settings.numberFormat} onChange={(event) => updateSettings('numberFormat', event.target.value)} disabled={settings.numberPosition === 'none'} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs disabled:bg-slate-100 disabled:text-slate-400" placeholder="Page {page} of {total}" />
                    {settings.numberPosition === 'none' && <span className="mt-1 block font-normal text-slate-400">Number format and cover skipping are ignored while numbering is off.</span>}
                  </label>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <label className={`flex items-center gap-2 text-xs font-medium ${settings.numberPosition === 'none' ? 'text-slate-400' : 'text-slate-600'}`}>
                      <input type="checkbox" checked={settings.skipFirstPage} disabled={settings.numberPosition === 'none'} onChange={(event) => updateSettings('skipFirstPage', event.target.checked)} className="accent-indigo-600" />
                      Don’t print a number on the first output page
                    </label>
                    <p className="mt-1 pl-5 text-[10px] leading-relaxed text-slate-400">Use for a cover page: it hides only that page’s footer/header number. Later pages keep their actual output page numbers (for example, page 2 remains “Page 2 of 5”).</p>
                  </div>
                  <label className="block text-[10px] font-semibold text-slate-600">
                    Document safe margins
                    <select value={settings.marginMm} onChange={(event) => updateSettings('marginMm', Number(event.target.value) as StudioSettings['marginMm'])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
                      <option value={0}>0 mm</option><option value={10}>10 mm</option><option value={20}>20 mm</option>
                    </select>
                  </label>
                  <label className="block text-[10px] font-semibold text-slate-600">
                    Watermark text
                    <input value={settings.watermarkText} onChange={(event) => updateSettings('watermarkText', event.target.value)} maxLength={60} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" placeholder="CONFIDENTIAL" />
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
                      <option value="quality">Maximum quality</option>
                      <option value="balanced">Balanced (Web / Email)</option>
                      <option value="target-2mb">Target size · under 2 MB</option>
                      <option value="target-500kb">Target size · under 500 KB</option>
                    </select>
                    <span className="mt-1 block font-normal text-slate-400">Only raster inputs are recompressed. Original PDF pages remain vector-based; a size goal cannot be guaranteed.</span>
                  </label>
                  {!digitize && <div className="space-y-2 rounded-xl border border-slate-200 p-3 sm:col-span-2 xl:col-span-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input type="checkbox" checked={settings.protectOutput} onChange={(event) => updateSettings('protectOutput', event.target.checked)} className="accent-indigo-600" />
                      Password-protect the final PDF
                    </label>
                    {settings.protectOutput && (
                      <>
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">Password protection turns every page into an image: text in the final PDF can no longer be selected or searched, and links (including the contents page) stop working.</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-[10px] font-semibold text-slate-600">
                            User / open password
                            <input type="password" autoComplete="new-password" value={settings.outputUserPassword} onChange={(event) => updateSettings('outputUserPassword', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                            <span className="mt-1 block font-normal text-slate-400">Required to open the PDF.</span>
                          </label>
                          <label className="text-[10px] font-semibold text-slate-600">
                            Owner password
                            <input type="password" autoComplete="new-password" value={settings.outputOwnerPassword} onChange={(event) => updateSettings('outputOwnerPassword', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                            <span className="mt-1 block font-normal text-slate-400">Controls restrictions below. If omitted, the open password is also used as owner password.</span>
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] font-medium text-slate-600">
                          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.allowOutputPrinting} onChange={(event) => updateSettings('allowOutputPrinting', event.target.checked)} className="accent-indigo-600" />Allow printing</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.allowOutputCopying} onChange={(event) => updateSettings('allowOutputCopying', event.target.checked)} className="accent-indigo-600" />Allow copying text</label>
                        </div>
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800">Password protection re-encodes pages as images. Text will no longer be searchable/selectable, and clickable contents links are removed.</p>
                      </>
                    )}
                  </div>}
                </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                {digitize ? <label className="text-xs font-semibold text-slate-700">{t('digitize.output')} <select value={separate ? 'separate' : 'merged'} onChange={(event) => { setSeparate(event.target.value === 'separate'); setDownloadUrl(''); }} className="ml-2 rounded-lg border border-slate-200 p-2"><option value="merged">{t('digitize.merged')}</option><option value="separate">{t('digitize.separate')}</option></select></label> : <p className="max-w-xl text-[10px] text-slate-500">Create the finished PDF from the pages above, then download it to your device. Your source files stay in this browser.</p>}
                <div className="flex flex-wrap gap-2">
                  {downloadUrl && <a href={downloadUrl} download={downloadName} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"><Download className="h-4 w-4" />Download again</a>}
                  <button type="button" onClick={() => void handleExport()} disabled={isExporting || outputItems.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {digitize ? (isExporting ? t('digitize.preparing') : t('digitize.create')) : (isExporting ? 'Creating PDF...' : 'Create & download final PDF')}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      </fieldset>

      {showCustomPage && <CustomPageModal onClose={() => setShowCustomPage(false)} onCreate={addCustomPage} />}
      {showSamplePdf && <SamplePdfModal onClose={() => setShowSamplePdf(false)} onAdd={addGeneratedSample} />}
      {protectedPdfFile && (
        <ProtectedPdfPasswordModal
          fileName={protectedPdfFile.name}
          error={protectedPdfError}
          isLoading={isUnlockingPdf}
          onClose={cancelProtectedPdf}
          onSubmit={(password) => void handleProtectedPdfPassword(password)}
        />
      )}
      {sourcePreviewPage && sourcePreviewSource && <SourcePagePreviewModal page={sourcePreviewPage} source={sourcePreviewSource} onClose={() => setSourcePreviewPageId(null)} />}
      {contentsEntryItem && (
        <ContentsEntryModal
          item={contentsEntryItem}
          outputPageName={`outputPdfPag${outputItems.findIndex((item) => item.id === contentsEntryItem.id) + 1}`}
          onClose={() => setContentsEntryItemId(null)}
          onSave={(title) => {
            updateItems([contentsEntryItem.id], (item) => ({ ...item, contentsTitle: title }));
            setContentsEntryItemId(null);
            setNotice('Table of contents entry saved.');
          }}
          onRemove={() => {
            updateItems([contentsEntryItem.id], (item) => ({ ...item, contentsTitle: undefined }));
            setContentsEntryItemId(null);
            setNotice('Table of contents entry removed.');
          }}
        />
      )}
      {pageEditorItem && pageEditorSource && (
        <PageEditorModal
          key={pageEditorItem.id}
          item={pageEditorItem}
          source={pageEditorSource}
          onClose={() => setPageEditorItemId(null)}
          onExportPage={handleExportPage}
          onExportImage={handleExportPageImage}
          onApply={(updatedItem) => {
            updateItems([updatedItem.id], () => updatedItem);
            setPageEditorItemId(null);
          }}
          onDuplicate={() => duplicateOutputItem(pageEditorItem.id)}
          onDelete={() => {
            removeOutputItem(pageEditorItem.id);
            setPageEditorItemId(null);
          }}
        />
      )}
    </div>
  );
};

export default MasterDocumentStudio;
