import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ExtractText } from '../components/tools/ExtractText';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const ExtractTextPage: React.FC = () => {
  const steps = [
    {
      title: 'Upload PDF Document',
      description: 'Select or drag your PDF document into the upload area above.',
    },
    {
      title: 'Extract Text Content',
      description: 'Click Extract Text to read and parse all character and line data directly in browser memory.',
    },
    {
      title: 'Copy or Download',
      description: 'Copy the full extracted text with one click or download it as a structured .txt file.',
    },
  ];

  const faqs = [
    {
      question: `Is extracting text safe on ${siteConfig.name}?`,
      answer:
        'Yes. All text extraction runs locally on your machine via PDF.js in a client-side Web Worker. Your document never leaves your browser.',
    },
    {
      question: 'Can this tool read scanned PDFs or photos of text?',
      answer:
        'This tool extracts embedded digital text streams. Scanned documents or image-only PDFs require Optical Character Recognition (OCR), which is not yet supported for pure text streams.',
    },
    {
      question: 'Does the extraction preserve layout formatting?',
      answer:
        'Extracted text retains paragraph structure and page division markers (e.g. --- Page N ---) for clean reading and copy-pasting.',
    },
    {
      question: 'Is there a limit on how long the document can be?',
      answer:
        'No artificial page limits are enforced. The capacity depends solely on your computer’s available browser memory.',
    },
  ];

  return (
    <ToolLayout
      title="Extract Text from PDF"
      subtitle="Read, copy, and export all digital text content from your PDF documents into plain text directly in your browser."
      seoContent={<ToolGuide toolName="Extract Text" steps={steps} faqs={faqs} />}
    >
      <ExtractText />
    </ToolLayout>
  );
};

export default ExtractTextPage;