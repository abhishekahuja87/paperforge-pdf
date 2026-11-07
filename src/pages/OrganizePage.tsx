import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { OrganizePdf } from '../components/tools/OrganizePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const OrganizePage: React.FC = () => {

  const guide = usePageGuide('organize');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <OrganizePdf />
    </ToolLayout>
  );
};

export default OrganizePage;