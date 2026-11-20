/*
 * MyDailyUtils service worker. It only keeps a copy of this site's own pages and files so that tools that run in
 * the browser still open with no connection. It never touches other sites (ads, analytics) and never caches
 * anything that is not a normal successful response.
 *  - Pages: network first, so a new deploy shows straight away; the saved copy is used only when offline.
 *  - Built files (/assets, OCR engine, pictures): saved the first time they are fetched; their names change on every deploy.
 */
const CACHE = 'mdu-runtime-v1';
const MAX_ENTRIES = 300;
const SKIP = /^\/(ac1|sitemap\.xml|robots\.txt|ads\.txt|sw\.js|manifest\.webmanifest)/;
const STATIC = /^\/(assets|ocr-assets|exercises)\/|\.(?:png|svg|webp|woff2?)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('/')).catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('mdu-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ENTRIES; i += 1) await cache.delete(keys[i]);
}

const cacheable = (response) => response.ok && response.type === 'basic' && !response.redirected && !(response.headers.get('content-type') || '').includes('text/html');

async function pageRequest(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic' && !response.redirected) { await cache.put(request, response.clone()); trim(cache); }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('/')) || Response.error();
  }
}

async function fileRequest(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (cacheable(response)) { await cache.put(request, response.clone()); trim(cache); }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || SKIP.test(url.pathname)) return;
  if (request.mode === 'navigate') event.respondWith(pageRequest(request));
  else if (STATIC.test(url.pathname)) event.respondWith(fileRequest(request));
});
