import { use } from 'react';
import i18n from '../i18n';

/**
 * Loads the long per-tool text (guide steps, questions, articles) one tool at a time.
 * A generated index (contentIndex.generated.ts, see scripts/build-content-index.mjs) says which text files hold a tool's text,
 * and only those files are downloaded and added to i18next, so a visitor does not download the text of every tool to read one.
 * A tool page waits for it through React Suspense, so a heading or FAQ is never shown as a raw key while it loads.
 * Other pages start only the small index once the browser is idle (see prefetchContentWhenIdle), so it never competes with the first paint.
 */
type Section = 'guideSteps' | 'pageGuides' | 'toolArticles';

const loadSplit = () => import('./contentSplit');

/** Adds the found entries to i18next, so `t('toolArticles.merge-pdf.sections')` and the other keys work as before. */
function addToI18n(entries: Partial<Record<Section, [string, unknown]>>): void {
  const bundle: Record<string, Record<string, unknown>> = {};
  for (const [section, entry] of Object.entries(entries)) {
    if (entry && entry[1] !== undefined) bundle[section] = { [entry[0]]: entry[1] };
  }
  if (Object.keys(bundle).length > 0) i18n.addResourceBundle('en', 'translation', bundle, true, true);
}

export interface ToolContent {
  /** The guide steps of the tool, or undefined when the text has none and the page's own steps are used. */
  steps: unknown[] | undefined;
}

/** Lets React read a finished promise at once instead of waiting a turn (the same fields React sets itself). */
function settle<T>(promise: Promise<T>, value: T): void {
  Object.assign(promise, { status: 'fulfilled', value });
}

const toolsPending = new Map<string, Promise<ToolContent>>();

function loadToolContent(slug: string): Promise<ToolContent> {
  const existing = toolsPending.get(slug);
  if (existing) return existing;
  const pending: Promise<ToolContent> = loadSplit().then(async ({ resolveContent }) => {
    const [steps, article] = await Promise.all([resolveContent('guideSteps', slug), resolveContent('toolArticles', slug)]);
    addToI18n({ guideSteps: [slug, steps], toolArticles: [slug, article] });
    return { steps: Array.isArray(steps) ? steps : undefined } as ToolContent;
  });
  toolsPending.set(slug, pending);
  pending.then((result) => settle(pending, result), () => { toolsPending.delete(slug); });
  return pending;
}

/** The text for the tool at route `slug` (the path without the slash). Suspends the page until it has loaded. */
export function useToolContent(slug: string): ToolContent {
  return use(loadToolContent(slug));
}

export interface PageGuideContent {
  /** The questions of the page guide; the strings themselves are read with t(). */
  faq: unknown[];
}

const guidesPending = new Map<string, Promise<PageGuideContent>>();

function loadGuideContent(key: string): Promise<PageGuideContent> {
  const existing = guidesPending.get(key);
  if (existing) return existing;
  const pending: Promise<PageGuideContent> = loadSplit().then(async ({ resolveContent }) => {
    const guide = await resolveContent('pageGuides', key);
    addToI18n({ pageGuides: [key, guide] });
    const faq = (guide as { faq?: unknown[] } | undefined)?.faq;
    return { faq: Array.isArray(faq) ? faq : [] } as PageGuideContent;
  });
  guidesPending.set(key, pending);
  pending.then((result) => settle(pending, result), () => { guidesPending.delete(key); });
  return pending;
}

/** The text of the page guide `key` (a key of pageGuides). Suspends the page until it has loaded. */
export function usePageGuideContent(key: string): PageGuideContent {
  return use(loadGuideContent(key));
}

/** Connection types where a background download would cost the visitor real data or time. */
const SLOW_CONNECTIONS = new Set(['slow-2g', '2g']);

/**
 * Starts loading the small text index once the page has finished loading and the browser is idle, so opening a tool
 * right after the home page needs one request fewer, without delaying the home page itself. It is skipped when the visitor
 * has turned on data saving or is on a very slow connection; a tool page then loads it when it is opened.
 */
export function prefetchContentWhenIdle(): void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || (connection?.effectiveType && SLOW_CONNECTIONS.has(connection.effectiveType))) return;
  const start = () => { loadSplit().catch(() => undefined); };
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(start, { timeout: 4000 });
    else window.setTimeout(start, 2000);
  };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}
