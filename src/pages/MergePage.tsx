import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MergePdf } from '../components/tools/MergePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const MergePage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDFs',
      description: 'Select or drag multiple PDF files into the upload box above.',
    },
    {
      title: 'Set File Order',
      description: 'Drag and reorder files to define how pages appear in the final document.',
    },
    {
      title: 'Merge & Save',
      description: 'Combine the selected files in your browser, then download and review the merged PDF.',
    },
  ];

  const faqs = [
    {
      question: `Is merging PDFs safe on ${siteConfig.name}?`,
      answer:
        'Selected PDFs are processed in your browser and are not uploaded to MyDailyUtils for processing. The site makes separate requests for resources and advertising.',
    },
    {
      question: 'Is there a limit on file size or quantity?',
      answer:
        'The tool does not set a fixed file-size limit, but browser memory and device performance limit what can be processed. Very large files may fail or take longer.',
    },
    {
      question: 'Can I reorder individual pages?',
      answer:
        'You can arrange whole files in sequence. To extract or reorganize individual pages, use the Split PDF utility.',
    },
    {
      question: 'Do I need to create an account or sign up?',
      answer:
        'No registration, subscriptions, or personal details are required. All utilities run freely in your browser.',
    },
  ];

  return (
    <ToolLayout
      title="Merge PDF Documents"
      subtitle="Combine multiple PDFs into one document in your browser, then download the merged file."
      seoContent={<ToolGuide toolName="Merge PDF" steps={steps} faqs={faqs} />}
    >
      <MergePdf />
    </ToolLayout>
  );
};