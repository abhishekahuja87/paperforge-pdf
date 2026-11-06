import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ExtractText } from '../components/tools/ExtractText';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageHeading } from '../lib/usePageHeading';
import { siteConfig } from '../config/site';

export const ExtractTextPage: React.FC = () => {
  const heading = usePageHeading('extract');

  const faqs = [
    {
      question: `Is extracting text safe on ${siteConfig.name}?`,
      answer:
        'Text extraction runs in your browser. The selected PDF is not uploaded to MyDailyUtils for processing; PDF.js may request supporting character-map resources from a content delivery network.',
    },
    {
      question: 'Can this tool read scanned PDFs or photos of text?',
      answer:
        'This tool extracts embedded digital text streams. Scanned documents or image-only PDFs require Optical Character Recognition (OCR), which is not yet supported for pure text streams.',
    },
    {
      question: 'Does the extraction preserve layout formatting?',
      answer:
        'The tool separates extracted text by page, but it does not preserve the exact visual layout, columns, or typography of the PDF.',
    },
    {
      question: 'Is there a limit on how long the document can be?',
      answer:
        'There is no fixed page limit in the interface, but large PDFs may take longer or exceed available browser memory. Scanned pages are not OCR-processed.',
    },
  ];

  return (
    <ToolLayout
      title={heading.title}
      subtitle={heading.subtitle}
      contentLanguage={heading.language}
      seoContent={<ToolGuide toolName="Extract Text" faqs={faqs} />}
    >
      <ExtractText />
    </ToolLayout>
  );
};

export default ExtractTextPage;