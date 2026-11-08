import React from 'react';
import { useTranslation } from 'react-i18next';
import { siteConfig } from '../../config/site';

interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

function isSection(value: unknown): value is ArticleSection {
  if (!value || typeof value !== 'object') return false;
  const { heading, paragraphs } = value as Record<string, unknown>;
  return typeof heading === 'string' && Array.isArray(paragraphs) && paragraphs.every((item) => typeof item === 'string');
}

/**
 * Longer written explanation for a tool, shown under the tool itself.
 * Copy lives in the `toolArticles` resource, keyed by route path without the leading slash
 * (for example `merge-pdf`). Renders nothing when a tool has no article yet.
 * The article text is English only for now; other languages fall back to it.
 */
export const ToolArticle: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation();
  const raw = t(`toolArticles.${id}.sections`, { returnObjects: true, siteName: siteConfig.name, defaultValue: [] }) as unknown;
  const sections = Array.isArray(raw) ? raw.filter(isSection) : [];
  if (sections.length === 0) return null;

  return (
    <article lang="en" className="mx-auto w-full max-w-3xl space-y-6 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-5 text-sm leading-7 text-stone-700 sm:p-8">
      {sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight text-stone-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
    </article>
  );
};

export default ToolArticle;
