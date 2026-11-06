import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { DeletePagesPdf } from '../components/tools/DeletePagesPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const DeletePagesPage: React.FC = () => {

  const guide = usePageGuide('delete');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <DeletePagesPdf />
    </ToolLayout>
  );
};