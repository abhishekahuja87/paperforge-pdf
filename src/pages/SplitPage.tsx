import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { SplitPdf } from '../components/tools/SplitPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const SplitPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Drop or select the PDF document you wish to extract pages from.',
    },
    {
      title: 'Define Pages',
      description: 'Enter specific pages or comma-separated ranges (e.g. 1-3, 5, 8).',
    },
    {
      title: 'Extract & Save',
      description: 'Extract the designated pages into a fresh document ready for instant download.',
    },
  ];

  const faqs = [
    {
      question: `Are my extracted pages uploaded to ${siteConfig.name}?`,
      answer:
        'Never. The parsing and extraction occur strictly in local client memory. No documents ever leave your machine.',
    },
    {
      question: 'How do I specify multiple separate page ranges?',
      answer:
        'Use dashes for ranges and commas for separates (e.g., "1-4, 7, 9-12"). You can also click "All Pages" to select everything.',
    },
    {
      question: 'Can I split password-protected PDFs?',
      answer:
        'Encrypted PDFs must be unlocked before client-side extraction can access their page tree.',
    },
    {
      question: 'Will splitting affect the original document quality?',
      answer:
        'No. Pages are extracted with their vector content, fonts, and images intact at full fidelity.',
    },
  ];

  return (
    <ToolLayout
      title="Split PDF Document"
      subtitle="Extract selected page ranges into a separate PDF in your browser."
      seoContent={<ToolGuide toolName="Split PDF" steps={steps} faqs={faqs} />}
    >
      <SplitPdf />
    </ToolLayout>
  );
};