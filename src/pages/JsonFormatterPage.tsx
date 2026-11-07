import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { JsonFormatter } from '../components/tools/JsonFormatter';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePageGuide } from '../lib/usePageGuide';

export const JsonFormatterPage: React.FC = () => {
  const guide = usePageGuide('jsonFormatter');
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={guide.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <JsonFormatter />
    </ToolLayout>
  );
};

export default JsonFormatterPage;
