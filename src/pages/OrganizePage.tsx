import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { OrganizePdf } from '../components/tools/OrganizePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const OrganizePage: React.FC = () => {
  const steps = [
    {
      title: 'Select a PDF',
      description: 'Choose or drag your PDF into the file selection area above.',
    },
    {
      title: 'Organize Pages',
      description: 'Use the arrow controls to rearrange page sequence, rotate individual sheets, or delete unwanted pages.',
    },
    {
      title: 'Save & Download',
      description: 'Click Save and Download PDF to re-encode your pages in browser memory and download the final file.',
    },
  ];

  const faqs = [
    {
      question: `Is organizing PDF pages safe on ${siteConfig.name}?`,
      answer:
        'The selected PDF is rendered and reorganized in your browser; it is not uploaded to MyDailyUtils for processing. The website makes separate requests for resources and advertising.',
    },
    {
      question: 'Can I remove specific pages from my PDF?',
      answer:
        'Yes. Click the trash icon on any page thumbnail to drop that page from the final assembled document.',
    },
    {
      question: 'Will rotating pages affect document quality?',
      answer:
        'No. Rotation updates the structural transformation matrix metadata of the page stream without re-compressing or rasterizing vector text.',
    },
    {
      question: 'Is there a limit on how many pages I can organize?',
      answer:
        'There is no fixed page limit in the interface, but rendering and reorganizing large PDFs may take longer or exceed available browser memory.',
    },
  ];

  return (
    <ToolLayout
      title="Organize PDF Pages"
      subtitle="Reorder, rotate, or delete PDF pages visually in your browser."
      seoContent={<ToolGuide toolName="Organize PDF" steps={steps} faqs={faqs} />}
    >
      <OrganizePdf />
    </ToolLayout>
  );
};

export default OrganizePage;