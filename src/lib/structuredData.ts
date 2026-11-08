/**
 * Builders for schema.org JSON-LD. Plain data only (no React or browser APIs), because the same
 * functions run in the browser (PageMetadata) and at build time (src/prerender/shellData.ts).
 */
import { siteConfig } from '../config/site';

export type JsonLd = Record<string, unknown>;

const publisher = { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url };

/** WebApplication plus breadcrumb data for one tool page. */
export function buildToolJsonLd(page: { name: string; description: string; path: string }): JsonLd[] {
  const url = new URL(page.path, siteConfig.url).toString();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: page.name,
      url,
      description: page.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      publisher,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: new URL('/', siteConfig.url).toString() },
        { '@type': 'ListItem', position: 2, name: page.name, item: url },
      ],
    },
  ];
}

/** WebSite data for the home page. */
export function buildHomeJsonLd(): JsonLd[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      url: new URL('/', siteConfig.url).toString(),
      description: siteConfig.description,
      inLanguage: 'en',
      publisher,
    },
  ];
}
