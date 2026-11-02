import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { AddPageNumbers } from '../components/tools/AddPageNumbers';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const AddPageNumbersPage: React.FC = () => {
  const steps = [
    {
      title: 'Select PDF',
      description: 'Select the PDF that needs page numbers, a header, or a footer.',
    },
    {
      title: 'Customize Format & Position',
      description: 'Choose header or footer placement, format (Page X of Y or 1/Y), typography, and cover page skips.',
    },
    {
      title: 'Stamp & Download',
      description: 'Preview the page-number settings and generate a revised PDF in your browser.',
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
        'The selected PDF is processed in your browser and is not uploaded to MyDailyUtils for processing. The website may make separate requests for advertising and supporting resources.',
    },
  ];

  return (
    <ToolLayout
      title="Add Page Numbers to PDF"
      subtitle="Add page numbers, headers, and footers to a PDF using your browser."
      seoContent={<ToolGuide toolName="Add Page Numbers" steps={steps} faqs={faqs} />}
    >
      <AddPageNumbers />
    </ToolLayout>
  );
};