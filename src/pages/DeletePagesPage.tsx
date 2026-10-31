import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { DeletePagesPdf } from '../components/tools/DeletePagesPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const DeletePagesPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Upload the document containing pages you wish to eliminate.',
    },
    {
      title: 'Specify Pages',
      description: 'Enter page numbers or ranges (e.g. 1, 3, 5-8) to remove.',
    },
    {
      title: 'Save Clean File',
      description: 'Delete target pages directly in client RAM and download immediately.',
    },
  ];

  const faqs = [
    {
      question: `Is it safe to delete pages from confidential PDFs on ${siteConfig.name}?`,
      answer:
        'Yes. All file manipulation takes place locally inside your browser sandbox via WebAssembly. No documents or page contents are ever transmitted to a server.',
    },
    {
      question: 'Can I remove the cover page or blank trailing pages?',
      answer:
        'Yes. Use the quick buttons for First Page or Last Page, or type comma-separated values like "1, 10" to strip them out.',
    },
    {
      question: 'Will deleting pages affect document links or quality?',
      answer:
        'Vector shapes, fonts, and remaining pages retain 100% of their original clarity and resolution.',
    },
  ];

  return (
    <ToolLayout
      title="Delete PDF Pages"
      subtitle="Remove unnecessary, blank, or confidential pages from any PDF document. 100% private, executed locally."
      seoContent={<ToolGuide toolName="Delete PDF Pages" steps={steps} faqs={faqs} />}
    >
      <DeletePagesPdf />
    </ToolLayout>
  );
};