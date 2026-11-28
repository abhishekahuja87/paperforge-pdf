/**
 * Copies the PDF library's own support files (pdfjs-dist) into public/pdfjs/<version>/ so the site serves them itself:
 * - cmaps: character maps for PDFs with Chinese, Japanese, Korean and some Indian fonts,
 * - standard_fonts: the 14 standard PDF fonts, used when a PDF names a font without embedding it,
 * - wasm: decoders for JBIG2 (common in black-and-white office scans) and JPEG 2000 images, and colour profiles,
 * - iccs: colour profiles.
 * Without these, scanned pages using JBIG2 or JPEG 2000 images come out blank when drawn. The version folder keeps the
 * files in step with the library and lets browsers cache them for good. Runs before `vite` in dev and build.
 * The copy is not committed (see .gitignore).
 */
import { cp, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const lib = join(root, 'node_modules', 'pdfjs-dist');
const { version } = JSON.parse(await readFile(join(lib, 'package.json'), 'utf8'));
const outRoot = join(root, 'public', 'pdfjs');
const out = join(outRoot, version);
const FOLDERS = ['cmaps', 'standard_fonts', 'wasm', 'iccs'];

// Remove copies made for other versions of the library.
if (existsSync(outRoot)) {
  for (const entry of await readdir(outRoot)) if (entry !== version) await rm(join(outRoot, entry), { recursive: true, force: true });
}
if (!FOLDERS.every((folder) => existsSync(join(out, folder)))) {
  await mkdir(out, { recursive: true });
  for (const folder of FOLDERS) await cp(join(lib, folder), join(out, folder), { recursive: true });
  console.log(`copy-pdfjs-assets: copied ${FOLDERS.join(', ')} for pdfjs-dist ${version}`);
}
