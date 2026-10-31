import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { AddPageNumbers } from '../components/tools/AddPageNumbers';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const AddPageNumbersPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Upload your document to stamp pagination onto.',
    },
    {
      title: 'Customize Format & Position',
      description: 'Choose header or footer placement, format (Page X of Y or 1/Y), typography, and cover page skips.',
    },
    {
      title: 'Stamp & Download',
      description: 'Page numbers are rendered directly into the PDF coordinate system in browser RAM.',
    },
  ];

  const faqs = [
    {
      question: `Does adding page numbers re-render existing text on ${siteConfig.name}?`,
      answer:
        'No. The original page contents, fonts, vector drawings, and images remain untouched. New typography text streams are overlaid directly at exact point coordinates.',
    },
    {
      question: 'Can I omit the cover or title page?',
      answer:
        'Yes. Enable the "Skip first page" checkbox to start numbering from page 2 onward.',
    },
    {
      question: 'Are my confidential documents uploaded to a server?',
      answer:
        'Never. All processing is executed client-side inside your browser sandbox using WebAssembly.',
    },
  ];

  return (
    <ToolLayout
      title="Add Page Numbers to PDF"
      subtitle="Stamp custom page numbers, headers, and footers onto PDF documents. 100% private in-browser execution."
      seoContent={<ToolGuide toolName="Add Page Numbers" steps={steps} faqs={faqs} />}
    >
      <AddPageNumbers />
    </ToolLayout>
  );
};