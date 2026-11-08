import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { siteConfig } from '../../config/site';

interface PageMetadataProps {
  title: string;
  description: string;
  /** Ask search engines not to index this page (used by the 404 page). */
  noindex?: boolean;
}

function setMetaContent(selector: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    const [attribute, value] = selector.match(/(name|property)="([^"]+)"/)?.slice(1) ?? [];
    if (attribute && value) element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.content = content;
}

export const PageMetadata: React.FC<PageMetadataProps> = ({ title, description, noindex = false }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = `${title} | ${siteConfig.shortName}`;
    const canonicalUrl = new URL(pathname, siteConfig.url).toString();
    document.title = pageTitle;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', pageTitle);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', pageTitle);
    setMetaContent('meta[name="twitter:description"]', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [description, pathname, title]);

  useEffect(() => {
    if (!noindex) return undefined;
    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = robots?.content ?? 'index, follow';
    setMetaContent('meta[name="robots"]', 'noindex, follow');
    return () => setMetaContent('meta[name="robots"]', previous);
  }, [noindex]);

  return null;
};
