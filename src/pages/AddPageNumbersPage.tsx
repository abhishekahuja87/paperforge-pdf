import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { AddPageNumbers } from '../components/tools/AddPageNumbers';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const AddPageNumbersPage: React.FC = () => {

  const guide = usePageGuide('pageNumbers');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <AddPageNumbers />
    </ToolLayout>
  );
};