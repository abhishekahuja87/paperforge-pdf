import { VCardParser } from './parser';

const CHUNK = 4 * 1024 * 1024;

/** Picks the text encoding from the byte-order mark; vCards from some phones and older Outlook are UTF-16. */
async function encodingOf(file: File): Promise<string> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (head[0] === 0xff && head[1] === 0xfe) return 'utf-16le';
  if (head[0] === 0xfe && head[1] === 0xff) return 'utf-16be';
  return 'utf-8';
}

/** Reads one file in 4 MB pieces into the parser, reporting progress and letting the page redraw between pieces. */
export async function readVcf(file: File, parser: VCardParser, onProgress: (fraction: number) => void): Promise<void> {
  const decoder = new TextDecoder(await encodingOf(file));
  for (let offset = 0; offset < file.size; offset += CHUNK) {
    const buffer = await file.slice(offset, offset + CHUNK).arrayBuffer();
    parser.push(decoder.decode(buffer, { stream: true }));
    onProgress(Math.min(1, (offset + CHUNK) / file.size));
    await new Promise((resolve) => { window.setTimeout(resolve, 0); });
  }
  parser.push(decoder.decode());
  parser.end();
}
