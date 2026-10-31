import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { OrganizePdf } from '../components/tools/OrganizePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const OrganizePage: React.FC = () => {
  const steps = [
    {
      title: 'Upload PDF',
      description: 'Select or drag your PDF document into the upload box above.',
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
        'Yes. All thumbnail rendering, page reordering, rotation, and re-assembly occur locally on your machine via Web Workers and WebAssembly. Your files are never sent to any server.',
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
        'No artificial page limits are enforced. Capacity depends strictly on your device’s available browser memory to render visual thumbnails.',
    },
  ];

  return (
    <ToolLayout
      title="Organize PDF Pages"
      subtitle="Reorder, rotate, or delete individual pages visually in your browser with zero server uploads."
      seoContent={<ToolGuide toolName="Organize PDF" steps={steps} faqs={faqs} />}
    >
      <OrganizePdf />
    </ToolLayout>
  );
};

export default OrganizePage;