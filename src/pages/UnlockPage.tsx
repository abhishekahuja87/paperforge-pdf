import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { UnlockPdf } from '../components/tools/UnlockPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageHeading } from '../lib/usePageHeading';
import { usePageFaqs } from '../lib/usePageGuide';

export const UnlockPage: React.FC = () => {
  const heading = usePageHeading('unlock');

  const guide = usePageFaqs('unlock');

  return (
    <ToolLayout
      title={heading.title}
      subtitle={heading.subtitle}
      contentLanguage={heading.language}
      seoContent={<ToolGuide toolName={heading.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <UnlockPdf />
    </ToolLayout>
  );
};

export default UnlockPage;