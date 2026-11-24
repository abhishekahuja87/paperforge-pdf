/**
 * Finds a free-to-use picture of a place on Wikipedia and Wikimedia Commons, one small picture at a time.
 * Only the place name is sent, and only when the person taps the button. Nothing is bundled with the site.
 * Only pictures with a Creative Commons or public domain licence are used, and the credit is returned so it can be shown.
 */
const WIKI = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const SKIP = /flag|map|locator|logo|icon|coat[_ ]of|seal|symbol|emblem|signature|portrait|statue_of|diagram|chart|banner/i;

export interface PlacePicture { canvas: HTMLCanvasElement; credit: string }

async function getJson(url: string): Promise<Record<string, unknown> | null> {
  const control = new AbortController();
  const timer = window.setTimeout(() => control.abort(), 9000);
  try {
    const response = await fetch(url, { signal: control.signal });
    return response.ok ? ((await response.json()) as Record<string, unknown>) : null;
  } catch { return null; } finally { window.clearTimeout(timer); }
}

const firstPage = (data: Record<string, unknown> | null) => {
  const pages = (data?.query as { pages?: Record<string, Record<string, unknown>> } | undefined)?.pages;
  return pages ? Object.values(pages)[0] : undefined;
};

/** File names on the place's Wikipedia page, best first: the page's main picture, then other photos in the article. */
export async function pictureFiles(name: string): Promise<string[]> {
  const url = `${WIKI}?action=query&format=json&origin=*&redirects=1&titles=${encodeURIComponent(name)}&prop=pageimages|images&piprop=name&imlimit=40`;
  const page = firstPage(await getJson(url));
  if (!page) return [];
  const files: string[] = [];
  const main = page.pageimage as string | undefined;
  if (main) files.push(main.replace(/_/g, ' '));
  for (const item of (page.images as { title: string }[] | undefined) ?? []) {
    const file = item.title.replace(/^File:/i, '').replace(/_/g, ' ');
    if (/\.jpe?g$/i.test(file) && !SKIP.test(file) && !files.includes(file)) files.push(file);
  }
  return files.slice(0, 12);
}

const plain = (html: string | undefined) => (html ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** One file as a canvas with its credit, or null when the licence is not free or the picture cannot be read. */
export async function loadPicture(file: string, max = 900): Promise<PlacePicture | null> {
  const url = `${COMMONS}?action=query&format=json&origin=*&titles=${encodeURIComponent(`File:${file}`)}&prop=imageinfo&iiprop=extmetadata|url|mime&iiurlwidth=${max}`;
  const info = (firstPage(await getJson(url))?.imageinfo as { thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }[] | undefined)?.[0];
  if (!info?.thumburl || !/^image\/(jpeg|png)$/.test(info.mime ?? '')) return null;
  const meta = info.extmetadata ?? {};
  const licence = plain(meta.LicenseShortName?.value);
  if (!/^(CC[ -]|Public domain|PD)/i.test(licence) || /true|yes/i.test(meta.NonFree?.value ?? '')) return null;
  try {
    const blob = await (await fetch(info.thumburl)).blob();
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const artist = plain(meta.Artist?.value) || 'Unknown author';
    const credit = `${artist.length > 40 ? `${artist.slice(0, 38)}…` : artist}, ${licence}, Wikimedia Commons`;
    return { canvas, credit };
  } catch { return null; }
}
