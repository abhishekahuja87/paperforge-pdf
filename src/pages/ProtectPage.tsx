import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ProtectPdf } from '../components/tools/ProtectPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageHeading } from '../lib/usePageHeading';
import { usePageFaqs } from '../lib/usePageGuide';

export const ProtectPage: React.FC = () => {
  const heading = usePageHeading('protect');

  const guide = usePageFaqs('protect');

  return (
    <ToolLayout
      title={heading.title}
      subtitle={heading.subtitle}
      contentLanguage={heading.language}
      seoContent={<ToolGuide toolName={heading.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <ProtectPdf />
    </ToolLayout>
  );
};