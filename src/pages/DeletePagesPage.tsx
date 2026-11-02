import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { DeletePagesPdf } from '../components/tools/DeletePagesPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const DeletePagesPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Select the PDF that contains pages you want to remove.',
    },
    {
      title: 'Specify Pages',
      description: 'Enter page numbers or ranges (e.g. 1, 3, 5-8) to remove.',
    },
    {
      title: 'Save Clean File',
      description: 'Remove the selected pages in your browser, then download and review the revised PDF.',
    },
  ];

  const faqs = [
    {
      question: `Is it safe to delete pages from confidential PDFs on ${siteConfig.name}?`,
      answer:
        'The selected PDF is processed in your browser and is not uploaded to MyDailyUtils for processing. Advertising and other site requests are separate from the file operation.',
    },
    {
      question: 'Can I remove the cover page or blank trailing pages?',
      answer:
        'Yes. Use the quick buttons for First Page or Last Page, or type comma-separated values like "1, 10" to strip them out.',
    },
    {
      question: 'Will deleting pages affect document links or quality?',
      answer:
        'The tool removes selected pages without rasterizing the remaining page content. Check forms, links, or other document features in the saved copy.',
    },
  ];

  return (
    <ToolLayout
      title="Delete PDF Pages"
      subtitle="Remove unnecessary, blank, or confidential pages from a PDF using your browser."
      seoContent={<ToolGuide toolName="Delete PDF Pages" steps={steps} faqs={faqs} />}
    >
      <DeletePagesPdf />
    </ToolLayout>
  );
};