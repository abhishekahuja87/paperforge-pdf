/** A picture ready to print: a PNG data address and its width over height. */
export interface Logo { src: string; ratio: number }

const MAX_SIDE = 480;

/** Reads a picture the person chose, shrinks it so it stays small and keeps see-through areas. It never leaves the browser. */
export function fileToLogo(file: File): Promise<Logo> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Choose a picture file (PNG, JPG or WebP).')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('This browser cannot read the picture.')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ src: canvas.toDataURL('image/png'), ratio: w / h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open that picture. Try a PNG or JPG.')); };
    img.src = url;
  });
}
