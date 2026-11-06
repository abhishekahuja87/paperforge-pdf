import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MergePdf } from '../components/tools/MergePdf';
import { ToolGuide } from '../components/common/ToolGuide';

export const MergePage: React.FC = () => {
  const steps = [
    {
      title: 'Add your PDFs',
      description: 'Choose two or more files, or drop them into the box.',
    },
    {
      title: 'Set the order',
      description: 'Move files up or down. The first file becomes page 1.',
    },
    {
      title: 'Merge and save',
      description: 'Combine them and download the finished PDF.',
    },
  ];

  const faqs = [
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
      title="Merge PDF"
      subtitle="Combine multiple PDFs into one document, in the order you choose."
      appearance="workshop"
      steps={steps}
      seoContent={<ToolGuide toolName="Merge PDF" faqs={faqs} appearance="workshop" />}
    >
      <MergePdf />
    </ToolLayout>
  );
};