import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MergePdf } from '../components/tools/MergePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const MergePage: React.FC = () => {
  const steps = [
    {
      title: 'Upload PDFs',
      description: 'Select or drag multiple PDF files into the upload box above.',
    },
    {
      title: 'Organize Order',
      description: 'Drag and reorder files to define how pages appear in the final document.',
    },
    {
      title: 'Merge & Save',
      description: 'Click Merge to assemble them in browser RAM and instantly download.',
    },
  ];

  const faqs = [
    {
      question: `Is merging PDFs safe on ${siteConfig.name}?`,
      answer:
        'Yes. All file merging takes place on your device CPU via WebAssembly. Your files are never uploaded across the internet.',
    },
    {
      question: 'Is there a limit on file size or quantity?',
      answer:
        'No artificial server limits exist. Processing capacity depends solely on your device memory.',
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
      subtitle="Combine multiple PDFs into a single unified file in seconds without uploading to any server."
      seoContent={<ToolGuide toolName="Merge PDF" steps={steps} faqs={faqs} />}
    >
      <MergePdf />
    </ToolLayout>
  );
};