import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { SanitizePdf } from '../components/tools/SanitizePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageHeading } from '../lib/usePageHeading';
import { usePageFaqs } from '../lib/usePageGuide';

export const SanitizePage: React.FC = () => {
  const heading = usePageHeading('sanitize');

  const guide = usePageFaqs('sanitize');

  return (
    <ToolLayout
      title={heading.title}
      subtitle={heading.subtitle}
      contentLanguage={heading.language}
      seoContent={<ToolGuide toolName={heading.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <SanitizePdf />
    </ToolLayout>
  );
};