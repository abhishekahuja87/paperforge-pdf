import { use } from 'react';
import i18n from '../i18n';
import type { Content } from './content';

/**
 * Loads the long per-tool text (guide steps, FAQs, articles) as its own chunk and adds it to i18next.
 * It starts downloading as soon as the app starts and is shared by every tool page. A tool page waits for it
 * through React Suspense, so a heading or FAQ is never shown as a raw key while it loads.
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
