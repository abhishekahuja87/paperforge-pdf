/** Putting the certificates into a PDF, or into a zip with one PDF for each person. The fixed part is stored once in each PDF, so the files stay small. */
import { drawPersonal, drawTemplate, personalBox, SIZE, type CertificateLook, type CertificateWords, type Person } from './draw';

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

async function templateBytes(look: CertificateLook, words: CertificateWords): Promise<Uint8Array> {
  const size = SIZE[look.paper], canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height;
  drawTemplate(canvas.getContext('2d')!, look, words);
  const blob = await toBlob(canvas, 'image/jpeg', 0.92); if (!blob) throw new Error('The page could not be drawn.');
  return new Uint8Array(await blob.arrayBuffer());
}

async function personalBytes(look: CertificateLook, person: Person): Promise<Uint8Array> {
  const box = personalBox(look), canvas = document.createElement('canvas'); canvas.width = Math.round(box.width); canvas.height = Math.round(box.height);
  drawPersonal(canvas.getContext('2d')!, look, person.name, person.reason);
  const blob = await toBlob(canvas, 'image/png'); if (!blob) throw new Error('A name could not be drawn.');
  return new Uint8Array(await blob.arrayBuffer());
}

type Doc = import('pdf-lib').PDFDocument;
async function addPage(doc: Doc, template: import('pdf-lib').PDFImage, look: CertificateLook, person: Person): Promise<void> {
  const size = SIZE[look.paper], box = personalBox(look), [pw, ph] = size.points, scale = pw / size.width;
  const layer = await doc.embedPng(await personalBytes(look, person));
  const page = doc.addPage([pw, ph]);
  page.drawImage(template, { x: 0, y: 0, width: pw, height: ph });
  page.drawImage(layer, { x: box.x * scale, y: ph - (box.y + box.height) * scale, width: box.width * scale, height: box.height * scale });
}

/** One PDF with a page for each person. Returns null when cancelled. */
export async function makeOnePdf(people: Person[], look: CertificateLook, words: CertificateWords, onProgress: (done: number) => void, cancelled: () => boolean): Promise<Blob | null> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create(); doc.setTitle(words.title || 'Certificates'); doc.setCreator('MyDailyUtils');
  const template = await doc.embedJpg(await templateBytes(look, words));
  for (let n = 0; n < people.length; n += 1) { if (cancelled()) return null; await addPage(doc, template, look, people[n]!); onProgress(n + 1); await pause(); }
  return new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });
}

const safeName = (name: string) => name.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'certificate';

/** A zip holding one PDF for each person, named after them. Returns null when cancelled. */
export async function makeZip(people: Person[], look: CertificateLook, words: CertificateWords, onProgress: (done: number) => void, cancelled: () => boolean): Promise<Blob | null> {
  const [{ PDFDocument }, { default: JSZip }] = await Promise.all([import('pdf-lib'), import('jszip')]);
  const zip = new JSZip(), used = new Set<string>(), bytes = await templateBytes(look, words);
  for (let n = 0; n < people.length; n += 1) {
    if (cancelled()) return null;
    const doc = await PDFDocument.create(); doc.setTitle(words.title || 'Certificate'); doc.setCreator('MyDailyUtils');
    await addPage(doc, await doc.embedJpg(bytes), look, people[n]!);
    let name = safeName(people[n]!.name), tries = 2; while (used.has(name.toLowerCase())) { name = `${safeName(people[n]!.name)} ${tries}`; tries += 1; }
    used.add(name.toLowerCase()); zip.file(`${name}.pdf`, await doc.save()); onProgress(n + 1); await pause();
  }
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}
