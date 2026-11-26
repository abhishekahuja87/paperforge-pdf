/** Putting drawn pages (canvases) into a PDF, one picture for each page. pdf-lib is loaded only when this runs. */
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function canvasesToPdf(count: number, draw: (index: number) => HTMLCanvasElement, size: [number, number], title: string, onProgress: (done: number) => void, cancelled: () => boolean, quality = 0.85): Promise<Blob | null> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create(); doc.setTitle(title); doc.setCreator('MyDailyUtils');
  for (let n = 0; n < count; n += 1) {
    if (cancelled()) return null;
    const canvas = draw(n);
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!jpeg) throw new Error('A page could not be drawn.');
    const image = await doc.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
    doc.addPage(size).drawImage(image, { x: 0, y: 0, width: size[0], height: size[1] });
    canvas.width = 1; canvas.height = 1; onProgress(n + 1); await pause();
  }
  return new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });
}
