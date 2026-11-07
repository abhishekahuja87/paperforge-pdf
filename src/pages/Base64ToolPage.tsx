import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { Base64Hash } from '../components/tools/Base64Hash';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePageGuide } from '../lib/usePageGuide';

export const Base64ToolPage: React.FC = () => {
  const guide = usePageGuide('base64');
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={guide.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <Base64Hash />
    </ToolLayout>
  );
};

export default Base64ToolPage;
