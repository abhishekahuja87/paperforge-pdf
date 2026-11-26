/** Putting the letters into one PDF, or into a zip with a PDF for each person. */
import { PAPER, drawLetter, type Letter, type LetterLogo, type LetterLook, type LetterWords } from './draw';

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const toJpeg = (canvas: HTMLCanvasElement) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
type Doc = import('pdf-lib').PDFDocument;

async function addLetter(doc: Doc, look: LetterLook, words: LetterWords, letter: Letter, logo: LetterLogo | null): Promise<void> {
  const [pw, ph] = PAPER[look.paper].points;
  for (const canvas of drawLetter(look, words, letter, logo)) {
    const blob = await toJpeg(canvas); if (!blob) throw new Error('A page could not be drawn.');
    const image = await doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    doc.addPage([pw, ph]).drawImage(image, { x: 0, y: 0, width: pw, height: ph });
    canvas.width = 1; canvas.height = 1;
  }
}

/** One PDF with every letter one after another. Returns null when cancelled. */
export async function makeOnePdf(letters: Letter[], look: LetterLook, words: LetterWords, logo: LetterLogo | null, onProgress: (done: number) => void, cancelled: () => boolean): Promise<Blob | null> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create(); doc.setTitle('Letters'); doc.setCreator('MyDailyUtils');
  for (let n = 0; n < letters.length; n += 1) { if (cancelled()) return null; await addLetter(doc, look, words, letters[n]!, logo); onProgress(n + 1); await pause(); }
  return new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });
}

const safeName = (name: string) => name.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'letter';

/** A zip with one PDF per letter, named from `names`. Returns null when cancelled. */
export async function makeZip(letters: Letter[], names: string[], look: LetterLook, words: LetterWords, logo: LetterLogo | null, onProgress: (done: number) => void, cancelled: () => boolean): Promise<Blob | null> {
  const [{ PDFDocument }, { default: JSZip }] = await Promise.all([import('pdf-lib'), import('jszip')]);
  const zip = new JSZip(), used = new Set<string>();
  for (let n = 0; n < letters.length; n += 1) {
    if (cancelled()) return null;
    const doc = await PDFDocument.create(); doc.setTitle(letters[n]!.subject || 'Letter'); doc.setCreator('MyDailyUtils');
    await addLetter(doc, look, words, letters[n]!, logo);
    const base = safeName(names[n] ?? `letter ${n + 1}`); let name = base, tries = 2; while (used.has(name.toLowerCase())) { name = `${base} ${tries}`; tries += 1; }
    used.add(name.toLowerCase()); zip.file(`${name}.pdf`, await doc.save()); onProgress(n + 1); await pause();
  }
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}
