import { use } from 'react';
import i18n from '../i18n';
import type { Content } from './content';

/**
 * Loads the long per-tool text (guide steps, FAQs, articles) as its own chunk and adds it to i18next.
 * A tool page waits for it through React Suspense, so a heading or FAQ is never shown as a raw key while it loads.
 * Other pages start it only once the browser is idle (see prefetchContentWhenIdle), so it never competes with the first paint.
 */
let loaded: Content | null = null;
let pending: Promise<Content> | null = null;

export function loadContent(): Promise<Content> {
  pending ??= import('./content')
    .then(({ content }) => {
      i18n.addResourceBundle('en', 'translation', content, true, true);
      loaded = content;
      return content;
    })
    .catch((error: unknown) => {
      pending = null;
      throw error;
    });
  return pending;
}

/** The long English text. Suspends the page until it has loaded. */
export function useContent(): Content {
  return loaded ?? use(loadContent());
}

/** Connection types where a large background download would cost the visitor real data or time. */
const SLOW_CONNECTIONS = new Set(['slow-2g', '2g']);

/**
 * Starts loading the long text once the page has finished loading and the browser is idle, so opening a tool
 * right after the home page is fast without delaying the home page itself. It is skipped when the visitor has
 * turned on data saving or is on a very slow connection; a tool page then loads it when it is opened.
 */
export function prefetchContentWhenIdle(): void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || (connection?.effectiveType && SLOW_CONNECTIONS.has(connection.effectiveType))) return;
  const start = () => { loadContent().catch(() => undefined); };
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(start, { timeout: 4000 });
    else window.setTimeout(start, 2000);
  };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}
