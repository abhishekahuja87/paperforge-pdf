import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ExtractText } from '../components/tools/ExtractText';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageHeading } from '../lib/usePageHeading';
import { usePageFaqs } from '../lib/usePageGuide';

export const ExtractTextPage: React.FC = () => {
  const heading = usePageHeading('extract');

  const guide = usePageFaqs('extract');

  return (
    <ToolLayout
      title={heading.title}
      subtitle={heading.subtitle}
      contentLanguage={heading.language}
      seoContent={<ToolGuide toolName={heading.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <ExtractText />
    </ToolLayout>
  );
};

export default ExtractTextPage;