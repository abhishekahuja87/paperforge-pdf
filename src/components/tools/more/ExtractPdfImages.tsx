import React, { useEffect, useState } from 'react';
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
import { extractImages, type FoundImage } from '../../../lib/more/extractImages';
import { usePdfSource } from './usePdfSource';

const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
async function pngOf(image: Extract<FoundImage, { kind: 'raw' }>): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = image.width; canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.putImageData(new ImageData(image.rgba as Uint8ClampedArray<ArrayBuffer>, image.width, image.height), 0, 0);
  const blob = await toBlob(canvas);
  canvas.width = 0; canvas.height = 0;
  return blob;
}

/** Save the original pictures stored inside a PDF, with no loss of quality, as one ZIP. No limit on pages or file size beyond your device. */
export const ExtractPdfImages: React.FC = () => {
  const saved = useResultFile();
  const pdf = usePdfSource(() => { saved.clear(); setFound(null); });
  const [minimum, setMinimum] = useState('50');
  const [found, setFound] = useState<{ images: FoundImage[]; skipped: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<{ id: number; url: string }[]>([]);

  const startOver = () => { saved.clear(); setFound(null); pdf.clear(); };
  const settingsKey = JSON.stringify([pdf.source?.name, pdf.source?.size, minimum]);

  useEffect(() => {
    if (!found) { setPreviews([]); return undefined; }
    const urls: { id: number; url: string }[] = [];
    let current = true;
    void (async () => {
      for (const image of found.images.slice(0, 12)) {
        const blob = image.kind === 'jpeg' ? new Blob([image.bytes as BlobPart], { type: 'image/jpeg' }) : await pngOf(image);
        if (blob && current) urls.push({ id: image.id, url: URL.createObjectURL(blob) });
      }
      if (current) setPreviews([...urls]);
    })();
    return () => { current = false; urls.forEach((item) => URL.revokeObjectURL(item.url)); };
  }, [found]);

  const find = async () => {
    if (!pdf.source) return;
    setBusy(true); pdf.setMessage(''); saved.clear();
    try { setFound(await extractImages(pdf.source.bytes, Number(minimum) || 0)); }
    catch { pdf.setMessage('Could not read the pictures in this PDF. The file may be damaged.'); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!pdf.source || !found) return;
    setBusy(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const width = String(found.images.length).length;
      for (const image of found.images) {
        const label = `image-${String(image.id).padStart(width, '0')}`;
        if (image.kind === 'jpeg') zip.file(`${label}.jpg`, image.bytes);
        else { const blob = await pngOf(image); if (blob) zip.file(`${label}.png`, blob); }
      }
      saved.set(await zip.generateAsync({ type: 'blob' }), generateFileName('pdf-images', 'zip', { base: pdf.source.name }), { key: settingsKey, detail: `${found.images.length} pictures` });
    } catch { pdf.setMessage('Could not make the ZIP. Close other tabs and try again.'); } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      {pdf.dialog}
      {!pdf.source && <UploadNote>Finds the photos and pictures stored in your PDF and saves them as they are.</UploadNote>}
      {!pdf.source ? <FileDropZone accept=".pdf,application/pdf" readingPdf={pdf.reading} disabled={pdf.reading} onFiles={(files) => { void pdf.open(files); }} /> : <PdfFileBar name={pdf.source.name} size={pdf.source.size} pages={pdf.source.pages} onChange={startOver} />}

      {pdf.source && !found && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>Which pictures</h2>
          <ChoiceButtons label="Pictures to include" value={minimum} onChange={setMinimum} options={[{ value: '0', label: 'Every picture' }, { value: '50', label: 'Skip tiny icons' }, { value: '300', label: 'Only large pictures' }]} />
        </div>
      )}
      {pdf.source && !found && <MainActionButton onClick={() => void find()} busy={busy} busyLabel="Looking for pictures...">Find pictures</MainActionButton>}

      {found && found.images.length === 0 && <Note>No pictures were found{found.skipped ? `, apart from ${found.skipped} that this tool cannot read` : ''}. If the pages look like pictures, they may be scans: use PDF to Images to save each page.</Note>}
      {found && found.images.length > 0 && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>{found.images.length} {found.images.length === 1 ? 'picture' : 'pictures'} found</h2>
          {previews.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((item) => <li key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><img src={item.url} alt={`Picture ${item.id}`} className="h-24 w-full object-contain" /></li>)}
            </ul>
          )}
          {found.images.length > previews.length && <p className="text-[11px] text-slate-500">Showing the first {previews.length}. All of them are in the ZIP.</p>}
          {found.skipped > 0 && <p className="text-[11px] text-slate-500">{found.skipped} {found.skipped === 1 ? 'picture' : 'pictures'} could not be read (masks or unusual colours) and {found.skipped === 1 ? 'is' : 'are'} left out.</p>}
        </div>
      )}
      {found && found.images.length > 0 && !saved.result && <MainActionButton onClick={() => void save()} busy={busy} busyLabel="Making the ZIP...">Save all pictures as ZIP</MainActionButton>}
      {saved.result && (
        <div className="space-y-3">
          <SaveResult href={saved.result.url} name={saved.result.name} label="Your pictures are ready (ZIP)" saveLabel="Save ZIP" detail={saved.result.detail} />
          <StartOverButton onClick={startOver}>Extract from another PDF</StartOverButton>
        </div>
      )}
      {pdf.message && <Note>{pdf.message}</Note>}
    </section>
  );
};

export default ExtractPdfImages;
