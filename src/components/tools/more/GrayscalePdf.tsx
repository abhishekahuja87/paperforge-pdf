import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { card, heading } from '../../common/PanelKit';
import { FileDropZone } from '../../common/FileDropZone';
import { UploadNote } from '../../common/UploadNote';
import { PdfFileBar } from '../../common/PdfFileBar';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult, StartOverButton } from '../../common/SaveResult';
import { useResultFile } from '../../../lib/useResultFile';
import { generateFileName } from '../../../lib/pdf/naming';
import { safeRenderScale } from '../../../lib/pdf/renderScale';
import { toGray, type GrayMode } from '../../../lib/more/grayscale';
import { usePdfSource } from './usePdfSource';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
const tick = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));
const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** Turn a colour PDF into greys or pure black and white, for cheaper printing. Pages are redrawn as pictures, so the text can no longer be selected. */
export const GrayscalePdf: React.FC = () => {
  const saved = useResultFile();
  const pdf = usePdfSource(() => saved.clear());
  const [mode, setMode] = useState<GrayMode>('gray');
  const [quality, setQuality] = useState('150');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const settingsKey = JSON.stringify([pdf.source?.name, pdf.source?.size, mode, quality]);
  const outdated = saved.isOutdated(settingsKey);
  const startOver = () => { saved.clear(); pdf.clear(); };

  const run = async () => {
    if (!pdf.source) return;
    setBusy(true); pdf.setMessage('');
    const task = pdfjsLib.getDocument({ data: new Uint8Array(pdf.source.bytes.slice(0)) });
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await task.promise;
      const out = await PDFDocument.create();
      for (let number = 1; number <= doc.numPages; number += 1) {
        setProgress(`Page ${number} of ${doc.numPages}…`);
        const page = await doc.getPage(number);
        const scale = safeRenderScale(page, Number(quality) / 72);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width)); canvas.height = Math.max(1, Math.round(viewport.height));
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('canvas');
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        toGray(pixels.data, mode);
        context.putImageData(pixels, 0, 0);
        const blob = await toBlob(canvas, mode === 'gray' ? 'image/jpeg' : 'image/png', 0.85);
        if (!blob) throw new Error('image');
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const image = mode === 'gray' ? await out.embedJpg(bytes) : await out.embedPng(bytes);
        const view = page.getViewport({ scale: 1 });
        out.addPage([view.width, view.height]).drawImage(image, { x: 0, y: 0, width: view.width, height: view.height });
        canvas.width = 0; canvas.height = 0;
        page.cleanup();
        if (number % 2 === 0) await tick();
      }
      saved.set(new Blob([await out.save() as BlobPart], { type: 'application/pdf' }), generateFileName('grayscale', 'pdf', { base: pdf.source.name, details: mode === 'gray' ? 'grey' : 'bw' }), { key: settingsKey, detail: `${doc.numPages} pages in ${mode === 'gray' ? 'greys' : 'black and white'}` });
    } catch { pdf.setMessage('Could not convert this PDF. Try a lower quality, or close other tabs for a very large file.'); }
    finally { void task.destroy(); setBusy(false); setProgress(''); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {pdf.dialog}
      {!pdf.source && <UploadNote>Choose greys or black and white, then save a PDF that prints without colour.</UploadNote>}
      {!pdf.source ? <FileDropZone accept=".pdf,application/pdf" readingPdf={pdf.reading} disabled={pdf.reading} onFiles={(files) => { void pdf.open(files); }} /> : <PdfFileBar name={pdf.source.name} size={pdf.source.size} pages={pdf.source.pages} onChange={startOver} />}

      {pdf.source && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>Colour settings</h2>
          <ChoiceButtons label="Convert to" value={mode} onChange={(value) => setMode(value as GrayMode)} options={[{ value: 'gray', label: 'Shades of grey' }, { value: 'blackwhite', label: 'Black and white only' }]} />
          <ChoiceButtons label="Quality" value={quality} onChange={setQuality} options={[{ value: '100', label: 'Smaller file' }, { value: '150', label: 'Balanced' }, { value: '220', label: 'Sharper' }]} />
          <p className="text-xs text-slate-600">Each page is redrawn as a picture, so text can no longer be selected or searched. Keep your original if you need that. Black and white only suits text pages and drawings, not photos.</p>
        </div>
      )}
      {pdf.source && (!saved.result || outdated) && <MainActionButton onClick={() => void run()} busy={busy} busyLabel={progress || 'Working...'}>Convert to {mode === 'gray' ? 'grey' : 'black and white'}</MainActionButton>}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label="Your PDF is ready" saveLabel="Save PDF" detail={saved.result.detail} outdated={outdated} />
          {!outdated && <StartOverButton onClick={startOver}>Convert another PDF</StartOverButton>}
        </div>
      )}
      {pdf.message && <Note>{pdf.message}</Note>}
    </section>
  );
};

export default GrayscalePdf;
