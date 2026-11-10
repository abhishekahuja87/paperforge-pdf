import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { siteConfig } from '../../config/site';
import { useContent } from '../../locales/contentLoader';
import { AccordionList } from './AccordionList';
import { FoldToggle } from './FoldToggle';
import { GuideRegistryContext } from './guideRegistry';

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

function isSection(value: unknown): value is ArticleSection {
  if (!value || typeof value !== 'object') return false;
  const { heading, paragraphs } = value as Record<string, unknown>;
  return typeof heading === 'string' && Array.isArray(paragraphs) && paragraphs.every((item) => typeof item === 'string');
}

/**
 * Written sections for a tool, keyed by route path without the leading slash (for example `merge-pdf`).
 * Copy lives in the `toolArticles` resource. The text is English only for now; other languages fall back to it.
 */
export function useArticleSections(id: string): ArticleSection[] {
  const { t } = useTranslation();
  useContent();
  const raw = t(`toolArticles.${id}.sections`, { returnObjects: true, siteName: siteConfig.name, defaultValue: [] }) as unknown;
  return Array.isArray(raw) ? raw.filter(isSection) : [];
}

/**
 * Longer written explanation for a tool, shown under the tool itself. When a guide on the page shows the same
 * sections together with its questions, this renders nothing so the text appears once.
 */
export const ToolArticle: React.FC<{ id: string }> = ({ id }) => {
  const sections = useArticleSections(id);
  const { guideShowsArticle } = useContext(GuideRegistryContext);
  if (sections.length === 0 || guideShowsArticle) return null;

  return (
    <article className="print:hidden mx-auto w-full max-w-3xl">
      <div className="mb-1 flex justify-end"><FoldToggle /></div>
      <AccordionList
        items={sections.map((section) => ({
          key: section.heading,
          title: section.heading,
          children: <>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>,
        }))}
      />
    </article>
  );
};

export default ToolArticle;
