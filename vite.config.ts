import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createReadStream, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const workerDir = dirname(require.resolve('tesseract.js/package.json'));
const coreDir = dirname(require.resolve('tesseract.js-core/package.json'));
const dataDir = dirname(require.resolve('@tesseract.js-data/eng/package.json'));
const ocrAssets: Record<string, string> = {
  'worker.min.js': join(workerDir, 'dist', 'worker.min.js'),
  'eng.traineddata.gz': join(dataDir, '4.0.0_best_int', 'eng.traineddata.gz'),
  ...Object.fromEntries(
    ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']
      .map((name) => [name, join(coreDir, name)]),
  ),
};

function localOcrAssets(): Plugin {
  return {
    name: 'local-ocr-assets',
    configureServer(server) {
      const base = server.config.base === './' ? '/' : server.config.base;
      server.middlewares.use(`${base}ocr-assets/`, (request, response, next) => {
        const name = request.url?.split('?')[0].replace(/^\//, '') ?? '';
        const path = ocrAssets[name];
        if (!path) return next();
        response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
        const stream = createReadStream(path);
        stream.on('error', next);
        stream.pipe(response);
      });
    },
    generateBundle() {
      for (const [name, path] of Object.entries(ocrAssets)) {
        this.emitFile({ type: 'asset', fileName: `ocr-assets/${name}`, source: readFileSync(path) });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // The SSR build only bundles src/prerender/shellData.ts for scripts/prerender-shell.mjs,
    // so it must not copy the OCR engine and language data again.
    ...(isSsrBuild ? [] : [localOcrAssets()]),
  ],
  build: isSsrBuild ? { copyPublicDir: false } : undefined,
}));