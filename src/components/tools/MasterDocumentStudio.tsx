import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Move, Pin, X } from 'lucide-react';
import { createCustomPage, createSource, DEFAULT_STUDIO_SETTINGS, exportMasterPdf } from '../../lib/documentStudio/studio';
import type { GeneratedPageOptions, OutputSequenceItem, PageCard, SourceItem, StudioSettings } from '../../lib/documentStudio/types';
import { renderOutputPageImage } from '../../lib/documentStudio/studio';
import { protectPdf } from '../../lib/pdf/protect';
import { ContentsEntryModal, CustomPageModal, PageEditorModal, ProtectedPdfPasswordModal, SourcePagePreviewModal } from './documentStudio/StudioModals';
import { SamplePdfModal } from './documentStudio/SamplePdfModal';
import { useTranslation } from 'react-i18next';
import ui from '../../locales/packs/docstudio.ui.en.json';
import { createDefaultStudioSettings, pdfFileName, arrayBufferFromBytes, parsePageRange, newOutputItem } from '../../lib/documentStudio/helpers';
import { InputDeck } from './documentStudio/InputDeck';
import { SourceRail } from './documentStudio/SourceRail';
import { SelectedPagesPanel } from './documentStudio/SelectedPagesPanel';
import { ExportPanel } from './documentStudio/ExportPanel';

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
  const [ocrLanguage, setOcrLanguage] = useState<'eng' | 'hin+eng'>('eng');
  const ocrLanguages = (): string[] => (ocrLanguage === 'hin+eng' ? ['hin', 'eng'] : ['eng']);
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
          }, controller.signal, ocrLanguages());
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
      ? await (await import('../../lib/documentStudio/searchable')).makeSearchable(result.bytes, () => {}, new AbortController().signal, ocrLanguages())
      : result.bytes;
    const blob = new Blob([arrayBufferFromBytes(bytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const pageIndex = outputItems.findIndex((outputItem) => outputItem.id === item.id);
    const filename = `output-page-${Math.max(1, pageIndex + 1)}.pdf`;
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
    const filename = `output-page-${Math.max(1, pageIndex + 1)}.${extension}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`${filename} downloaded.`);
  };
  const inputDeck = <InputDeck addFiles={addFiles} applyPageRange={applyPageRange} digitize={digitize} isLoading={isLoading} pageRangeErrors={pageRangeErrors} pageRanges={pageRanges} pages={pages} selectedIds={selectedIds} setPageRangeErrors={setPageRangeErrors} setPageRanges={setPageRanges} setShowCustomPage={setShowCustomPage} setShowSamplePdf={setShowSamplePdf} setSourcePreviewPageId={setSourcePreviewPageId} sources={sources} togglePage={togglePage} toggleSourcePages={toggleSourcePages} />;

  const sourceRail = <SourceRail fileInputRef={fileInputRef} outputItems={outputItems} pages={pages} removeSource={removeSource} setStage={setStage} sources={sources} />;

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
            {sources.length > 0 && <SelectedPagesPanel pageMap={pageMap} proceedToStudio={proceedToStudio} selectedIds={selectedIds} togglePage={togglePage} />}
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
                <p className="pl-8 text-xs text-slate-500">{ui.dragPagesToReorderPin}</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{outputItems.length} page{outputItems.length === 1 ? '' : 's'} in sequence · {outputItems.filter((item) => item.contentsTitle?.trim()).length} contents entr{outputItems.filter((item) => item.contentsTitle?.trim()).length === 1 ? 'y' : 'ies'}</div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-950">
              <Pin className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-amber-600" />
              <p><span className="font-bold">{ui.createALinkedTableOf}</span> Click the pin on each page you want listed, enter its heading, and export. We’ll add a contents page at the beginning with links to those pages. Pages without a heading won’t appear.</p>
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
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white">Page {index + 1}</span>
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
                        <span className="inline-flex items-center gap-1 text-[9px] text-slate-400"><Move className="h-3 w-3" />{ui.dragToReorder}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" aria-label={`${item.contentsTitle ? 'Edit' : 'Add'} table of contents entry for page ${index + 1}`} aria-pressed={Boolean(item.contentsTitle)} onClick={() => setContentsEntryItemId(item.id)} className={`rounded-lg p-1.5 ${item.contentsTitle ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'}`} title={item.contentsTitle ? 'Edit contents entry' : 'Add to table of contents'}><Pin className={`h-4 w-4 ${item.contentsTitle ? 'fill-current' : ''}`} /></button>
                          <button type="button" onClick={() => setPageEditorItemId(item.id)} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100">{ui.zoomEdit}</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{ui.noOutputPagesRemainReturn}</div>
            )}

            <ExportPanel digitize={digitize} downloadName={downloadName} downloadUrl={downloadUrl} handleExport={handleExport} isExporting={isExporting} ocrLanguage={ocrLanguage} outputItems={outputItems} separate={separate} setDownloadUrl={setDownloadUrl} setOcrLanguage={setOcrLanguage} setSeparate={setSeparate} settings={settings} updateSettings={updateSettings} />
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
          outputPageName={`Page ${outputItems.findIndex((item) => item.id === contentsEntryItem.id) + 1}`}
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
